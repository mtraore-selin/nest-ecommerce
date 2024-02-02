import {
	AppContext,
	setupApplication,
	teardownApplication,
} from "../test-helpers"
import { Model } from "mongoose"
import { User, UserDocument } from "../../src/user/user.schema"
import { getModelToken } from "@nestjs/mongoose"
import { UserService } from "../../src/user/user.service"
import { AuthService } from "../../src/auth/auth.sevice"
import { ACCESS_TOKEN_NO_EXPIRE } from "../fixtures"
import { ProductService } from "../../src/product/product.service"
import { Product, ProductDocument } from "../../src/product/product.schema"

describe("ProductController", () => {
	let appContext: AppContext
	let productService: ProductService
	let authService: AuthService
	let productModel: Model<ProductDocument>
	let userModel: Model<UserDocument>

	const product = {
		id: "123",
		name: "product",
		description: "product description",
		price: 100,
		quantity: 10,
		image: "image",
		reviews: [],
	}
	const userInfo = {
		email: "test@gmail.com",
		password: "test",
		role: "admin",
	}
	beforeAll(async () => {
		appContext = await setupApplication()
		productModel = await appContext.application.get(
			getModelToken(Product.name),
		)
		userModel = await appContext.application.get(getModelToken(User.name))

		productService = appContext.application.get(UserService)
		authService = appContext.application.get(AuthService)
	})

	afterAll(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await productModel.deleteMany({})
		await userModel.deleteMany({})
		await teardownApplication(appContext?.application)
	})

	it("App, Controller, ProductService, AuthService should be defined", () => {
		expect(appContext.application).toBeDefined()
		expect(productService).toBeDefined()
		expect(userModel).toBeDefined()
	})

	it("getProducts [200]", async () => {
		productModel.find = jest.fn().mockResolvedValue([product])
		const response = await appContext.request.get("/products")
		expect(response.status).toBe(200)
		expect(response.body).toEqual({ products: [product] })
	})

	it("createProduct [201]", async () => {
		productModel.create = jest.fn().mockResolvedValue(product)

		userModel.find = jest.fn().mockResolvedValue([userInfo])
		userModel.findById = jest.fn().mockResolvedValue(userInfo)

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		const respLogin = await appContext.request.post("/auth/login", userInfo)

		productService.createProduct = jest.fn().mockResolvedValue(product)
		const response = await appContext.request
			.post("/products", product)
			.set("Authorization", `${respLogin.body.token}`)

		expect(response.status).toBe(201)
		expect(response.body).toEqual({ product })
	})
	it("getProduct [200]", async () => {
		productModel.findById = jest.fn().mockImplementation(() => {
			return {
				populate: jest.fn().mockResolvedValue(product),
			}
		})
		productService.getProduct = jest.fn().mockResolvedValue(product)
		const response = await appContext.request.get(
			"/products/582f1e05c7a9dced018b4574",
		)

		expect(response.status).toBe(200)
		expect(response.body).toEqual({ product })
	})

	it("updateProduct [200]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
			role: "admin",
		}
		productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(product)

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		productService.updateProduct = jest.fn().mockResolvedValue(product)
		const respLogin = await appContext.request.post("/auth/login", userInfo)
		const response = await appContext.request
			.put("/products/582f1e05c7a9dced018b4574", product)
			.set("Authorization", `${respLogin.body.token}`)

		expect(response.status).toBe(200)
		expect(response.body).toEqual({ product })
	})

	it("deleteUser [201]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
			role: "admin",
		}
		productModel.findById = jest.fn().mockResolvedValue(product)

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		productService.deleteProduct = jest.fn().mockResolvedValue(product)
		const respLogin = await appContext.request.post("/auth/login", userInfo)
		const response = await appContext.request
			.delete("/products/582f1e05c7a9dced018b4574")
			.set("Authorization", `${respLogin.body.token}`)

		expect(response.status).toBe(200)
		expect(response.body).toEqual({
			message: "Product deleted successfully",
		})
	})
})
