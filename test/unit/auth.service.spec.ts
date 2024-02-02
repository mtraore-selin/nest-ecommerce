import { AuthService } from "../../src/auth/auth.sevice"
import {
	AppContext,
	setupApplication,
	teardownApplication,
} from "../test-helpers"
import { Model } from "mongoose"
import { User, UserDocument } from "../../src/user/user.schema"
import { getModelToken } from "@nestjs/mongoose"
import { Role } from "../../src/role/role.enum"
import {
	BadRequestException,
	InternalServerErrorException,
	NotFoundException,
} from "@nestjs/common"
import { createHash } from "crypto"
import { SendMailService } from "../../src/utils/send-mail/send-mail.service"

describe("AuthController", () => {
	let appContext: AppContext
	let authService: AuthService
	let sendEmailService: SendMailService
	let userModel: Model<UserDocument>
	const userInfo = {
		name: "<NAME>",
		email: "foo@bar.com",
		password: "<PASSWORD>",
		phone: "0777777777",
		role: Role.User,
	}

	beforeAll(async () => {
		appContext = await setupApplication()
		userModel = await appContext.application.get(getModelToken(User.name))

		authService = appContext.application.get(AuthService)
		sendEmailService = appContext.application.get(SendMailService)
	})

	afterAll(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await userModel.deleteMany({})
		await teardownApplication(appContext?.application)
	})

	beforeEach(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await userModel.deleteMany({})
	})

	describe("Signup", () => {
		it("[signup] user already exists with the entered email", async () => {
			const message = `Conflict Exception`
			await userModel.create({
				email: "foo@bar.com",
				password: "to1(édP;",
				name: "mane",
				phone: "123",
			})

			await expect(authService.signup(userInfo)).rejects.toThrow(message)
		})

		it("[signup] 200", async () => {
			await userModel.create(userInfo)
			const email = "test@test.com"
			const result = await authService.signup({
				...userInfo,
				email,
			})

			expect(result.user.email).toBe(email)
		})
	})

	describe("Login", () => {
		it("throws NotFoundException when user does not exist", async () => {
			const loginDto = {
				email: userInfo.email,
				password: userInfo.password,
			}

			await expect(authService.login(loginDto)).rejects.toThrowError(
				NotFoundException,
			)
		})

		it("throws BadRequestException when password is invalid", async () => {
			await userModel.create(userInfo)

			const loginDto = {
				email: userInfo.email,
				password: "incorrectPassword",
			}

			await expect(authService.login(loginDto)).rejects.toThrowError(
				BadRequestException,
			)
		})

		it("returns token when login is successful", async () => {
			await userModel.create(userInfo)

			const loginDto = {
				email: userInfo.email,
				password: userInfo.password,
			}

			const result = await authService.login(loginDto)

			expect(result.token).toBeDefined()
		})
	})

	describe("UpdatePassword", () => {
		it("throws BadRequestException when current password is invalid", async () => {
			await userModel.create(userInfo)

			const updatePasswordDto = {
				password: "incorrectPassword",
				newPassword: "newSecurePassword",
			}

			const currentUser = await userModel.findOne({
				email: userInfo.email,
			})

			await expect(
				authService.updatePassword(updatePasswordDto, currentUser),
			).rejects.toThrowError(BadRequestException)
		})

		it("updates password successfully", async () => {
			await userModel.create(userInfo)

			const updatePasswordDto = {
				password: userInfo.password,
				newPassword: "newSecurePassword",
			}

			const currentUser = await userModel.findOne({
				email: userInfo.email,
			})

			const result = await authService.updatePassword(
				updatePasswordDto,
				currentUser,
			)

			// Check that the password has been updated
			expect(result.user.password).not.toBe(userInfo.password)

			// Check that the password is properly hashed
			const updatedUser = await userModel
				.findById(currentUser.id)
				.select("+password")
			const isMatch = await updatedUser.matchPassword(
				updatePasswordDto.newPassword,
			)
			expect(isMatch).toBeTruthy()
		})
	})

	describe("ForgotPassword", () => {
		it("throws when providing an invalid email (non-existing user)", async () => {
			const nonExistingEmail = "nonexistinguser@example.com"
			const mockRequest = {
				protocol: "http",
				get: jest.fn(() => "localhost"),
			} as unknown as any

			await expect(
				authService.forgotPassword(mockRequest, nonExistingEmail),
			).rejects.toThrowError(NotFoundException)
		})

		it("throws InternalServerErrorException when provide an invalid email", async () => {
			const errorEmailMsg = "Email could not be sent"
			await userModel.create(userInfo)

			const resetPasswordDto = {
				email: userInfo.email,
			}

			await userModel.findOne({ email: userInfo.email })
			sendEmailService.sendEmail = jest
				.fn()
				.mockRejectedValue(
					new InternalServerErrorException([errorEmailMsg]),
				)

			const mockRequest = {
				protocol: "http",
				get: jest.fn(() => "localhost"),
			} as unknown as any

			await expect(
				authService.forgotPassword(mockRequest, resetPasswordDto.email),
			).rejects.toThrowError(InternalServerErrorException)
		})

		it("sends password reset email for a valid email", async () => {
			const message = "Please check your email"
			await userModel.create(userInfo)

			const resetPasswordDto = {
				email: userInfo.email,
			}

			await userModel.findOne({ email: userInfo.email })
			sendEmailService.sendEmail = jest.fn().mockResolvedValue("email")

			const mockRequest = {
				protocol: "http",
				get: jest.fn(() => "localhost"),
			} as unknown as any

			const response = await authService.forgotPassword(
				mockRequest,
				resetPasswordDto.email,
			)
			expect(response.message).toBe(message)
		})
	})

	describe("ResetPassword", () => {
		it("throws BadRequestException when providing an undefined token", async () => {
			const invalidToken = ""

			await expect(
				authService.resetPassword(
					{ password: "newSecurePassword" },
					invalidToken,
				),
			).rejects.toThrowError(BadRequestException)
		})
		it("throws BadRequestException when providing an invalid token", async () => {
			const invalidToken = "invalidToken"

			await expect(
				authService.resetPassword(
					{ password: "newSecurePassword" },
					invalidToken,
				),
			).rejects.toThrowError(BadRequestException)
		})

		it("throws BadRequestException when providing an expired token", async () => {
			const expiredToken = "expiredToken"
			const expiredTimestamp = Date.now() - 3600001 // 1 hour + 1 millisecond ago

			const hashedToken = createHash("sha256")
				.update(expiredToken)
				.digest("base64")

			await userModel.create({
				...userInfo,
				resetPasswordToken: hashedToken,
				resetPasswordExpire: expiredTimestamp,
			})

			await expect(
				authService.resetPassword(
					{ password: "newSecurePassword" },
					expiredToken,
				),
			).rejects.toThrowError(BadRequestException)
		})

		it("resets password successfully for a valid token", async () => {
			const validToken = "validToken"
			const validTimestamp = Date.now() + 3600000 // 1 hour from now

			const hashedToken = createHash("sha256")
				.update(validToken)
				.digest("base64")

			const user = await userModel.create({
				...userInfo,
				resetPasswordToken: hashedToken,
				resetPasswordExpire: validTimestamp,
			})

			const newPassword = "newSecurePassword"
			const result = await authService.resetPassword(
				{ password: newPassword },
				validToken,
			)

			// Check that the password has been updated
			expect(result.user.password).not.toBe(userInfo.password)

			// Check that the password is properly hashed
			const updatedUser = await userModel
				.findById(user.id)
				.select("+password")
			const isMatch = await updatedUser.matchPassword(newPassword)
			expect(isMatch).toBeTruthy()
		})
	})
})
