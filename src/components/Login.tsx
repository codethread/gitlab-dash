import {Button} from "@/components/ui/button"
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form"
import {Input} from "@/components/ui/input"
import {useAuth} from "@/hooks/auth"
import {zodResolver} from "@hookform/resolvers/zod"
import {useState} from "react"
import {useForm, type UseFormReturn, useWatch} from "react-hook-form"
import {toast} from "sonner"
import {z} from "zod"

const FormSchema = z.object({
	domain: z.string().min(2, {
		message: "Domain must be at least 2 characters.",
	}),
	token: z.string().min(2, {
		message: "Token must be at least 2 characters.",
	}),
})

export function Login() {
	const [domain, setDomain] = useState("")
	const [token, setToken] = useState("")
	const {setAuth} = useAuth()

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			domain: "",
			token: "",
		},
	})

	function onSubmit(data: z.infer<typeof FormSchema>) {
		setAuth(data.domain, data.token)
		toast.success("Successfully logged in")
	}

	return (
		<div className="mt-[10vh] flex w-full items-center justify-center">
			<div className="border-border w-full max-w-3xl space-y-8 rounded-lg border p-8">
				<div className="mx-auto w-2/3 space-y-2 text-center">
					<h2 className="text-foreground mt-6 text-center text-3xl leading-loose font-extrabold">
						Sign in to GitLab Dashboard
					</h2>
					<p className="text-muted-foreground leading-normal text-pretty">
						<span className="text-amber-200">NOTE:</span>
						<b> Your token is stored in local storage.</b> <br />
						<br />
						It is recommended to use a personal access token with limited scope.
					</p>
				</div>
				<div className="flex items-center justify-center">
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
							<FormField
								control={form.control}
								name="domain"
								render={({field}) => (
									<FormItem>
										<FormLabel>Domain</FormLabel>
										<FormControl>
											<Input placeholder="gitlab.com" {...field} />
										</FormControl>
										<FormDescription>This is your GitLab domain.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="token"
								render={({field}) => (
									<FormItem>
										<FormLabel>Token</FormLabel>
										<FormControl>
											<Input type="password" placeholder="glpat-1234567890" autoComplete="off" {...field} />
										</FormControl>
										<FormDescription>This is your GitLab personal access token.</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex justify-center gap-4">
								<Button type="submit">Login</Button>
								<CreateTokenButton form={form} />
							</div>
						</form>
					</Form>
				</div>
			</div>
		</div>
	)
}

function CreateTokenButton({form}: {form: UseFormReturn<z.infer<typeof FormSchema>>}) {
	const domain = useWatch({control: form.control, name: "domain"})
	return (
		<Button
			type="button"
			variant="outline"
			disabled={!domain}
			onClick={() => {
				window.open(`https://${domain}/-/profile/personal_access_tokens`, "_blank")
			}}
		>
			{domain ? "Create token" : "Enter domain"}
		</Button>
	)
}
