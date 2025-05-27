import {type ClassValue, clsx} from "clsx"
import React from "react"
import {twMerge} from "tailwind-merge"
import {match, P} from "ts-pattern"
import {ZodError} from "zod"
import {fromError} from "zod-validation-error"

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function throwError(e: unknown): never {
	if (typeof e === "string") throw new Error(e)
	if (e instanceof Error) throw e
	throw new Error(JSON.stringify(e))
}

export function parseError(e: unknown): string {
	if (e instanceof ZodError) {
		return fromError(e).toString()
	}
	if (e instanceof Error) {
		return `${e.message}\n${e?.stack || ""}`
	}

	return JSON.stringify(e)
}

export function useNeededContext<A>(
	ctx: Record<string, React.Context<A>>,
): NonNullable<A> {
	const [name, context] = match(Object.entries(ctx))
		.with(
			[P.select()],
			([name, context]) => [name, React.useContext(context)] as const,
		)
		.otherwise(() =>
			throwError(
				"useNeededContext context param should be a record with a single contex value passed in",
			),
		)

	if (!context)
		throw new Error(`${name} should be used inside ${name}.Provider`)
	return context
}
