import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import {Route as JobsRoute} from "@/routes/_authed/jobs.index"
import {Route as PipesRoute} from "@/routes/_authed/pipes.index"
import {Link} from "@tanstack/react-router"
import {ChartColumn, ChartScatter, Home, Settings} from "lucide-react"

export function AppSidebar() {
	// Menu items.
	const items = [
		{
			title: "Home",
			url: "/",
			icon: Home,
		},
		{
			title: "Pipes",
			url: PipesRoute.fullPath,
			icon: ChartColumn,
		},
		{
			title: "Jobs",
			url: JobsRoute.fullPath,
			icon: ChartScatter,
		},
		{
			title: "Settings",
			url: "#",
			icon: Settings,
		},
	]
	return (
		<Sidebar>
			<SidebarHeader />
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupLabel>Application</SidebarGroupLabel>
					<SidebarGroupContent>
						<SidebarMenu>
							{items.map((item) => (
								<SidebarMenuItem key={item.title}>
									<SidebarMenuButton asChild>
										<Link to={item.url} search={(prev) => prev}>
											<item.icon />
											<span>{item.title}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter />
		</Sidebar>
	)
}
