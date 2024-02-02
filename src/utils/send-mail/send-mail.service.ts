import { Injectable } from "@nestjs/common"
import { createTransport, SendMailOptions } from "nodemailer"

interface MailOptions {
	to: string
	subject: string
	html: string
}

@Injectable()
export class SendMailService {
	async sendEmail(options: MailOptions): Promise<void> {
		const transporter = createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT),
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASSWORD,
			},
		})

		const mailOptions: SendMailOptions = {
			from: `${process.env.FROM_EMAIL} <${process.env.FROM_NAME}>`,
			...options,
		}

		await transporter.sendMail(mailOptions)
	}
}
