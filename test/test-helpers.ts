import { INestApplication } from "@nestjs/common"

import { NestFactory } from "@nestjs/core"
import { AppModule } from "../src/app.module"
import * as supertest from "supertest"
import { mockUserDecorator } from "./mocks/decorators.mock"

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
	const ACCESS_TOKEN = "test"

	// Override the User decorator with the mock
	jest.mock("@nestjs/common", () => ({
		...jest.requireActual("@nestjs/common"),
		User: mockUserDecorator,
	}))
	const application: INestApplication = await NestFactory.create(AppModule)

	await application.init()
	const request = supertest(application.getHttpServer())
	const enhanceRequest = (req: supertest.Request) =>
		req
			.set("Accept", "application/json")
			.set("Content-Type", "application/json")
			.set("Authorization", ACCESS_TOKEN)

	return {
		application,
		request: {
			get: (path: string) => enhanceRequest(request.get(path)).send(),
			delete: (path: string) =>
				enhanceRequest(request.delete(path)).send(),
			post: (path: string, data: string | Record<string, unknown>) =>
				enhanceRequest(request.post(path)).send(data),
			put: (path: string, data: string | Record<string, unknown>) =>
				enhanceRequest(request.put(path)).send(data),
			patch: (path: string, data: string | Record<string, unknown>) =>
				enhanceRequest(request.patch(path)).send(data),
		},
	}
}

export const teardownApplication = async (
	application: INestApplication,
): Promise<void> => {
	await application?.close()
}
