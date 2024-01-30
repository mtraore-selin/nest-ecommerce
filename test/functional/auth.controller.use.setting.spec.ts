import { AuthService } from "../../src/auth/auth.sevice"
import { AuthController } from "../../src/auth/auth.controller"
import {
	AppContext,
	setupApplication,
	teardownApplication,
} from "../test-helpers"
import { signupDTOMock, token } from "../mocks/auth.service.mock"

import { createParamDecorator } from "@nestjs/common"

describe("AuthController", () => {
	let appContext: AppContext
	let controller: AuthController
	let authService: AuthService

	beforeAll(async () => {
		appContext = await setupApplication()

		controller = appContext.application.get(AuthController)
		authService = appContext.application.get(AuthService)
	})

	afterAll(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
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

		expect(authService.signup).toBeCalled()
		expect(response.status).toBe(201)
		expect(response.body).toEqual(signupDTOMock)
	})

	it("login", async () => {
		authService.login = jest.fn().mockResolvedValue({ token })
		const response = await appContext.request.post("/auth/login", {
			email: "test@gmail.com",
			password: "password",
		})
		expect(authService.login).toBeCalled()
		expect(response.status).toBe(200)
		expect(response.body).toEqual({ token })
	})

	it("getCurrentUser [401]", async () => {
		const response = await appContext.request.get("/auth/profile")
		expect(response.status).toBe(401)
	})

	// it("getCurrentUser [200]", async () => {
	// 	const authToken = "valid-jwt-token"
	// 	jest.fn().mockResolvedValue({ token: authToken })
	// 	const respLogin = await appContext.request.post("/auth/login", {
	// 		email: "test@gmail.com",
	// 		password: "password",
	// 	})

	// 	const response = await appContext.request
	// 		.get("/auth/profile")
	// 		.set("Authorization", `Bearer ${respLogin.body.token}`)

	// 	expect(response.body).toEqual({ id: "id", password: "password" })
	// })
})
