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
import {Slider} from "@/components/ui/slider"
import {Pipeline} from "@/graphql/graphql"
import {execute} from "@/lib/fetcher"
import {useQuery} from "@tanstack/react-query"
import {createFileRoute} from "@tanstack/react-router"
import {format, formatDuration} from "date-fns"
import {Copy} from "lucide-react"
import {useEffect, useLayoutEffect, useState} from "react"
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

const MAX_TRIM_PERCENTAGE = 50
function RouteComponent() {
	const [sliders, setSliders] = useState<
		{
			source: string
			trimPercentage: [number]
		}[]
	>([])
	const {data, isLoading, error} = useQuery({
		queryKey: ["pipes"],
		queryFn: () =>
			execute(
				{domain: __DOMAIN__, token: __TOKEN__, timeout: 10000},
				PipesQuery,
				{app: __APP__, cursor: undefined},
			),
	})

	useEffect(() => {
		const pipes = data?.project?.pipelines?.nodes
		const sources = new Set(
			pipes?.map((pipeline) =>
				z.enum(SOURCES).parse(pipeline?.source ?? "unknown"),
			),
		)
		for (const source of sources) {
			setSliders((prev) => [
				...prev,
				{
					source,
					trimPercentage: [0],
				},
			])
		}
	}, [data])

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
				duration: z.number().parse(pipeline.duration),
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
			{sliders.length > 0 &&
				Object.entries(groupedData)
					.map(([source, data]) => {
						const trimPercentage = sliders.find((s) => s.source === source)
							?.trimPercentage[0]
						if (trimPercentage === undefined) {
							throw new Error("Trim percentage not found")
						}

						// Sort data by duration to find percentile-based thresholds
						const sortedData = [...data].sort((a, b) => a.duration - b.duration)
						const totalCount = sortedData.length

						// Calculate how many items to trim from each end
						const trimCount = Math.floor((totalCount * trimPercentage) / 100)

						const maxThreshold =
							trimCount > 0
								? sortedData[totalCount - 1 - trimCount]?.duration
								: sortedData[totalCount - 1]?.duration

						if (maxThreshold !== undefined) {
							const trimmedData = data.filter((d) => d.duration <= maxThreshold)
							return [source, trimmedData] as const
						}
						return [source, data] as const
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
											Trim percentage{" "}
											{
												sliders.find((s) => s.source === source)
													?.trimPercentage[0]
											}
											%
										</p>
										<Slider
											min={0}
											max={MAX_TRIM_PERCENTAGE}
											step={1}
											value={
												sliders.find((s) => s.source === source)
													?.trimPercentage ?? [0]
											}
											onValueChange={([value]) => {
												setSliders((prev) => {
													const newSliders = [...prev]
													const slider = newSliders.find(
														(s) => s.source === source,
													)
													if (slider && value !== undefined) {
														slider.trimPercentage = [value]
													}
													return newSliders
												})
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
								<hr className="my-4" />
							</div>
						)
					})}
		</div>
	)
}
