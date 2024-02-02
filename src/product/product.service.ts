// nest.js modules
import { Injectable, NotFoundException } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"

// types
import { Model } from "mongoose"

// schema
import { Product, ProductDocument } from "./product.schema"
import { Review, ReviewDocument } from "../review/review.schema"

// DTOs
import { ProductDto } from "./product.dto"

@Injectable()
export class ProductService {
	constructor(
		@InjectModel(Product.name)
		private readonly productModel: Model<ProductDocument>,

		@InjectModel(Review.name)
		private readonly reviewModel: Model<ReviewDocument>,
	) {}

	async getProducts() {
		const products = await this.productModel.find()

		return { products }
	}

	async getProduct(id: string) {
		const product = await this.productModel.findById(id).populate("reviews")

		if (!product)
			throw new NotFoundException([
				"No product found with the entered ID",
			])

		return { product }
	}

	async createProduct(dto: ProductDto) {
		const product = await this.productModel.create(dto)

		return { product }
	}

	async updateProduct(id: string, dto: Partial<ProductDto>) {
		const product = await this.productModel.findByIdAndUpdate(id, dto, {
			runValidators: true,
			new: true,
		})

		if (!product)
			throw new NotFoundException([
				"No product found with the entered ID",
			])

		return { product }
	}

	async deleteProduct(id: string) {
		const product = await this.productModel.findById(id)

		if (!product) {
			throw new NotFoundException(["Product not found"])
		}

		await Promise.all([
			this.productModel.findByIdAndDelete(id),
			this.reviewModel.deleteMany({ product: id }),
		])

		return { message: "Product deleted successfully" }
	}
}
