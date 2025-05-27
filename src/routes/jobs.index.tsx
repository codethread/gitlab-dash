import {createFileRoute} from "@tanstack/react-router"

export const Route = createFileRoute("/jobs/")({
	component: RouteComponent,
})

export const RouteJobsIndex = Route.fullPath

function RouteComponent() {
	return <div>Hello "/jobs/"!</div>
}
