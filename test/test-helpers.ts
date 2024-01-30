import { INestApplication } from "@nestjs/common"

import { NestFactory } from "@nestjs/core"
import { AppModule } from "../src/app.module"
import supertest from "supertest"

export type SuperTestHelper = {
	get: (path: string) => supertest.Request
	delete: (path: string) => supertest.Request
	post: (
		path: string,
		data: string | Record<string, unknown>,
	) => supertest.Request
	put: (
		path: string,
		data: string | Record<string, unknown>,
	) => supertest.Request
	patch: (
		path: string,
		data: string | Record<string, unknown>,
	) => supertest.Request
}

export type AppContext = {
	application: INestApplication
	request: SuperTestHelper
}

export async function setupApplication(): Promise<AppContext> {
	const ACCESS_TOKEN = "local"

	const application: INestApplication = await NestFactory.create(AppModule)

	await application.init()
	const request = supertest(application.getHttpServer())
	const enhanceRequest = (req: supertest.Request) => {
		return req
			.set("Accept", "application/json")
			.set("Content-Type", "application/json")
			.set("Authorization", ACCESS_TOKEN)
	}

	return {
		application,
		request: {
			get: (path: string) => {
				return enhanceRequest(request.get(path)).send()
			},
			delete: (path: string) => {
				return enhanceRequest(request.delete(path)).send()
			},
			post: (path: string, data: string | Record<string, unknown>) => {
				return enhanceRequest(request.post(path)).send(data)
			},
			put: (path: string, data: string | Record<string, unknown>) => {
				return enhanceRequest(request.put(path)).send(data)
			},
			patch: (path: string, data: string | Record<string, unknown>) => {
				return enhanceRequest(request.patch(path)).send(data)
			},
		},
	}
}
