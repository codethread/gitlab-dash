import {ArgSchema, EnvSchema, main} from "./download-schema.ts"
import minimist from "minimist"
import {ZodError} from "zod"
import {fromError} from "zod-validation-error"

process.on("uncaughtException", (e) => {
	if (e instanceof ZodError) {
		console.log(fromError(e).toString())
	} else {
		console.error(e)
	}
	process.exit(1)
})

const argv = minimist(process.argv.slice(2))

main(ArgSchema.parse(argv), EnvSchema.parse(process.env))
