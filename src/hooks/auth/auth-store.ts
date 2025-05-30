import {createStore} from "@xstate/store"
import {z} from "zod"

const AuthStateSchema = z.object({
	domain: z.string().min(2, {
		message: "Domain must be at least 2 characters.",
	}),
	token: z.string().min(2, {
		message: "Token must be at least 2 characters.",
	}),
})

type AuthState = z.infer<typeof AuthStateSchema>

const initialState: AuthState = {
	domain: "",
	token: "",
}

const loadSnapshot = (value: string | null): AuthState | null => {
	if (value === null) {
		return null
	}
	try {
		return AuthStateSchema.parse(JSON.parse(value))
	} catch (error) {
		console.error(error)
		return null
	}
}

export const authStore = createStore({
	context: loadSnapshot(localStorage.getItem("auth")) ?? initialState,
	on: {
		setDomain: (context, event: {domain: string}) => ({
			...context,
			domain: event.domain,
		}),
		setToken: (context, event: {token: string}) => ({
			...context,
			token: event.token,
		}),
		setAuth: (context, event: {domain: string; token: string}) => ({
			...context,
			domain: event.domain,
			token: event.token,
		}),
		clearAuth: () => initialState,
	},
})

authStore.subscribe((state) => {
	const value = state.context
	localStorage.setItem("auth", JSON.stringify(value))
})
