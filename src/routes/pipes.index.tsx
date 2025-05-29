import {PipesQuery} from "./-pipes.gql"
import {Loader} from "@/components/ui/Loader"
import {Button} from "@/components/ui/button"
import {
	ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart"
import {Pipeline} from "@/graphql/graphql"
import {execute} from "@/lib/fetcher"
import {useQuery} from "@tanstack/react-query"
import {createFileRoute} from "@tanstack/react-router"
import {format, formatDuration} from "date-fns"
import {Copy} from "lucide-react"
import {BarChart, Bar, XAxis} from "recharts"
import {toast} from "sonner"
import {z} from "zod"

const SOURCES = [
	"push",
	"merge_request_event",
	"schedule",
	"api",
	"unknown",
] as const

export const Route = createFileRoute("/pipes/")({
	component: RouteComponent,
})

export const RoutePipesIndex = Route.fullPath

function RouteComponent() {
	const {data, isLoading, error} = useQuery({
		queryKey: ["pipes"],
		queryFn: () =>
			execute(
				{domain: __DOMAIN__, token: __TOKEN__, timeout: 10000},
				PipesQuery,
				{app: __APP__, cursor: undefined},
			),
	})

	if (isLoading) {
		return <Loader variant="page" />
	}

	if (error) {
		return <div>Error: {error.message}</div>
	}

	if (!data?.project?.pipelines?.nodes) {
		return <div>No data available</div>
	}

	const chartConfig = {
		duration: {
			label: "Duration",
			color: "#2563eb",
		},
	} satisfies ChartConfig

	const chartData = data.project.pipelines.nodes.filter(Boolean).map(
		(pipeline) =>
			({
				...pipeline,
				source: z.enum(SOURCES).parse(pipeline.source ?? "unknown"),
				duration: pipeline.duration,
				date: pipeline.createdAt,
			}) as const,
	)

	const groupedData = Object.groupBy(chartData, (data) => data.source)

	return (
		<div className="w-full">
			<p className="text-sm text-gray-500">Pipes durations</p>
			<Button
				variant="outline"
				className="cursor-pointer"
				size="icon"
				onClick={() => {
					navigator.clipboard.writeText(PipesQuery.toString())
					toast.success("Query copied to clipboard", {position: "top-right"})
				}}
			>
				<Copy className="h-4 w-4" />
			</Button>
			<hr className="my-4" />
			{Object.entries(groupedData).map(([source, data]) => (
				<div key={source}>
					<p className="text-sm text-gray-500">{source}</p>
					<ChartContainer config={chartConfig}>
						<BarChart accessibilityLayer data={data}>
							<XAxis
								dataKey="date"
								tickMargin={10}
								tickFormatter={(value) => format(value, "d/MM")}
							/>
							<ChartTooltip
								content={
									<ChartTooltipContent
										formatter={(_, __, {payload}) => {
											const p = payload as Pipeline
											return JSON.stringify(p, null, 2)
										}}
									/>
								}
							/>
							<ChartLegend content={<ChartLegendContent />} />
							<Bar
								dataKey="duration"
								fill="var(--color-duration)"
								radius={4}
								onClick={({payload}: {payload: Pipeline}) => {
									if (payload) {
										window.open(
											`https://${__DOMAIN__}${payload.path}`,
											"_blank",
										)
									}
								}}
							/>
						</BarChart>
					</ChartContainer>
				</div>
			))}
		</div>
	)
}
