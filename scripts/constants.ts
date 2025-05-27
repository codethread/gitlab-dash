import path from "node:path"

export const CODEGEN_DOCS = "src/{hooks,page}/**/*.gql.ts"
export const SCHEMA_PATH = path.join(process.cwd(), "src/graphql/schema.json")
export const FIXTURE_FILE = path.join(
	process.cwd(),
	"src/lib/fetcher/fakes/fixtureData.json",
)
export const MAX_FAKE_USERS = 250
