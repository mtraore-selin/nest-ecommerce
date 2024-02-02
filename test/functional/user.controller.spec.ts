import {
	AppContext,
	setupApplication,
	teardownApplication,
} from "../test-helpers"
import { Model } from "mongoose"
import { User, UserDocument } from "../../src/user/user.schema"
import { getModelToken } from "@nestjs/mongoose"
import { UserController } from "../../src/user/user.controller"
import { UserService } from "../../src/user/user.service"
import { AuthService } from "../../src/auth/auth.sevice"
import { ACCESS_TOKEN_NO_EXPIRE } from "../fixtures"

describe("UserController", () => {
	let appContext: AppContext
	let controller: UserController
	let userService: UserService
	let authService: AuthService
	let userModel: Model<UserDocument>

	beforeAll(async () => {
		appContext = await setupApplication()
		userModel = await appContext.application.get(getModelToken(User.name))

		controller = appContext.application.get(UserController)
		userService = appContext.application.get(UserService)
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

	it("UserService to be defined", () => {
		expect(userService).toBeDefined()
	})

	it("UserModel to be defined", () => {
		expect(userModel).toBeDefined()
	})

	it("getUsers [200]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
			role: "admin",
		}
		userModel.find = jest.fn().mockResolvedValue([userInfo])
		userModel.findById = jest.fn().mockResolvedValue(userInfo)

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		userService.getUsers = jest.fn().mockResolvedValue([userInfo])
		const respLogin = await appContext.request.post("/auth/login", userInfo)
		const response = await appContext.request
			.get("/users")
			.set("Authorization", `${respLogin.body.token}`)

		expect(userService.getUsers).toBeCalled()
		expect(response.status).toBe(200)
		expect(response.body).toEqual([userInfo])
	})

	it("createUser [200]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
			role: "admin",
		}
		userModel.findOne = jest.fn().mockResolvedValue(null)
		userModel.create = jest.fn().mockResolvedValue(userInfo)

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		userService.createUser = jest.fn().mockResolvedValue(userInfo)
		const respLogin = await appContext.request.post("/auth/login", userInfo)
		const response = await appContext.request
			.post("/users", userInfo)
			.set("Authorization", `${respLogin.body.token}`)

		expect(userService.createUser).toBeCalledWith(userInfo)
		expect(response.status).toBe(201)
		expect(response.body).toEqual(userInfo)
	})
	it("getUser [200]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
			role: "admin",
		}
		userModel.findById = jest
			.fn()
			.mockResolvedValue({ ...userInfo, _id: "id" })
		userService.getUser = jest.fn().mockResolvedValue(userInfo)
		const response = await appContext.request.get(
			"/users/582f1e05c7a9dced018b4574",
		)

		expect(userService.getUser).toBeCalledWith("582f1e05c7a9dced018b4574")
		expect(response.status).toBe(200)
		expect(response.body).toEqual(userInfo)
	})

	it("updateUser [201]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
			role: "admin",
		}
		userModel.findById = jest.fn().mockResolvedValue(userInfo)

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		userService.updateUser = jest.fn().mockResolvedValue(userInfo)
		const respLogin = await appContext.request.post("/auth/login", userInfo)
		const response = await appContext.request
			.put("/users/582f1e05c7a9dced018b4574", userInfo)
			.set("Authorization", `${respLogin.body.token}`)

		expect(userService.updateUser).toBeCalledWith(
			"582f1e05c7a9dced018b4574",
			userInfo,
			userInfo,
		)
		expect(response.status).toBe(200)
		expect(response.body).toEqual(userInfo)
	})

	it("deleteUser [201]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
			role: "admin",
		}
		userModel.findById = jest.fn().mockResolvedValue(userInfo)

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		userService.deleteUser = jest.fn().mockResolvedValue({})
		const respLogin = await appContext.request.post("/auth/login", userInfo)
		const response = await appContext.request
			.delete("/users/582f1e05c7a9dced018b4574")
			.set("Authorization", `${respLogin.body.token}`)

		expect(userService.deleteUser).toBeCalledWith(
			"582f1e05c7a9dced018b4574",
			userInfo,
		)
		expect(response.status).toBe(200)
		expect(response.body).toEqual({})
	})
})
