import * as crypto from "crypto"

export function generateString(length: number) {
	const buffer = crypto.randomBytes(length)
	const result = buffer.toString("base64").replace(/[^a-zA-Z0-9]/g, "")

	return result.substring(0, length)
}
