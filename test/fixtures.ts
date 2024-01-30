import jsonwebtoken from "jsonwebtoken"

export const ACCESS_TOKEN =
	"Bearer " +
	jsonwebtoken.sign(
		{
			username: "USERNAME",
			password: "PASSWORD",
		},
		"signkey",
	)

/***************** -  *****************/
