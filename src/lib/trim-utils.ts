export interface TrimSlider {
	source: string
	trimPercentage: [number]
}

export interface TrimableData {
	duration: number
}

/**
 * Apply percentile-based trimming to data based on duration
 */
export function applyTrimming<T extends TrimableData>(data: T[], trimPercentage: number): T[] {
	if (trimPercentage === 0) {
		return data
	}

	// Sort data by duration to find percentile-based thresholds
	const sortedData = [...data].sort((a, b) => a.duration - b.duration)
	const totalCount = sortedData.length

	// Calculate how many items to trim from the high end
	const trimCount = Math.floor((totalCount * trimPercentage) / 100)

	const maxThreshold =
		trimCount > 0 ? sortedData[totalCount - 1 - trimCount]?.duration : sortedData[totalCount - 1]?.duration

	if (maxThreshold !== undefined) {
		return data.filter((d) => d.duration <= maxThreshold)
	}

	return data
}

/**
 * Initialize sliders for a set of sources
 */
export function initializeSliders(sources: string[]): TrimSlider[] {
	return sources.map((source) => ({
		source,
		trimPercentage: [0],
	}))
}

/**
 * Update a specific slider's trim percentage
 */
export function updateSliderValue(sliders: TrimSlider[], source: string, value: number): TrimSlider[] {
	return sliders.map((slider) => (slider.source === source ? {...slider, trimPercentage: [value]} : slider))
}

/**
 * Get trim percentage for a specific source
 */
export function getTrimPercentage(sliders: TrimSlider[], source: string): number {
	const slider = sliders.find((s) => s.source === source)
	if (slider === undefined) {
		throw new Error(`Trim percentage not found for source: ${source}`)
	}
	return slider.trimPercentage[0]
}
