import { getModelToken } from "@nestjs/mongoose"
import { Product } from "../../src/product/product.schema"
import {
	AppContext,
	setupApplication,
	teardownApplication,
} from "../test-helpers"
import { Model } from "mongoose"
import { ReviewService } from "../../src/review/review.service"
import { Review, ReviewDocument } from "../../src/review/review.schema"
import { User, UserDocument } from "../../src/user/user.schema"
import { Role } from "../../src/role/role.enum"
import {
	BadRequestException,
	ForbiddenException,
	NotFoundException,
} from "@nestjs/common"
import { jsonParsed } from "../../test/fixtures"
import { CreateReviewDto, UpdateReviewDto } from "../../src/review/review.dto"

describe("ReviewService", () => {
	let appContext: AppContext
	let reviewService: ReviewService

	let reviewModel: Model<Review>
	let productModel: Model<Product>
	let userModel: Model<User>

	beforeAll(async () => {
		appContext = await setupApplication()
		reviewModel = appContext.application.get(getModelToken(Review.name))
		productModel = appContext.application.get(getModelToken(Product.name))
		userModel = appContext.application.get(getModelToken(User.name))
		reviewService = appContext.application.get(ReviewService)
	})
	beforeEach(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await reviewModel.deleteMany({})
		await productModel.deleteMany({})
		await userModel.deleteMany({})
	})
	afterEach(async () => {
		jest.clearAllMocks()
		jest.resetAllMocks()
		await reviewModel.deleteMany({})
		await productModel.deleteMany({})
		await userModel.deleteMany({})
	})

	afterAll(async () => {
		await teardownApplication(appContext?.application)
	})

	describe("Defined", () => {
		it("should defined", () => {
			expect(reviewModel).toBeDefined()
			expect(productModel).toBeDefined()
			expect(userModel).toBeDefined()
			expect(reviewService).toBeDefined()
		})
	})

	describe("getReviews", () => {
		it("should get reviews", async () => {
			const { _id: userId1 } = await userModel.create({
				name: "name1",
				email: "user1@example.com",
				password: "Deh,.gd",
				phone: "0987654321",
				role: Role.Admin,
			})
			const { _id: userId2 } = await userModel.create({
				name: "<NAME>",
				email: "<EMAIL>",
				password: "<PASSWORD>",
				phone: "0987654321",
				role: Role.Admin,
			})
			const { _id: productId1 } = await productModel.create({
				title: "Product 1",
				category: "laptops",
				description: "Product 1 description",
				price: 100,
			})
			const { _id: productId2 } = await productModel.create({
				title: "Product 2",
				category: "smartphones",
				description: "Product 2 description",
				price: 200,
			})

			await reviewModel.create([
				{
					title: "Review 1",
					text: "Text 1",
					rating: 4,
					user: userId1,
					product: productId1,
				},
				{
					title: "Review 2",
					text: "Text 2",
					rating: 5,
					user: userId2,
					product: productId2,
				},
			])

			const response = await reviewService.getReviews()
			const { reviews } = response
			const reviewsParsed = jsonParsed(reviews)

			expect(reviewsParsed.length).toBe(2)

			//TODO:
			// expect(reviewsParsed[0].user._id).toBeDefined()
			// expect(reviewsParsed[0].user.name).toBeDefined()
			// expect(reviewsParsed[0].product._id).toBeDefined()
		})
	})

	describe("createReview", () => {
		it("should create a new review", async () => {
			const product = await productModel.create({
				title: "Product 1 description",
				description: "Product 1 description",
				price: 100,
				rating: 0,
				averageRating: 0,
				discountPercentage: 0,
				stock: 3,
				brand: "Brand",
				thumbnail: "Image",
				images: [],
				category: "laptops",
			})

			const user = await userModel.create({
				name: "User 1",
				phone: "123",
				email: "test@gmail.com",
				password: "testTed1",
				role: "admin",
			})

			const productCreated = jsonParsed(product)

			// Create a review
			const reviewDto = {
				title: "Test Review",
				text: "This is a test review",
				rating: 4,
				product: productCreated._id,
			}
			const response = await reviewService.createReview(reviewDto, user)

			// Assertions
			const res = jsonParsed(response)
			const { review } = res

			expect(review.title).toBe(reviewDto.title)
			expect(review.text).toBe(reviewDto.text)
			expect(review.rating).toBe(reviewDto.rating)
			expect(review.product).toBeDefined()
			expect(review.user).toBeDefined()

			// Check if the average rating of the associated product has been updated
			const updatedProduct = await productModel.findById(product._id)
			const resUpdate = jsonParsed(updatedProduct)
			expect(resUpdate.averageRating).toBeGreaterThan(0)

			// Check if the review is populated with user and product information
			expect(review.user._id).toBeDefined()
			expect(review.user.name).toBeDefined()
			expect(review.product._id).toBeDefined()
			// expect(review.product.title).toBeDefined() TODO: why not populate
		})

		it("should throw BadRequestException if a user tries to create more than one review for a product", async () => {
			const user = {
				id: "582f1e05c7a9dced018b4574",
			} as unknown as UserDocument
			const reviewDto = {
				title: "Test Review",
				text: "This is a test review",
				rating: 4,
				product: "582f1e05c7a9dced018b4574",
			} as unknown as CreateReviewDto
			reviewModel.findOne = jest.fn().mockResolvedValue({ id: "id" })

			await expect(
				reviewService.createReview(reviewDto, user),
			).rejects.toThrowError(BadRequestException)
		})
	})

	describe("updateReview", () => {
		it("should throw NotFoundException if no review is found with the provided ID", async () => {
			const user = { id: "user1" } as unknown as UserDocument

			await expect(
				reviewService.updateReview(
					"65b5788588f4b2bb905e2fac",
					{
						title: "Updated Review",
						text: "",
						rating: 0,
					},
					user,
				),
			).rejects.toThrowError(NotFoundException)
		})

		it("should throw ForbiddenException if the current user is not the owner of the review", async () => {
			const id1 = "65b5788588f4b2bb905e2f11"
			const id2 = "65b5788588f4b2bb905e2f13"

			const userMock = {
				id: "65b5788588f4b2bb905e2fac",
			} as unknown as UserDocument

			reviewModel.findById = jest.fn().mockResolvedValue({
				user: { id: id1 },
			})

			await expect(
				reviewService.updateReview(
					id2,
					{
						title: "Updated Review",
						text: "Blank Review",
						rating: 2,
					},
					userMock,
				),
			).rejects.toThrowError(ForbiddenException)
		})

		it("should update the review", async () => {
			const id = "65b5788588f4b2bb905e2f11"
			const rev = {
				user: id,
				title: "Review",
				text: "Review text",
				rating: 4,
				product: "67b5788588f4b2bb905e2f11",
			}
			const averageRating = 3
			const title = "Review New"
			const text = "Review Text New"
			const rating = 5
			const userMock = {
				id,
			} as unknown as UserDocument

			const dto = {
				title,
				text,
				rating,
			} as unknown as UpdateReviewDto

			reviewModel.findById = jest.fn().mockResolvedValue(rev)
			reviewModel.aggregate = jest
				.fn()
				.mockResolvedValue({ ...rev, averageRating })

			reviewModel.findByIdAndUpdate = jest
				.fn()
				.mockResolvedValue({ ...rev })

			reviewService.saveReview = jest.fn().mockResolvedValue(rev)
			reviewService.populateReviewFields = jest
				.fn()
				.mockResolvedValue(rev)

			const { review } = await reviewService.updateReview(
				"67b5788588f4b2bb905e2f13",
				dto,
				userMock,
			)
			expect(review.title).toBe(dto.title)
			expect(review.text).toBe(dto.text)
		})
	})

	describe("DeleteReview", () => {
		const reviewId = "mockReviewId"
		const currentUser = {
			id: "mockUserId",
		} as UserDocument

		it("should delete the review and update averageRating", async () => {
			const mockReview = {
				_id: reviewId,
				user: currentUser.id,
				product: "mockProductId",
			} as unknown as ReviewDocument

			reviewModel.findById = jest.fn().mockResolvedValue(mockReview)
			reviewService.deleteOneReview = jest.fn().mockResolvedValue({})
			productModel.findByIdAndUpdate = jest.fn().mockResolvedValue({})

			await reviewService.deleteReview(reviewId, currentUser)

			// Assertions
			expect(reviewModel.findById).toHaveBeenCalledWith(reviewId)
			expect(reviewService.deleteOneReview).toBeCalled()
			expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
				mockReview.product,
				{
					averageRating: expect.any(Number),
				},
			)
		})

		it("should throw NotFoundException when review is not found", async () => {
			reviewModel.findById = jest.fn().mockResolvedValue(null)

			await expect(
				reviewService.deleteReview(reviewId, currentUser),
			).rejects.toThrowError(NotFoundException)
		})

		it("should throw ForbiddenException when currentUser does not match review.user", async () => {
			const mockReview = {
				_id: reviewId,
				user: "differentUserId",
			} as unknown as ReviewDocument

			reviewModel.findById = jest.fn().mockResolvedValue(mockReview)

			await expect(
				reviewService.deleteReview(reviewId, currentUser),
			).rejects.toThrowError(ForbiddenException)
		})
	})

	describe("SaveReview", () => {
		it.skip("should save the review", async () => {
			const mockReview = {
				_id: "mockReviewId",
				user: "mockUserId",
				product: "mockProductId",
			} as unknown as ReviewDocument

			mockReview.text = "test text"

			await reviewService.saveReview(mockReview)

			expect(String(mockReview.text)).toBe("test text")
		})
	})
})
