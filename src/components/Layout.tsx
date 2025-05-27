import {Toaster} from "./ui/sonner"
import {AppSidebar} from "@/components/app-sidebar"
import {SidebarProvider, SidebarTrigger} from "@/components/ui/sidebar"

export function Layout({children}: IChildren) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<main className="m-4 w-full">
				<SidebarTrigger />
				{children}
			</main>
			<Toaster />
		</SidebarProvider>
	)
}
