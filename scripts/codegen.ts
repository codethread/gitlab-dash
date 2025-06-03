import {CODEGEN_DOCS, SCHEMA_PATH} from "./constants.ts"
import type {CodegenConfig} from "@graphql-codegen/cli"
import fs from "node:fs"

if (!fs.existsSync(SCHEMA_PATH)) {
	console.log("No schema, run `pnpm boot` (easy) or `pnpm schem --help` (choice)")
	process.exit(1)
}

const config = {
	schema: SCHEMA_PATH,
	documents: CODEGEN_DOCS,
	ignoreNoDocuments: true,
	generates: {
		"./src/graphql/": {
			preset: "client",
			presetConfig: {
				fragmentMasking: false,
			},
			config: {
				useTypeImports: true,
				enumsAsTypes: true,
				skipTypename: true,
				arrayInputCoercion: false,
				// avoidOptionals: true, // use non null type helper instead
				documentMode: "string",
			},
		},
	},
	hooks: {
		afterOneFileWrite: ["prettier --ignore-path='' --write"],
	},
} satisfies CodegenConfig

export default config
