import { IsString, IsNumber, IsEnum, IsArray, IsUrl } from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { Category } from "./product.schema"

export class ProductDto {
	@ApiProperty({
		example: "Title",
		description: "Title of the product",
	})
	@IsString()
	title: string
	@ApiProperty({
		example: "Description",
		description: "Description of the product",
	})
	@IsString()
	description: string

	@ApiProperty({
		example: 25.99,
		description: "Price of the product",
	})
	@IsNumber()
	price: number

	@ApiProperty({
		example: 4.5,
		description: "Rating of the product",
	})
	@IsNumber()
	rating: number

	@ApiProperty({
		example: 10,
		description: "Discount percentage for the product",
	})
	@IsNumber()
	discountPercentage: number

	@ApiProperty({
		example: 100,
		description: "Stock availability of the product",
	})
	@IsNumber()
	stock: number

	@ApiProperty({
		example: "BrandName",
		description: "Brand of the product",
	})
	@IsString()
	brand: string

	@ApiProperty({
		enum: Category,
		description: "Category of the product",
	})
	@IsEnum(Category)
	category: string
	@ApiProperty({
		example: "https://example.com/thumbnail.jpg",
		description: "URL of the product thumbnail image",
	})
	@IsUrl()
	thumbnail: string
	@ApiProperty({
		example: "https://example.com/image1.jpg",
		description: "URL of the main product image",
	})
	@ApiProperty({
		example: [
			"https://example.com/image1.jpg",
			"https://example.com/image2.jpg",
		],
		description: "List of URLs for additional images of the product",
	})
	@IsArray()
	@IsUrl({}, { each: true })
	images: string[]
}
