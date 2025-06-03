import {JobsQuery} from "../../hooks/data/pipes.gql"
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
import {Input} from "@/components/ui/input"
import {Slider} from "@/components/ui/slider"
import type {JobDurationsQuery} from "@/graphql/graphql"
import {useFetch} from "@/hooks/use-fetch"
import {useTrimSliders} from "@/hooks/use-trim-sliders"
import {useQuery} from "@tanstack/react-query"
import {createFileRoute, useNavigate} from "@tanstack/react-router"
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

export const Route = createFileRoute("/_authed/jobs/")({
	component: RouteComponent,
	validateSearch: (search) => {
		return {
			app: (search.app as string) ?? "your-app",
		}
	},
})

export const RouteJobsIndex = Route.fullPath

const MAX_TRIM_PERCENTAGE = 50
function RouteComponent() {
	const {app: urlApp} = Route.useSearch()
	const navigate = useNavigate({from: Route.fullPath})
	const [done, setDone] = useState(urlApp !== "your-app")
	const [app, setApp] = useState(urlApp)

	if (!done) {
		return (
			<div className="flex flex-col gap-4">
				<Input
					type="text"
					placeholder="App"
					value={app}
					onChange={(e) => {
						const value = e.target.value
						setApp(value)
						navigate({
							search: {app: value},
						})
					}}
				/>
				<Button onClick={() => setDone(true)}>Done</Button>
			</div>
		)
	}

	return <JobChart app={app} />
}

function JobChart({app}: {app: string}) {
	const {sliders, getTrimPercentage, getAppliedTrimming, trimSlidersStore} = useTrimSliders({name: "jobs"})

	const fetch = useFetch()
	const {data, isLoading, error} = useQuery({
		queryKey: ["jobs"],
		queryFn: async () => {
			const MAX_PAGES = 4
			let currentPage = 1
			let cursor: string | undefined = undefined
			let hasNextPage = true
			let allData = null

			while (hasNextPage && currentPage <= MAX_PAGES) {
				const pageData = (await fetch(JobsQuery, {app, cursor})) as JobDurationsQuery

				if (!allData) {
					allData = pageData
				} else if (pageData?.project?.pipelines?.nodes) {
					// Merge the nodes from the current page into the accumulated data
					allData.project!.pipelines!.nodes = [
						...(allData.project!.pipelines!.nodes || []),
						...(pageData.project!.pipelines!.nodes || []),
					]
				}

				hasNextPage = Boolean(pageData?.project?.pipelines?.pageInfo.hasNextPage)
				cursor = pageData?.project?.pipelines?.pageInfo.endCursor || undefined
				currentPage++
			}

			return allData
		},
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
						name: BUILD_JOBS.includes(job?.name ?? "nope") ? "build" : job?.name,
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
		trimSlidersStore.send({type: "initializeSliders", sources: jobNames})
	}, [data, trimSlidersStore])

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
			{sliders.length > 0
				&& Object.entries(groupedData)
					.map(([name, data]) => {
						const trimmedData = getAppliedTrimming(data, name)
						return [
							name,
							trimmedData.map((d) => {
								if (d.date.startsWith("2025-05-22")) {
									// replace duration with special - this allows a stacked bar chart to display in a different color
									// there's probably a better way to do this
									return {...d, duration: 0, special: d.duration}
								}
								return d
							}),
						] as const
					})
					.map(([name, data]) => {
						const averageDuration = data.reduce((acc, d) => acc + d.duration, 0) / data.length
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
										<p className="shrink-0 text-sm text-gray-500">Trim percentage {getTrimPercentage(name)}%</p>
										<Slider
											min={0}
											max={MAX_TRIM_PERCENTAGE}
											step={1}
											value={[getTrimPercentage(name)]}
											onValueChange={([value]) => {
												if (value !== undefined) {
													trimSlidersStore.send({
														type: "updateSliderValue",
														source: name,
														value,
													})
												}
											}}
										/>
									</div>
								</div>
								<ChartContainer config={chartConfig}>
									<BarChart accessibilityLayer data={data}>
										<XAxis dataKey="date" tickMargin={10} tickFormatter={(value) => format(value, "d/MM")} />
										<ChartTooltip
											content={
												<ChartTooltipContent
													formatter={(_, __, item) => `${item.payload?.jobName} ${item.payload?.durationDisplay}`}
												/>
											}
										/>
										<ChartLegend content={<ChartLegendContent />} />
										<Bar dataKey="special" stackId="a" fill="var(--color-special)" radius={4} />
										<Bar
											dataKey="duration"
											stackId="a"
											fill="var(--color-duration)"
											radius={4}
											onClick={({payload}: {payload: Job}) => {
												if (payload) {
													window.open(`https://gitlab.com${payload.webPath}`, "_blank")
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
