// import jsonwebtoken from "jsonwebtoken"
import { sign } from "jsonwebtoken"

export const ACCESS_TOKEN_NO_EXPIRE =
	"Bearer " +
	sign({ id: "65b5788588f4b2bb905e2fac" }, process.env.JWT_SECRET, {
		expiresIn: process.env.JWT_EXPIRE,
	})

/***************** -  *****************/

export const jsonParsed = (data: any) => JSON.parse(JSON.stringify(data))
