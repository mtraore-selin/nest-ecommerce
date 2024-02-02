import { createParamDecorator, ExecutionContext } from "@nestjs/common"

export const mockUserDecorator = createParamDecorator(
	(data: unknown, ctx: ExecutionContext) => {
		// Customize the mock behavior as needed
		return {
			userId: "mockedUserId",
			username: "mockedUsername",
			role: "admin",
		}
	},
)
