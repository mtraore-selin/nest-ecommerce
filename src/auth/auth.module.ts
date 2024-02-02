import { Module } from "@nestjs/common"

import { UserModule } from "../user/user.module"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.sevice"
import { SendMailService } from "../utils/send-mail/send-mail.service"

@Module({
	imports: [UserModule],
	controllers: [AuthController],
	providers: [AuthService, SendMailService],
})
export class AuthMoudle {}
