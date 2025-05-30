import {PipesQuery} from "../../hooks/data/pipes.gql"
import {Loader} from "@/components/ui/Loader"
import {Button} from "@/components/ui/button"
import {
	type ChartConfig,
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
} from "@/components/ui/chart"
import {Slider} from "@/components/ui/slider"
import type {Pipeline} from "@/graphql/graphql"
import {useFetch} from "@/hooks/use-fetch"
import {useTrimSliders} from "@/hooks/use-trim-sliders"
import {useQuery} from "@tanstack/react-query"
import {createFileRoute} from "@tanstack/react-router"
import {format, formatDuration} from "date-fns"
import {Copy} from "lucide-react"
import {useEffect} from "react"
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

export const Route = createFileRoute("/_authed/pipes/")({
	component: RouteComponent,
	validateSearch: (search) => {
		return {
			app: (search.app as string) ?? "your-app",
		}
	},
})

export const RoutePipesIndex = Route.fullPath

const MAX_TRIM_PERCENTAGE = 50
function RouteComponent() {
	const {app} = Route.useSearch()
	const {sliders, getTrimPercentage, getAppliedTrimming, trimSlidersStore} =
		useTrimSliders({name: "pipes"})

	const fetch = useFetch()
	const {data, isLoading, error} = useQuery({
		queryKey: ["pipes"],
		queryFn: () => fetch(PipesQuery, {app, cursor: undefined}),
	})

	useEffect(() => {
		const pipes = data?.project?.pipelines?.nodes
		const sources = Array.from(
			new Set(
				pipes?.map((pipeline) =>
					z.enum(SOURCES).parse(pipeline?.source ?? "unknown"),
				),
			),
		)
		trimSlidersStore.send({type: "initializeSliders", sources})
	}, [data, trimSlidersStore])

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
		special: {
			label: "Upgrade (2025-05-22)",
			color: "#f43f5e",
		},
	} satisfies ChartConfig

	const chartData = data.project.pipelines.nodes
		.filter(Boolean)
		.map((pipeline) => {
			const data = {
				...pipeline,
				source: z.enum(SOURCES).parse(pipeline.source ?? "unknown"),
				duration: z.number().parse(pipeline.duration),
				date: pipeline.createdAt,
			} as const
			if (data.date.startsWith("2025-05-22")) {
				// replace duration with special - this allows a stacked bar chart to display in a different color
				// there's probably a better way to do this
				return {...data, duration: 0, special: data.duration}
			}
			return data
		})
		.toSorted((a, b) => a.date.localeCompare(b.date))

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
			{sliders.length > 0 &&
				Object.entries(groupedData)
					.map(([source, data]) => {
						const trimmedData = getAppliedTrimming(data, source)
						return [source, trimmedData] as const
					})
					.map(([source, data]) => {
						const averageDuration =
							data.reduce((acc, d) => acc + d.duration, 0) / data.length
						return (
							<div key={source}>
								<div className="">
									<div className="flex items-center gap-2">
										<p className="shrink-0 text-lg text-gray-300">{source}</p>
									</div>
									<div className="flex items-center gap-2">
										<p className="shrink-0 text-sm text-gray-500">
											Average duration:{" "}
											{formatDuration(
												{
													seconds: Math.floor(averageDuration % 60),
													minutes: Math.floor(averageDuration / 60),
												},
												{
													format: ["minutes", "seconds"],
												},
											)}
										</p>
										<p className="shrink-0 text-sm text-gray-500">
											Trim percentage {getTrimPercentage(source)}%
										</p>
										<Slider
											min={0}
											max={MAX_TRIM_PERCENTAGE}
											step={1}
											value={[getTrimPercentage(source)]}
											onValueChange={([value]) => {
												if (value !== undefined) {
													trimSlidersStore.send({
														type: "updateSliderValue",
														source,
														value,
													})
												}
											}}
										/>
									</div>
								</div>
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
											dataKey="special"
											stackId="a"
											fill="var(--color-special)"
											radius={4}
										/>
										<Bar
											dataKey="duration"
											stackId="a"
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
								<hr className="my-4" />
							</div>
						)
					})}
		</div>
	)
}
