import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import * as dotenv from "dotenv"

import { AppModule } from "./app.module"

async function bootstrap() {
	dotenv.config()
	const app = await NestFactory.create(AppModule)

	app.setGlobalPrefix(process.env.API_PREFIX).useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
		}),
	)

	const PORT = process.env.PORT

	const options = new DocumentBuilder()
		.setTitle("Your API Title")
		.setDescription("Your API description")
		.setVersion("1.0")
		.addServer(process.env.API_URL_LOCAL, "Local environment")
		.addServer(process.env.API_URL_STAGING, "Staging")
		.addServer(process.env.API_URL_PRODUCTION, "Production")
		.addTag("Your API Tag")
		.build()

	const document = SwaggerModule.createDocument(app, options)

	SwaggerModule.setup("api-docs", app, document)

	await app.listen(PORT)
}

bootstrap()
