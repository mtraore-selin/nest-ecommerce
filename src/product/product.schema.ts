import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose"
import { ApiProperty } from "@nestjs/swagger"
import { HydratedDocument } from "mongoose"

export type ProductDocument = HydratedDocument<Product>

export enum Category {
	"smartphones",
	"desktops",
	"computer accessories",
	"laptops",
	"laptop parts",
	"cctv",
	"printers and scanners",
	"networking and wifi",
	"gaming",
	"storage and memory",
	"gift items",
}

@Schema({
	toJSON: { virtuals: true },
	toObject: { virtuals: true },
	id: true,
})
export class Product {
	@Prop({ required: true, maxlength: 100 })
	@ApiProperty({
		example: "Title",
		description: "Title of the product",
	})
	title: string

	@Prop({ required: true, maxlength: 2000 })
	@ApiProperty({
		example: "Description",
		description: "Description of the product",
	})
	description: string

	@Prop({ required: true, default: 0, min: 0 })
	@ApiProperty({
		example: 25.99,
		description: "Price of the product",
	})
	price: number

	@Prop()
	@ApiProperty({
		example: 4.5,
		description: "Rating of the product",
	})
	rating: number

	@Prop()
	@ApiProperty({
		example: 4.5,
		description: "Average Rating of the product",
	})
	averageRating?: number

	@Prop()
	@ApiProperty({
		example: 10,
		description: "Discount percentage for the product",
	})
	discountPercentage: number

	@Prop()
	@ApiProperty({
		example: 100,
		description: "Stock availability of the product",
	})
	stock: number

	@Prop()
	@ApiProperty({
		example: "BrandName",
		description: "Brand of the product",
	})
	brand: string

	@Prop({ required: true, enum: Category })
	category: string

	@Prop()
	@ApiProperty({
		example: "https://example.com/thumbnail.jpg",
		description: "URL of the product thumbnail image",
	})
	thumbnail: string

	@Prop({ type: [String] })
	@ApiProperty({
		example: [
			"https://example.com/image1.jpg",
			"https://example.com/image2.jpg",
		],
		description: "List of URLs for additional images of the product",
	})
	images: string[]

	@Prop({ default: Date.now })
	createdAt: Date
}

export const ProductSchema = SchemaFactory.createForClass(Product)

ProductSchema.virtual("reviews", {
	ref: "Review",
	localField: "_id",
	foreignField: "product",
})
//TODO: understand this
