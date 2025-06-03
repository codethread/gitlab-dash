import {SCHEMA_PATH} from "./constants.ts"
import fs from "node:fs"
import https from "node:https"
import os from "node:os"
import path from "node:path"
import {match, P} from "ts-pattern"
import unzipper from "unzipper"
import {z} from "zod"

const DEFAULT_URL = "https://gitlab.com/gitlab-org/gitlab/-/jobs/10109370493"

const UrlSchema = z
	.string({message: "expected a url string as argument"})
	.url({message: "url param should be a valid url"})
	.optional()

const DomainSchema = z
	.string({message: "expected a domain string as argument"})
	.url({message: "domain param should be a valid url"})
	.optional()

export const ArgSchema = z.object({
	help: z.boolean().default(false),
	url: UrlSchema,
	domain: DomainSchema,
})

type Args = z.TypeOf<typeof ArgSchema>

export const EnvSchema = z.object({
	GITLAB_SCHEMA_DOMAIN: UrlSchema,
	GITLAB_SCHEMA_URL: DomainSchema,
})

type Envs = z.TypeOf<typeof EnvSchema>

export async function main(args: Args, envs: Envs) {
	if (args.help) {
		return printHelp()
	}

	console.log("DownloadSchema with", {args, envs})
	fs.mkdirSync("src/graphql", {recursive: true})

	await match({...args, ...envs})
		.with({domain: P.nonNullable}, (url) => fetchGraph(url.domain))
		.with({url: P.nonNullable}, (url) => downloadSchema(url.url))
		.with({GITLAB_SCHEMA_DOMAIN: P.nonNullable}, (url) => fetchGraph(url.GITLAB_SCHEMA_DOMAIN))
		.with({GITLAB_SCHEMA_URL: P.nonNullable}, (url) => downloadSchema(url.GITLAB_SCHEMA_URL))
		.otherwise(() => downloadSchema(DEFAULT_URL))

	console.log(`Downloaded to ${SCHEMA_PATH}`)
}

function printHelp() {
	console.log(`
Command-line tool that downloads the graphql schema from a gitlab instance.

If no arguments are specified, '--url' is default

USAGE:
  pnpm run getSchema [OPTIONS]

OPTIONS:
  --help             Display this help message and exit.

  --url              The URL from which to download the schema from. 
                     Needs to be a job url which includes a schema.json download link
                     [Default]: '${DEFAULT_URL}'

  --domain           Provide a domain to a hosted gitlab instance that will accept a
                     graphql introspection query.

ENVS:
  The following optional environment variables will automatically be used
  (but cli args/opts take precedence)

  GITLAB_SCHEMA_DOMAIN:  same as --domain
  GITLAB_SCHEMA_URL:     same as --url
`)
}

async function fetchGraph(url: string) {
	const final = `${url}/api/graphql`

	console.log(`Introspecting ${final}`)

	const schema = await fetch(final, {
		headers: {
			accept: "*/*",
			"accept-language": "en-GB,en-US;q=0.9,en;q=0.8",
			"content-type": "application/json",
		},
		body: '{"query":"query IntrospectionQuery {__schema {queryType { name }mutationType { name }subscriptionType { name }types {...FullType}directives {namedescriptionlocationsargs {...InputValue}}}}fragment FullType on __Type {kindnamedescriptionfields(includeDeprecated: true) {namedescriptionargs {...InputValue}type {...TypeRef}isDeprecateddeprecationReason}inputFields {...InputValue}interfaces {...TypeRef}enumValues(includeDeprecated: true) {namedescriptionisDeprecateddeprecationReason}possibleTypes {...TypeRef}}fragment InputValue on __InputValue {namedescriptiontype { ...TypeRef }defaultValue}fragment TypeRef on __Type {kindnameofType {kindnameofType {kindnameofType {kindnameofType {kindnameofType {kindnameofType {kindnameofType {kindnameofType {kindnameofType {kindname}}}}}}}}}}","operationName":"IntrospectionQuery"}',
		method: "POST",
	}).then((r) => {
		if (!r.ok) {
			console.log(r.status)
			console.log(r.statusText)
			throw r.body
		}
		return r.json()
	})

	console.log("Fetch success")

	fs.writeFileSync(SCHEMA_PATH, JSON.stringify(schema))
}

async function downloadSchema(jobUrl: string) {
	const targetDirectory = path.join(os.tmpdir(), "git-nudge")
	const artifactUrl = jobUrl.concat("/artifacts/download")
	console.log(`Getting download url via: ${artifactUrl}`)
	const zipUrl = await fetch(artifactUrl, {
		redirect: "follow",
	}).then((res) => {
		if (res.ok) {
			return res.url
		}
		console.error(res.status)
		console.error(res.statusText)
		throw new Error("failed to fetch jobUrl")
	})
	await downloadAndExtractZip(zipUrl, targetDirectory)
	fs.renameSync(path.join(targetDirectory, "tmp", "tests", "graphql", "gitlab_schema.json"), SCHEMA_PATH)
}

async function downloadAndExtractZip(url: string, outputDir: string): Promise<void> {
	const zipFilePath = path.join(outputDir, "temp.zip")
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, {recursive: true})
	}

	try {
		console.log(`Downloading zip at:\n${url}\n`)

		await downloadFile(url, zipFilePath)

		console.log(`Extracting from ${zipFilePath}`)

		await fs
			.createReadStream(zipFilePath)
			.pipe(unzipper.Extract({path: outputDir}))
			.promise()
	} catch (error) {
		console.error("Error downloading or extracting zip:", error)
	} finally {
		console.log("Cleaning temp zip")
		if (fs.existsSync(zipFilePath)) {
			fs.unlink(zipFilePath, (err) => {
				if (err) console.error("Error removing the temp zip file:", err)
			})
		}
	}
}

function downloadFile(url: string, dest: string): Promise<void> {
	return new Promise<undefined>((resolve, reject) => {
		const file = fs.createWriteStream(dest)
		https
			.get(url, (response) => {
				if (response.statusCode !== 200) {
					reject(new Error(`Failed to get '${url}' (${response.statusCode})`))
					return
				}

				response.pipe(file)

				file.on("finish", () => {
					file.close(() => resolve(undefined))
				})

				file.on("error", (err) => {
					fs.unlink(dest, () => reject(err))
				})
			})
			.on("error", (err) => {
				fs.unlink(dest, () => reject(err))
			})
	})
}
