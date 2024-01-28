import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose"
import { ApiProperty } from "@nestjs/swagger"
import { HydratedDocument, Types } from "mongoose"
import { User } from "../user/user.schema"
import { Product } from "../product/product.schema"

export type ReviewDocument = HydratedDocument<Review>

@Schema()
export class Review {
	@ApiProperty({
		type: String,
		required: true,
		maxLength: 100,
		description: "Review title (max 100 characters)",
	})
	@Prop({ required: true, maxlength: 100 })
	title: string

	@ApiProperty({
		type: String,
		required: true,
		maxLength: 500,
		description: "Review text (max 500 characters)",
	})
	@Prop({ required: true, maxlength: 500 })
	text: string

	@ApiProperty({
		type: Number,
		minimum: 1,
		maximum: 5,
		default: 1,
		description: "Review rating (1 to 5)",
	})
	@Prop({ min: 1, max: 5, default: 1 })
	rating: number

	@ApiProperty({
		type: String,
		format: "mongo-id",
		required: true,
		description: "User ID (mongo ID)",
	})
	@Prop({ type: Types.ObjectId, ref: User.name, required: true })
	user: Types.ObjectId & User

	@ApiProperty({
		type: String,
		format: "mongo-id",
		required: true,
		description: "Product ID (mongo ID)",
	})
	@Prop({ type: Types.ObjectId, ref: Product.name, required: true })
	product: Types.ObjectId & Product

	@ApiProperty({
		type: Date,
		default: Date.now,
		description: "Review creation timestamp",
	})
	@Prop({ default: Date.now })
	createdAt: Date
}

export const ReviewSchema = SchemaFactory.createForClass(Review)

ReviewSchema.index({ product: 1, user: 1 }, { unique: true })
