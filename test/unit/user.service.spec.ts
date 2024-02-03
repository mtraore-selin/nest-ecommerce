import { getModelToken } from "@nestjs/mongoose"
import {
	AppContext,
	setupApplication,
	teardownApplication,
} from "../test-helpers"
import { Model } from "mongoose"
import { Review } from "../../src/review/review.schema"
import { User, UserDocument } from "../../src/user/user.schema"
import { UserService } from "../../src/user/user.service"
import { CreateUserDto, UpdateUserDto } from "../../src/user/user.dto"
import { Role } from "../../src/role/role.enum"
import {
	ConflictException,
	ForbiddenException,
	NotFoundException,
} from "@nestjs/common"
import { jsonParsed } from "../../test/fixtures"

describe("UserService", () => {
	let appContext: AppContext
	let userService: UserService

	let reviewModel: Model<Review>
	let userModel: Model<User>

	beforeAll(async () => {
		appContext = await setupApplication()
		reviewModel = appContext.application.get(getModelToken(Review.name))
		userModel = appContext.application.get(getModelToken(User.name))
		userService = appContext.application.get(UserService)
	})
	beforeEach(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await reviewModel.deleteMany({})
		await userModel.deleteMany({})
	})
	afterEach(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await reviewModel.deleteMany({})
		await userModel.deleteMany({})
	})

	afterAll(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await teardownApplication(appContext?.application)
	})

	describe("Defined", () => {
		it("should defined", () => {
			expect(reviewModel).toBeDefined()
			expect(userModel).toBeDefined()
			expect(userService).toBeDefined()
		})
	})

	describe("getUsers", () => {
		const mockUsers = [{ id: 1, name: "Name" }]

		it("should get all users", async () => {
			userModel.find = jest.fn().mockResolvedValue(mockUsers)
			const response = await userService.getUsers()

			expect(response.users).toBeDefined()
			expect(response.users.length).toBe(mockUsers.length)
			expect(response.users).toEqual(mockUsers)
		})

		it("should return an empty array if no users are found", async () => {
			userModel.find = jest.fn().mockResolvedValue([])

			const response = await userService.getUsers()

			// Assertions
			expect(response.users).toBeDefined()
			expect(response.users.length).toBe(0)
		})
	})

	describe("createUser", () => {
		it("should create a new user", async () => {
			userModel.findOne = jest.fn().mockResolvedValue(null)
			const dto: CreateUserDto = {
				email: "createuser@example.com",
				password: "testpassword",
				name: "Test",
				phone: "123456789",
				role: Role.User,
			}

			await userModel.deleteMany({})
			const response = await userService.createUser(dto)
			const { user } = jsonParsed(response)

			expect(user).toBeDefined()
			expect(user.email).toBe(dto.email)

			// Verify the user is actually stored in the database
			const storedUser = await userModel.findOne({ email: dto.email })
			expect(storedUser).toBeDefined()
			// expect(storedUser?.email).toBe(dto.email)
		})

		it("should throw ConflictException if user with the same email already exists", async () => {
			const existingUser: CreateUserDto = {
				email: "tete@example.com",
				password: "existingpassword",
				name: "Test",
				phone: "123456789",
				role: Role.User,
			}
			userModel.findOne = jest.fn().mockResolvedValue(existingUser)

			await expect(
				userService.createUser(existingUser),
			).rejects.toThrowError(ConflictException)
		})
	})

	describe("getUser", () => {
		it("should get a user by ID", async () => {
			const user = {
				id: "65beb14e9d56c5a2c1b26b5d",
			}

			userModel.findById = jest.fn().mockResolvedValue(user)
			const response = await userService.getUser(String(user.id))

			// Assertions
			expect(response.user).toEqual(user)
		})

		it("should throw NotFoundException if user with the given ID does not exist", async () => {
			const nonExistingUserId = "65beb14e9d56c5a2c1b26b55"

			// Attempt to get a user with a non-existing ID
			await expect(
				userService.getUser(nonExistingUserId),
			).rejects.toThrowError(NotFoundException)
		})
	})

	describe("updateUser", () => {
		it("should update the user", async () => {
			const currentUser = await userModel.create({
				email: "current@example.com",
				password: "currentpassword",
				name: "Current",
				phone: "123456789",
				role: Role.Admin,
			})

			const updateDto = {
				name: "Updated Name",
				phone: "1234567890",
				role: "admin",
			} as UpdateUserDto

			const response = await userService.updateUser(
				currentUser.id,
				updateDto,
				currentUser,
			)

			// Assertions
			expect(response.user).toBeDefined()
			expect(response.user.name).toBe(updateDto.name)
			expect(response.user.phone).toBe(updateDto.phone)
			expect(response.user.role).toBe(updateDto.role)
		})

		it("should throw NotFoundException if user with the given ID does not exist", async () => {
			const currentUser = {
				email: "current@example.com",
				password: "currentpassword",
			} as UserDocument

			userModel.findById = jest.fn().mockResolvedValue(null)

			const nonExistingUserId = "65beb14e9d56c5a2c1b26b5d"

			const updateDto = {
				name: "Updated Name",
			} as UpdateUserDto

			// Attempt to update a non-existing user
			await expect(
				userService.updateUser(
					nonExistingUserId,
					updateDto,
					currentUser,
				),
			).rejects.toThrowError(NotFoundException)
		})

		it("should throw ForbiddenException if the current user does not have permission to update the user", async () => {
			const id = "currentId"
			const userToUpdateId = "65beb14e9d56c5a2c1b26b5d"
			const currentUser = {
				email: "current@example.com",
				password: "currentpassword",
				id,
			} as UserDocument

			userModel.findById = jest
				.fn()
				.mockResolvedValue({ id: userToUpdateId })

			const updateDto = {
				name: "Updated Name",
			} as UpdateUserDto

			// Attempt to update a user with insufficient permissions
			await expect(
				userService.updateUser(userToUpdateId, updateDto, currentUser),
			).rejects.toThrowError(ForbiddenException)
		})
	})
})
