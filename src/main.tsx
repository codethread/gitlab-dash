// Import the generated route tree
import {routeTree} from "./routeTree.gen"
import "./styles.css"
import {ErrorBoundary} from "@/components/ErrorBoundary"
import {ThemeProvider} from "@/hooks/theme/ThemeProvider"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {ReactQueryDevtools} from "@tanstack/react-query-devtools"
import {createRouter, RouterProvider} from "@tanstack/react-router"
import {TanStackRouterDevtools} from "@tanstack/react-router-devtools"
import React from "react"
import ReactDOM from "react-dom/client"

const router = createRouter({
	routeTree,
})

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ThemeProvider>
			<div className="flex justify-center">
				<ErrorBoundary>
					<QueryClientProvider
						client={
							new QueryClient({
								defaultOptions: {
									queries: {
										refetchOnWindowFocus: false,
									},
								},
							})
						}
					>
						<RouterProvider router={router} />
						<ReactQueryDevtools />
					</QueryClientProvider>
				</ErrorBoundary>
			</div>
		</ThemeProvider>
	</React.StrictMode>,
)
