import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"

import { AuthService } from "../../src/auth/auth.sevice"
import {
	AuthServiceMock,
	signupDTOMock,
	token,
} from "../mocks/auth.service.mock"
import { getModelToken } from "@nestjs/mongoose"
import { User } from "../../src/user/user.schema"
import { Model } from "mongoose"
import { AuthController } from "../../src/auth/auth.controller"

describe("AuthController", () => {
	let app: INestApplication
	let controller: AuthController
	let userModel: Model<User>

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			providers: [
				{ provide: AuthService, useClass: AuthServiceMock },
				{ provide: getModelToken(User.name), useValue: userModel },
			],
			controllers: [AuthController],
		}).compile()

		app = moduleFixture.createNestApplication()
		await app.init()
		controller = app.get<AuthController>(AuthController)
	})

	afterAll(async () => {
		jest.clearAllMocks()
	})
	it("App defined", () => {
		expect(app).toBeDefined()
	})

	describe("signup", () => {
		it("should call authService.signup with the provided DTO", async () => {
			const signupDto = {
				name: "John Doe",
				email: "john@example.com",
				phone: "0777777777",
				password: "yourSecurePassword",
			}

			const response = await controller.signup(signupDto)

			expect(response).toEqual(signupDTOMock)
		})
	})

	describe("login", () => {
		it("should call authService.login with the provided DTO", async () => {
			const signDto = {
				email: "john@example.com",
				password: "yourSecurePassword",
			}

			const response = await controller.login(signDto)

			expect(response).toEqual({ token })
		})
	})
})
