/* eslint-disable @typescript-eslint/ban-types */
import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose"
import { HydratedDocument } from "mongoose"
import { sign } from "jsonwebtoken"
import { genSalt, hash, compare } from "bcryptjs"
import { randomBytes, createHash } from "crypto"
import { Role } from "../role/role.enum"
import { ApiProperty } from "@nestjs/swagger"

export type UserDocument = HydratedDocument<User>

@Schema()
export class User {
	@ApiProperty({
		type: String,
		description: "User name",
	})
	@Prop({ required: true })
	name: string

	@ApiProperty({
		type: String,
		uniqueItems: true,
		description: "User email (unique)",
	})
	@Prop({ required: true, unique: true })
	email: string

	@ApiProperty({
		type: String,
		minLength: 6,
		format: "password",
		description: "User password (min length: 6)",
	})
	@Prop({ required: true, minlength: 6, select: false })
	password: string

	@ApiProperty({
		type: String,
		description: "User phone number",
	})
	@Prop({ required: true })
	phone: string

	@ApiProperty({
		enum: Role,
		type: String,
		default: Role.User,
		description: "User role (enum: Role, default: User)",
	})
	@Prop({ enum: [Role.Admin, Role.User], default: Role.User })
	role: Role

	@ApiProperty({
		type: String,
		description: "Reset password token",
	})
	@Prop({ select: false })
	resetPasswordToken: string

	@ApiProperty({
		type: Number,
		description: "Reset password expiration time",
	})
	@Prop({ select: false })
	resetPasswordExpire: number

	@ApiProperty({
		type: Date,
		description: "User creation date",
	})
	@Prop({ default: Date.now })
	createdAt: Date

	getSignedJwtToken: Function

	matchPassword: Function

	getResetPasswordToken: Function
}

export const UserSchema = SchemaFactory.createForClass(User)

UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next()

	const salt = await genSalt(10)
	this.password = await hash(this.password, salt)
})

UserSchema.methods.getSignedJwtToken = function () {
	return sign({ id: this.id }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE,
	})
}

UserSchema.methods.matchPassword = async function (enteredPwd: string) {
	return await compare(enteredPwd, this.password)
}

UserSchema.methods.getResetPasswordToken = function () {
	const token = randomBytes(20).toString("base64url")

	this.resetPasswordToken = createHash("sha256")
		.update(token)
		.digest("base64")

	this.resetPasswordExpire = Date.now() + 10 * 60 * 1000

	return token
}
