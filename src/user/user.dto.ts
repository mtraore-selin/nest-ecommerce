import {
	IsEmail,
	IsEnum,
	IsMobilePhone,
	IsString,
	MinLength,
} from "class-validator"
import { ApiProperty } from "@nestjs/swagger"
import { Role } from "../role/role.enum"
import { MOBILE_COUNTRY_CODE } from "../../constants"

export class CreateUserDto {
	@ApiProperty({
		type: String,
		description: "User name",
	})
	@IsString({ message: "Enter a name" })
	name: string

	@ApiProperty({
		type: String,
		format: "email",
		description: "User email (valid email format)",
	})
	@IsEmail({}, { message: "Enter a valid email" })
	email: string

	@ApiProperty({
		type: String,
		minLength: 6,
		description: "Password (at least 6 characters long)",
	})
	@MinLength(6, { message: "Enter a password at least 6 characters long" })
	password: string

	@ApiProperty({
		type: String,
		format: "mobile-phone",
		description: "User phone number (valid phone number format)",
	})
	@IsMobilePhone(
		MOBILE_COUNTRY_CODE,
		{},
		{ message: "Enter a valid phone number" },
	)
	phone: string

	@ApiProperty({
		type: String,
		enum: Role,
		description: "User role (enum: Role)",
	})
	@IsEnum(Role, { message: "Enter a valid role" })
	role: Role
}

export class UpdateUserDto {
	@ApiProperty({
		type: String,
		description: "Updated user name",
	})
	@IsString({ message: "Enter a name" })
	name: string

	@ApiProperty({
		type: String,
		format: "mobile-phone",
		description: "Updated user phone number (valid phone number format)",
	})
	@IsMobilePhone(
		MOBILE_COUNTRY_CODE,
		{},
		{ message: "Enter a valid phone number" },
	)
	phone: string

	@ApiProperty({
		type: String,
		enum: Role,
		isArray: true,
		description: "Updated user roles (enum: Role)",
	})
	@IsEnum(Role, { each: true, message: "Enter a valid role" })
	role: Role
}
