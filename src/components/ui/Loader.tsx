import {cn} from "@/lib/utils"
import {cva, type VariantProps} from "class-variance-authority"

const loaderVariants = cva("text-foreground mr-3 -ml-1 animate-spin ", {
	variants: {
		variant: {
			default: "size-5",
			page: "size-7",
		},
	},
	// defaultVariants: {
	// variant: "default"
	// }
})

export function Loader({
	variant,
	className,
	...props
}: React.ComponentProps<"svg"> & VariantProps<typeof loaderVariants>) {
	return (
		<span className={variant === "page" ? "animate-fade flex h-svh items-center justify-center" : ""}>
			<svg
				role="img"
				aria-label="loading"
				className={cn(loaderVariants({variant, className}))}
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				{...props}
			>
				<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
				<path
					className="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				/>
			</svg>
		</span>
	)
}

export const LoaderPage: typeof Loader = (props) => <Loader variant="page" {...props} />
