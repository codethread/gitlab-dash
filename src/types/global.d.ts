interface IChildren {
	children: React.ReactNode
}

type IChildrens<Key extends string> = Record<Key, React.ReactNode>

/** callback handed to components used purely for it's effect, e.g onRefresh, onClick etc */
type IAction = (...ignored: ANY_TRUST_ME[]) => ANY_TRUST_ME

// TODO make deep get helper for this
type NN<T> = NonNullable<T>

type Prettify<T> = {
	[K in keyof T]: T[K]
} & {}

/**
 * Swap graphql null to undefined because preset-client won't let me
 */
type MaybeNot<T> = T extends null
	? undefined
	: T extends Date
		? T
		: {
				[K in keyof T]: T[K] extends (infer U)[]
					? MaybeNot<U>[]
					: MaybeNot<T[K]>
			}

/**
 * any alias for code generated via tooling, i.e expected to be correct for development
 *
 * biome-ignore lint/suspicious/noExplicitAny: needs must
 */
type ANY_GEN = any
/* biome-ignore lint/suspicious/noExplicitAny: trust-me™ */
type ANY_TRUST_ME = any
