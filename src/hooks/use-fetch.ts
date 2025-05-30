import type {TypedDocumentString} from "@/graphql/graphql"
import {useAuth} from "@/hooks/auth"

export function useFetch() {
	const {auth} = useAuth()

	return execute({domain: auth.domain, token: auth.token, timeout: 10000})
}

function execute({
	domain,
	token,
	timeout,
}: {
	domain: string
	token: string
	timeout: number
}) {
	return async <TResult, TVariables>(
		query: TypedDocumentString<TResult, TVariables>,
		...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
	): Promise<MaybeNot<TResult>> => {
		const response = await fetch(`https://${domain}/api/graphql`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/graphql-response+json",
				Authorization: `Bearer ${token}`,
			},
			signal: AbortSignal.timeout(timeout),
			body: JSON.stringify({
				query,
				variables,
			}),
		})

		if (response.status === 401) {
			throw new Error("Your token is invalid or expired")
		}

		if (!response.ok) {
			throw new Error("Network response was not ok")
		}

		const json: ANY_GEN = await response.json()

		const {data, errors} = json
		if (errors) {
			for (const e of errors) {
				console.error(e)
			}
			throw new Error(errors.at(0)?.message)
		}

		return data
	}
}
