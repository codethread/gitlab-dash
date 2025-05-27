// Import the generated route tree
import {routeTree} from "./routeTree.gen"
import "./styles.css"
import {ErrorBoundary} from "@/components/ErrorBoundary"
import {ThemeProvider} from "@/hooks/theme/ThemeProvider"
import {createRouter, RouterProvider} from "@tanstack/react-router"
import React from "react"
import ReactDOM from "react-dom/client"

// Create a new router instance
const router = createRouter({
	routeTree,
	basepath: "/git-nudge",
})

// Register the router instance for type safety
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
					<RouterProvider router={router} />
				</ErrorBoundary>
			</div>
		</ThemeProvider>
	</React.StrictMode>,
)
