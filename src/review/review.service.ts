// nest.js modules
import {
	Injectable,
	BadRequestException,
	NotFoundException,
	ForbiddenException,
} from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"

// types
import { Model, Types } from "mongoose"
import { UserDocument } from "../user/user.schema"

// schema
import { Product, ProductDocument } from "../product/product.schema"
import { Review, ReviewDocument } from "./review.schema"

// DTOs
import { CreateReviewDto, UpdateReviewDto } from "./review.dto"

@Injectable()
export class ReviewService {
	constructor(
		@InjectModel(Review.name)
		private readonly reviewModel: Model<ReviewDocument>,

		@InjectModel(Product.name)
		private readonly productModel: Model<ProductDocument>,
	) {}

	async getReviews() {
		const reviews = await this.reviewModel
			.find()
			.populate({ path: "user", select: "id name" })
			.populate({ path: "product", select: "id name" })

		return { reviews }
	}

	async createReview(dto: CreateReviewDto, user: UserDocument) {
		let review = await this.reviewModel.findOne({
			user: new Types.ObjectId(user.id),
			product: new Types.ObjectId(dto.product),
		})

		if (review)
			throw new BadRequestException([
				"A user can not create more than one review for a product",
			])

		review = await this.reviewModel.create({
			...dto,
			product: new Types.ObjectId(dto.product),
			user: new Types.ObjectId(user.id),
		})

		await this.productModel.findByIdAndUpdate(review.product, {
			averageRating: await this.getAverageRating(review.product),
		})

		await review.populate({ path: "product", select: "id name" })
		await review.populate({ path: "user", select: "id name" })

		return { review }
	}

	async updateReview(
		id: string,
		dto: UpdateReviewDto,
		currentUser: UserDocument,
	) {
		const review = await this.findReviewById(id)
		this.validateReviewOwnership(currentUser, review)

		this.updateReviewFields(review, dto)
		await this.saveReview(review)

		await this.updateProductAverageRating(review.product)

		await this.populateReviewFields(review)

		return { review }
	}

	private async findReviewById(id: string): Promise<ReviewDocument> {
		const review = await this.reviewModel.findById(id)
		if (!review) {
			throw new NotFoundException([
				"No review found with the provided ID",
			])
		}
		return review
	}

	private validateReviewOwnership(
		currentUser: UserDocument,
		review: ReviewDocument,
	): void {
		if (currentUser.id !== String(review?.user)) {
			throw new ForbiddenException([
				"The current user does not have permission to access this resource",
			])
		}
	}

	private updateReviewFields(
		review: ReviewDocument,
		dto: UpdateReviewDto,
	): void {
		review.title = dto.title
		review.text = dto.text
		review.rating = dto.rating
	}

	async saveReview(review: ReviewDocument): Promise<void> {
		await review.save()
	}

	private async updateProductAverageRating(
		productId: Types.ObjectId,
	): Promise<void> {
		await this.productModel.findByIdAndUpdate(productId, {
			averageRating: await this.getAverageRating(productId),
		})
	}

	async populateReviewFields(review: ReviewDocument): Promise<void> {
		await review.populate({ path: "user", select: "id name" })
		await review.populate({ path: "product", select: "id name" })
	}

	// async updateReview(
	// 	id: string,
	// 	dto: UpdateReviewDto,
	// 	currentUser: UserDocument,
	// ) {
	// 	const review = await this.reviewModel.findById(id)

	// 	if (!review)
	// 		throw new NotFoundException(["No review found with the entered ID"])

	// 	if (currentUser.id !== String(review?.user))
	// 		throw new ForbiddenException([
	// 			"The current user can't access this resource",
	// 		])

	// 	review.title = dto.title
	// 	review.text = dto.text
	// 	review.rating = dto.rating

	// 	await review.save()

	// 	await this.productModel.findByIdAndUpdate(review.product, {
	// 		averageRating: await this.getAverageRating(review.product),
	// 	})

	// 	await review.populate({ path: "user", select: "id name" })
	// 	await review.populate({ path: "product", select: "id name" })

	// 	return { review }
	// }

	async deleteReview(id: string, currentUser: UserDocument) {
		const review = await this.reviewModel.findById(id)

		if (!review)
			throw new NotFoundException(["No review found with the entered ID"])

		if (currentUser.id !== review.user.toString())
			throw new ForbiddenException([
				"The current user can't access this resource",
			])

		await this.deleteOneReview(review)

		await this.productModel.findByIdAndUpdate(review.product, {
			averageRating: await this.getAverageRating(review.product),
		})

		return { message: "Review deleted successfully" }
	}
	async deleteOneReview(review: ReviewDocument): Promise<void> {
		await review.deleteOne()
	}

	async getAverageRating(productId: Types.ObjectId) {
		const result = await this.reviewModel.aggregate([
			{
				$match: { product: productId },
			},
			{
				$group: {
					_id: "$product",
					averageRating: { $avg: "$rating" },
				},
			},
		])

		return result?.length ? result[0].averageRating : 0
	}
}
