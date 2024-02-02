import { AuthService } from "../../src/auth/auth.sevice"
import { AuthController } from "../../src/auth/auth.controller"
import {
	ACCESS_TOKEN,
	AppContext,
	setupApplication,
	teardownApplication,
} from "../test-helpers"
import { signupDTOMock, token } from "../mocks/auth.service.mock"
import { ACCESS_TOKEN_NO_EXPIRE } from "../fixtures"
import { Model } from "mongoose"
import { User, UserDocument } from "../../src/user/user.schema"
import { getModelToken } from "@nestjs/mongoose"

describe("AuthController", () => {
	let appContext: AppContext
	let controller: AuthController
	let authService: AuthService
	let userModel: Model<UserDocument>

	beforeAll(async () => {
		appContext = await setupApplication()
		userModel = await appContext.application.get(getModelToken(User.name))

		controller = appContext.application.get(AuthController)
		authService = appContext.application.get(AuthService)
	})

	afterAll(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await userModel.deleteMany({})
		await teardownApplication(appContext?.application)
	})

	it("App defined", () => {
		expect(appContext.application).toBeDefined()
	})
	it("Controller defined", () => {
		expect(controller).toBeDefined()
	})

	it("signup", async () => {
		authService.signup = jest.fn().mockResolvedValue(signupDTOMock)
		const response = await appContext.request.post(
			"/auth/signup",
			signupDTOMock,
		)

		expect(authService.signup).toBeCalledWith(signupDTOMock)
		expect(response.status).toBe(201)
		expect(response.body).toEqual(signupDTOMock)
	})

	it("login", async () => {
		const loginDTO = {
			email: "test@gmail.com",
			password: "test",
		}
		authService.login = jest.fn().mockResolvedValue({ token })
		const response = await appContext.request.post("/auth/login", loginDTO)
		expect(authService.login).toBeCalledWith(loginDTO)
		expect(response.status).toBe(200)
		expect(response.body).toEqual({ token })
	})

	it("getCurrentUser [401]", async () => {
		const response = await appContext.request.get("/auth/profile")
		expect(response.status).toBe(401)
	})

	it("getCurrentUser [401] TokenExpiredError", async () => {
		const loginDTO = {
			email: "test@gmail.com",
			password: "test",
		}
		authService.login = jest.fn().mockResolvedValue({ token: ACCESS_TOKEN })
		const respLogin = await appContext.request.post("/auth/login", loginDTO)
		const response = await appContext.request
			.get("/auth/profile")
			.set("Authorization", `Bearer ${respLogin.body.token}`)

		expect(authService.login).toBeCalledWith(loginDTO)
		expect(response.status).toBe(401)
		expect(response.body.message).toEqual([
			"Login token expired",
			"Please login again",
		])
	})

	it("getCurrentUser [200]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
		}
		jest.mock("jsonwebtoken")
		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		userModel.findById = jest.fn().mockResolvedValue(userInfo)
		const respLogin = await appContext.request.post("/auth/login", userInfo)
		const response = await appContext.request
			.get("/auth/profile")
			.set("Authorization", `${respLogin.body.token}`)

		expect(authService.login).toBeCalledWith(userInfo)
		expect(response.status).toBe(200)
		expect(response.body.user).toEqual(userInfo)
	})

	it("update-password [200]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
		}
		const userUpdateDTO = {
			password: "<PASSWORD>",
			newPassword: "<NEW_PASSWORD>",
		}
		jest.mock("jsonwebtoken")
		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		userModel.findById = jest.fn().mockResolvedValue(userInfo)

		authService.updatePassword = jest
			.fn()
			.mockResolvedValue({ user: userInfo })

		const respLogin = await appContext.request.post("/auth/login", userInfo)

		const response = await appContext.request
			.put("/auth/update-password", userUpdateDTO)
			.set("Authorization", `${respLogin.body.token}`)

		expect(authService.login).toBeCalledWith(userInfo)
		expect(authService.updatePassword).toBeCalledWith(
			userUpdateDTO,
			userInfo,
		)
		expect(response.status).toBe(200)
		expect(response.body.user).toEqual(userInfo)
	})

	it("forgot-password [201]", async () => {
		const updatePassword = {
			password: "test",
			newPassword: "test",
		}
		const checkEmailMessage = { message: "Please check your email" }

		authService.forgotPassword = jest
			.fn()
			.mockResolvedValue(checkEmailMessage)

		const response = await appContext.request.post(
			"/auth/forgot-password?email=example@example.com",
			updatePassword,
		)

		expect(authService.login).toBeCalled()
		expect(authService.forgotPassword).toBeCalled()
		expect(response.status).toBe(201)
		expect(response.body).toEqual(checkEmailMessage)
	})

	it("reset-password [200]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
		}
		const resetPassword = {
			password: "test",
		}

		authService.resetPassword = jest.fn().mockResolvedValue(userInfo)

		const response = await appContext.request.put(
			"/auth/reset-password?token=myToken",
			resetPassword,
		)

		expect(authService.login).toBeCalledWith(userInfo)
		expect(authService.resetPassword).toBeCalledWith(
			resetPassword,
			"myToken",
		)
		expect(response.status).toBe(200)
		expect(response.body).toEqual(userInfo)
	})
})
