import {ErrorComp} from "@/components/ErrorBoundary"
import {Layout} from "@/components/Layout"
// import {LoaderPage} from "@/components/ui/Loader"
import {createRootRouteWithContext, Outlet} from "@tanstack/react-router"
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools"

interface AppContext {
	auth: {domain: string; token: string}
}

export const Route = createRootRouteWithContext<AppContext>()({
	component: RootComponent,
	errorComponent: ErrorComp,
})

function RootComponent() {
	return (
		<>
			<Layout>
				<Outlet />
			</Layout>
			<TanStackRouterDevtools />
		</>
	)
}
