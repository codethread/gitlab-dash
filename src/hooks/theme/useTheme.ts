import {createContext, useContext} from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderState = {
	theme: Theme
	setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
	theme: "system",
	setTheme: () => null,
}

export const themeContext = createContext<ThemeProviderState>(initialState)

export const useTheme = () => {
	const context = useContext(themeContext)

	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider")

	return context
}
