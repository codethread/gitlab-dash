import {ErrorComp} from "@/components/ErrorBoundary"
import {Layout} from "@/components/Layout"
// import {LoaderPage} from "@/components/ui/Loader"
import {createRootRoute, Outlet} from "@tanstack/react-router"
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools"

export const Route = createRootRoute({
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
