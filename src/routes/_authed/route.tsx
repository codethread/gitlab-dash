import {Login} from "@/components/Login"
import {useAuth} from "@/hooks/auth"
import {createFileRoute, Outlet} from "@tanstack/react-router"

export const Route = createFileRoute("/_authed")({
	component: () => {
		const {auth} = useAuth()

		if (!auth.domain || !auth.token) {
			return <Login />
		}

		return <Outlet />
	},
})
