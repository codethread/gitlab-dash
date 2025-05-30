import {authStore, type AuthState} from "./auth-store"
import {useSelector} from "@xstate/store/react"
import type React from "react"
import {createContext, useContext} from "react"

interface AuthContextValue {
	readonly auth: AuthState
	readonly setDomain: (domain: string) => void
	readonly setToken: (token: string) => void
	readonly setAuth: (domain: string, token: string) => void
	readonly clearAuth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
	children: (props: {auth: AuthState}) => React.ReactNode
}

export function AuthProvider({
	children,
}: AuthProviderProps): React.ReactElement {
	const auth = useSelector(authStore, (state) => state.context)

	const contextValue: AuthContextValue = {
		auth,
		setDomain: (domain: string) => {
			authStore.send({type: "setDomain", domain})
		},
		setToken: (token: string) => {
			authStore.send({type: "setToken", token})
		},
		setAuth: (domain: string, token: string) => {
			authStore.send({type: "setAuth", domain, token})
		},
		clearAuth: () => {
			authStore.send({type: "clearAuth"})
		},
	}

	return (
		<AuthContext.Provider value={contextValue}>
			{children({auth})}
		</AuthContext.Provider>
	)
}

export function useAuth(): AuthContextValue {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider")
	}
	return context
}
