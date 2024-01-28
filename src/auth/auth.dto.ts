import {
	IsEmail,
	IsNotEmpty,
	IsString,
	MinLength,
	IsMobilePhone,
} from "class-validator"
import { MOBILE_COUNTRY_CODE } from "../../constants"
import { ApiProperty } from "@nestjs/swagger"

export class SignupDto {
	@ApiProperty({
		type: String,
		description: "Enter a name",
		example: "John Doe",
	})
	@IsString({
		message: "Enter a name",
	})
	name: string

	@IsEmail({}, { message: "Enter a valid email" })
	@ApiProperty({
		type: String,
		format: "email",
		description: "Enter a valid email",
		example: "john@example.com",
	})
	email: string

	@IsMobilePhone(
		MOBILE_COUNTRY_CODE,
		{},
		{ message: "Enter a valid phone number" },
	)
	@ApiProperty({
		type: String,
		description: "Enter a valid phone number",
		example: "0777777777",
	})
	phone: string

	@MinLength(6, { message: "Enter a password atleast 6 characters long" })
	@ApiProperty({
		type: String,
		description: "Enter a password at least 6 characters long",
		example: "yourSecurePassword",
	})
	password: string
}

export class LoginDto {
	@IsEmail({}, { message: "Enter a valid email" })
	@ApiProperty({
		type: String,
		format: "email",
		description: "Enter a valid email",
		example: "user@example.com",
	})
	email: string

	@IsNotEmpty({ message: "Enter a password" })
	@ApiProperty({
		type: String,
		description: "Enter a password",
		example: "yourSecurePassword",
	})
	password: string
}

export class UpdatePasswordDto {
	@IsNotEmpty({ message: "Enter current password" })
	@ApiProperty({
		type: String,
		description: "Enter current password",
		example: "<PASSWORD>",
	})
	password: string

	@MinLength(6, { message: "Enter new password atleast 6 characters long" })
	@ApiProperty({
		type: String,
		description: "Enter new password at least 6 characters long",
		example: "<PASSWORD>",
	})
	newPassword: string
}

export class ResetPasswordDto {
	@MinLength(6, { message: "Enter a password at least 6 characters long" })
	@ApiProperty({
		type: String,
		description: "Enter a password at least 6 characters long",
		example: "newSecurePassword",
	})
	password: string
}
