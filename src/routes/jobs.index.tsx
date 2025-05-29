import {JobsQuery} from "./-pipes.gql"
import {Loader} from "@/components/ui/Loader"
import {Button} from "@/components/ui/button"
import {
	type ChartConfig,
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart"
import {Slider} from "@/components/ui/slider"
import {execute} from "@/lib/fetcher"
import {
	type TrimSlider,
	applyTrimming,
	initializeSliders,
	updateSliderValue,
	getTrimPercentage,
} from "@/lib/trim-utils"
import {useQuery} from "@tanstack/react-query"
import {createFileRoute} from "@tanstack/react-router"
import {format, formatDuration} from "date-fns"
import {Copy} from "lucide-react"
import {useEffect, useState} from "react"
import {BarChart, Bar, XAxis} from "recharts"
import {toast} from "sonner"
import {z} from "zod"

const BUILD_JOBS = ["web_staging", "web_feature", "web_production"] as const
const JOBS = ["checks", "manual_deps_install", ...BUILD_JOBS] as const

const JobSchema = z.object({
	name: z.union([z.enum(JOBS), z.literal("build")]),
	jobName: z.string(),
	duration: z.number(),
	date: z.string(),
	durationDisplay: z.string(),
	webPath: z.string(),
})
type Job = z.infer<typeof JobSchema>

export const Route = createFileRoute("/jobs/")({
	component: RouteComponent,
})

export const RouteJobsIndex = Route.fullPath

const MAX_TRIM_PERCENTAGE = 50
function RouteComponent() {
	const [sliders, setSliders] = useState<TrimSlider[]>([])
	const {data, isLoading, error} = useQuery({
		queryKey: ["jobs"],
		queryFn: () =>
			execute(
				{domain: __DOMAIN__, token: __TOKEN__, timeout: 10000},
				JobsQuery,
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

	const chartData = data.project.pipelines.nodes
		.flatMap((pipeline) =>
			pipeline?.jobs?.nodes
				?.filter((job) => JOBS.includes(job?.name ?? "nope"))
				.map((job) =>
					JobSchema.parse({
						date: pipeline.createdAt,
						duration: job?.duration,
						durationDisplay: formatDuration(
							{
								seconds: (job?.duration ?? 0) % 60,
								minutes: Math.floor((job?.duration ?? 0) / 60),
							},
							{
								format: ["minutes", "seconds"],
							},
						),
						name: BUILD_JOBS.includes(job?.name ?? "nope")
							? "build"
							: job?.name,
						jobName: job?.name,
						webPath: job?.webPath,
					}),
				),
		)
		.filter(Boolean)
		.toSorted((a, b) => a.date.localeCompare(b.date))

	const groupedData = Object.groupBy(chartData, (data) => data.name)

	// Initialize sliders based on job names
	useEffect(() => {
		const jobNames = Object.keys(groupedData)
		setSliders(initializeSliders(jobNames))
	}, [data])

	const chartConfig = {
		duration: {
			label: "Duration",
			color: "#2563eb",
		},
	} satisfies ChartConfig

	return (
		<div className="w-full">
			<p className="text-sm text-gray-500">Jobs durations</p>
			<Button
				variant="outline"
				className="cursor-pointer"
				size="icon"
				onClick={() => {
					navigator.clipboard.writeText(JobsQuery.toString())
					toast.success("Query copied to clipboard", {position: "top-right"})
				}}
			>
				<Copy className="h-4 w-4" />
			</Button>
			<hr className="my-4" />
			{sliders.length > 0 &&
				Object.entries(groupedData)
					.map(([name, data]) => {
						const trimPercentage = getTrimPercentage(sliders, name)
						const trimmedData = applyTrimming(data, trimPercentage)
						return [name, trimmedData] as const
					})
					.map(([name, data]) => {
						const averageDuration =
							data.reduce((acc, d) => acc + d.duration, 0) / data.length
						return (
							<div key={name}>
								<div className="">
									<div className="flex items-center gap-2">
										<p className="shrink-0 text-lg text-gray-300">{name}</p>
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
											Trim percentage {getTrimPercentage(sliders, name)}%
										</p>
										<Slider
											min={0}
											max={MAX_TRIM_PERCENTAGE}
											step={1}
											value={[getTrimPercentage(sliders, name)]}
											onValueChange={([value]) => {
												if (value !== undefined) {
													setSliders((prev) =>
														updateSliderValue(prev, name, value),
													)
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
													formatter={(_, __, item) =>
														`${item.payload?.jobName} ${item.payload?.durationDisplay}`
													}
												/>
											}
										/>
										<ChartLegend content={<ChartLegendContent />} />
										<Bar
											dataKey="duration"
											fill="var(--color-duration)"
											radius={4}
											onClick={({payload}: {payload: Job}) => {
												if (payload) {
													window.open(
														`https://${__DOMAIN__}${payload.webPath}`,
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
