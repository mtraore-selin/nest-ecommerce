export const signupDTOMock = {
	phone: "0777777777",
	password: "yourSecurePassword",
}
export const userDTOMock = {
	name: "John Doe",
	email: "john@example.com",
	phone: "0777777777",
	password: "yourSecurePassword",
}
export const token = "test"
export class AuthServiceMock {
	signup = jest.fn().mockResolvedValue(signupDTOMock)

	login = jest.fn().mockResolvedValue({ token })

	updatePassword = jest.fn().mockRejectedValue(userDTOMock)

	forgotPassword = jest.fn().mockRejectedValue({ message: "success" })

	resetPassword = jest.fn()
}
