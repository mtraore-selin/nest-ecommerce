import {
	AppContext,
	setupApplication,
	teardownApplication,
} from "../test-helpers"
import { Model } from "mongoose"
import { User, UserDocument } from "../../src/user/user.schema"
import { getModelToken } from "@nestjs/mongoose"
import { AuthService } from "../../src/auth/auth.sevice"
import { ACCESS_TOKEN_NO_EXPIRE } from "../fixtures"
import { Review, ReviewDocument } from "../../src/review/review.schema"
import { ReviewService } from "../../src/review/review.service"
import { Product, ProductDocument } from "../../src/product/product.schema"

describe("ReviewController", () => {
	let appContext: AppContext

	let reviewService: ReviewService
	let authService: AuthService

	let reviewModel: Model<ReviewDocument>
	let userModel: Model<UserDocument>
	let productModel: Model<ProductDocument>
	const product = {
		id: "123",
		name: "product",
		description: "product description",
		price: 100,
		quantity: 10,
		image: "image",
		reviews: [],
	}

	const review = {
		id: "123",
		title: "review",
		text: "product description",
		rating: 3,
		product: "582f1e05c7a9dced018b4574",
		user: "582f1e05c7a9dced018b4574",
	}
	const userInfo = {
		email: "test@gmail.com",
		password: "test",
		role: "admin",
	}
	beforeAll(async () => {
		appContext = await setupApplication()
		reviewModel = await appContext.application.get(
			getModelToken(Review.name),
		)
		userModel = await appContext.application.get(getModelToken(User.name))
		productModel = await appContext.application.get(
			getModelToken(Product.name),
		)

		reviewService = appContext.application.get(ReviewService)
		authService = appContext.application.get(AuthService)
	})

	beforeEach(async () => {
		await reviewModel.deleteMany({})
		await userModel.deleteMany({})
	})

	afterAll(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await reviewModel.deleteMany({})
		await userModel.deleteMany({})
		await teardownApplication(appContext?.application)
	})

	it("App, Controller, ProductService, AuthService should be defined", () => {
		expect(appContext.application).toBeDefined()
		expect(reviewService).toBeDefined()
		expect(authService).toBeDefined()
		expect(userModel).toBeDefined()
		expect(productModel).toBeDefined()
	})

	it("getReviews [200]", async () => {
		reviewModel.find = jest.fn().mockImplementation(() => {
			return {
				populate: jest.fn().mockImplementation(() => {
					return {
						populate: jest.fn().mockResolvedValue([review]),
					}
				}),
			}
		})

		const response = await appContext.request.get("/reviews")
		expect(response.status).toBe(200)
		expect(response.body).toEqual({ reviews: [review] })
	})

	it("createReview[201]", async () => {
		reviewModel.create = jest.fn().mockResolvedValue(review)
		reviewModel.findOne = jest.fn().mockResolvedValue(null)
		productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(product)
		reviewModel.find = jest.fn().mockImplementation(() => {
			return {
				populate: jest.fn().mockImplementation(() => {
					return {
						populate: jest.fn().mockResolvedValue(review),
					}
				}),
			}
		})

		userModel.find = jest.fn().mockResolvedValue([userInfo])
		userModel.findById = jest.fn().mockResolvedValue(userInfo)

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		const respLogin = await appContext.request.post("/auth/login", userInfo)

		reviewService.createReview = jest.fn().mockResolvedValue(review)
		const response = await appContext.request
			.post("/reviews", review)
			.set("Authorization", `${respLogin.body.token}`)

		expect(authService.login).toBeCalled()
		expect(response.status).toBe(201)
	})

	it("updateReview [200]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
			role: "admin",
		}
		reviewModel.findById = jest.fn().mockResolvedValue(review)
		reviewModel.findByIdAndUpdate = jest.fn().mockResolvedValue(review)

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		reviewService.updateReview = jest.fn().mockResolvedValue(review)
		const respLogin = await appContext.request.post("/auth/login", userInfo)
		const response = await appContext.request
			.put("/reviews/582f1e05c7a9dced018b4574", review)
			.set("Authorization", `${respLogin.body.token}`)

		expect(authService.login).toBeCalled()
		expect(reviewService.updateReview).toBeCalled()
		expect(response.status).toBe(200)
	})

	it("deleteReview [201]", async () => {
		const userInfo = {
			email: "test@gmail.com",
			password: "test",
			role: "admin",
		}

		authService.login = jest
			.fn()
			.mockResolvedValue({ token: ACCESS_TOKEN_NO_EXPIRE })
		const respLogin = await appContext.request.post("/auth/login", userInfo)

		reviewModel.findById = jest.fn().mockResolvedValue(review)
		reviewModel.deleteOne = jest.fn().mockResolvedValue({})
		productModel.findByIdAndUpdate = jest.fn().mockResolvedValue(product)

		reviewService.deleteReview = jest
			.fn()
			.mockResolvedValue({ message: "Review deleted successfully" })

		const response = await appContext.request
			.delete("/reviews/582f1e05c7a9dced018b4574")
			.set("Authorization", `${respLogin.body.token}`)

		expect(authService.login).toBeCalled()
		expect(reviewService.deleteReview).toBeCalled()
		expect(response.status).toBe(200)
	})
})
