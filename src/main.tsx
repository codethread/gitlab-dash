import {routeTree} from "./routeTree.gen"
import "./styles.css"
import {ErrorBoundary} from "@/components/ErrorBoundary"
import {AuthProvider} from "@/hooks/auth/AuthProvider"
import {ThemeProvider} from "@/hooks/theme/ThemeProvider"
import {createSyncStoragePersister} from "@tanstack/query-sync-storage-persister"
import {QueryClient} from "@tanstack/react-query"
import {ReactQueryDevtools} from "@tanstack/react-query-devtools"
import {PersistQueryClientProvider} from "@tanstack/react-query-persist-client"
import {createRouter, RouterProvider} from "@tanstack/react-router"
import React from "react"
import ReactDOM from "react-dom/client"

const router = createRouter({
	basepath: "/gitlab-dash",
	routeTree,
	context: {auth: undefined!},
})

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router
	}
}

const persister = createSyncStoragePersister({
	storage: window.localStorage,
})

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
	<React.StrictMode>
		<ThemeProvider>
			<div className="flex justify-center">
				<ErrorBoundary>
					<PersistQueryClientProvider
						persistOptions={{persister}}
						client={
							new QueryClient({
								defaultOptions: {
									queries: {
										gcTime: 1000 * 60 * 60 * 24, // 24 hours
										refetchOnWindowFocus: false,
									},
								},
							})
						}
					>
						<AuthProvider>
							{({auth}) => <RouterProvider router={router} context={{auth}} />}
						</AuthProvider>
						<ReactQueryDevtools position="right" />
					</PersistQueryClientProvider>
				</ErrorBoundary>
			</div>
		</ThemeProvider>
	</React.StrictMode>,
)
