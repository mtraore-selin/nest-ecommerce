import { getModelToken } from "@nestjs/mongoose"
import { Product } from "../../src/product/product.schema"
import { ProductService } from "../../src/product/product.service"
import { AppContext, setupApplication } from "../../test/test-helpers"
import { Model } from "mongoose"
import { NotFoundException } from "@nestjs/common"
import { ProductDto } from "src/product/product.dto"
import { jsonParsed } from "../../test/fixtures"

describe("ProductService", () => {
	let appContext: AppContext
	let productService: ProductService

	let productModel: Model<Product>

	const product = {
		name: "test",
		description: "test description",
		price: 1,
		category: "smartphones",
		title: "test title",
	}

	beforeAll(async () => {
		appContext = await setupApplication()
		productModel = appContext.application.get(getModelToken(Product.name))
		productService = appContext.application.get(ProductService)
	})
	beforeEach(async () => {
		jest.resetAllMocks()
		await productModel.deleteMany({})
		await productModel.create(product)
	})

	describe("Defined", () => {
		it("should defined", () => {
			expect(productModel).toBeDefined()
			expect(productService).toBeDefined()
		})
	})
	describe("getProducts", () => {
		it("should get products", async () => {
			const response = await productService.getProducts()
			expect(response.products?.length).toBe(1)
			expect(response.products[0].description).toBe(product.description)
		})

		it("throw NotFound product when provide", async () => {
			productModel.findById = jest.fn().mockImplementation(() => {
				return {
					populate: jest.fn().mockResolvedValue(null),
				}
			})
			await expect(
				productService.getProduct("582f1e05c7a9dced018b4574"),
			).rejects.toThrowError(NotFoundException)
		})

		it("should get product by id", async () => {
			productModel.findById = jest.fn().mockImplementation(() => {
				return {
					populate: jest.fn().mockResolvedValue(product),
				}
			})
			const { _id } = await productModel.create(product)
			const productFindOne = await productService.getProduct(String(_id))
			expect(productFindOne.product).toBe(product)
		})
	})

	describe("CreateProduct", () => {
		it("should create product", async () => {
			const prodDto = product as unknown as ProductDto
			const productCreated = await productService.createProduct(prodDto)
			const { product: prod } = jsonParsed(productCreated)
			console.log(prod)

			expect(prod.title).toEqual(product.title)
			expect(prod.price).toEqual(product.price)
		})
	})

	describe("updateProduct", () => {
		const price = 30
		it("should update product", async () => {
			const prodDto = product as unknown as ProductDto
			const { _id } = await productModel.create(prodDto)
			const productCreated = await productService.updateProduct(
				String(_id),
				{
					price,
				},
			)
			const { product: prod } = jsonParsed(productCreated)

			expect(prod.price).toBe(price)
		})
		it("should update an existing product", async () => {
			const productId = "123"
			const price = 30
			const originalProduct = {
				_id: productId,
				name: "Product 1",
				price: 20,
			} as unknown as Product
			jest.spyOn(productModel, "findByIdAndUpdate").mockResolvedValue({
				...originalProduct,
				price,
			})

			const updatedProduct = await productService.updateProduct(
				productId,
				{ price },
			)
			const { product: updatedProd } = updatedProduct

			expect(updatedProd.price).toBe(price)
		})

		it("should throw NotFoundException if product is not found", async () => {
			const productId = "123"
			jest.spyOn(productModel, "findByIdAndUpdate").mockResolvedValue(
				null,
			)

			await expect(
				productService.updateProduct(productId, { price: 30 }),
			).rejects.toThrowError(NotFoundException)
		})
	})

	describe("deleteProduct", () => {
		it("should delete product by id", async () => {
			const productId = "123"
			const productToDelete = {
				_id: productId,
				name: "Product 1",
				price: 20,
			} as unknown as Product

			jest.spyOn(productModel, "findById").mockResolvedValue(
				productToDelete,
			)
			jest.spyOn(productModel, "findByIdAndDelete").mockResolvedValue(
				productToDelete,
			)
			jest.spyOn(productModel, "deleteMany").mockResolvedValue({} as any) // Mocking deleteMany for reviews

			const result = await productService.deleteProduct(productId)

			expect(result).toEqual({ message: "Product deleted successfully" })
		})

		it("should throw NotFoundException if product is not found", async () => {
			const productId = "123"
			jest.spyOn(productModel, "findById").mockResolvedValue(null)

			await expect(
				productService.deleteProduct(productId),
			).rejects.toThrowError(NotFoundException)
		})
	})
})
