import { INestApplication } from "@nestjs/common"

import { NestFactory } from "@nestjs/core"
import { AppModule } from "../src/app.module"
import * as supertest from "supertest"
// import { ACCESS_TOKEN } from "./fixtures"

export const ACCESS_TOKEN =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY1YjYzZDc2MjUxYzYxNTAxOWNlZWE2NyIsImlhdCI6MTcwNjQ1OTk1MiwiZXhwIjoxNzA2NTQ2MzUyfQ.Zu-4Wemz_bicZ8EIoYxP3FYYi90H9M0SmhHslkMW1Vg"

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
	const application: INestApplication = await NestFactory.create(AppModule)

	await application.init()
	const request = supertest(application.getHttpServer())
	const enhanceRequest = (req: supertest.Request) =>
		req
			.set("Accept", "application/json")
			.set("Content-Type", "application/json")
			.set("Authorization", `Bearer ${ACCESS_TOKEN}`)

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
