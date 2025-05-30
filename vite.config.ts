import {CODEGEN_DOCS} from "./scripts/constants"
import tailwindcss from "@tailwindcss/vite"
import {TanStackRouterVite} from "@tanstack/router-plugin/vite"
import react from "@vitejs/plugin-react"
import path from "node:path"
import {defineConfig} from "vite"
import {watchAndRun} from "vite-plugin-watch-and-run"

// https://vitejs.dev/config/
export default defineConfig(() => {
	return {
		plugins: [
			TanStackRouterVite({
				routesDirectory: "./src/routes",
				generatedRouteTree: "./src/routeTree.gen.ts",
				autoCodeSplitting: true,
			}),
			react(),
			tailwindcss(),
			watchAndRun([
				{
					name: "gen",
					watch: path.resolve(CODEGEN_DOCS),
					run: "pnpm run types:client",
				},
			]),
		],
		base: "/gitlab-dash#",
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		clearScreen: false,
	}
})
