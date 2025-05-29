import type {TrimSlider, TrimableData} from "@/lib/trim-utils"
import {applyTrimming} from "@/lib/trim-utils"
import {createStore} from "@xstate/store"
import {useSelector} from "@xstate/store/react"
import {useCallback, useMemo, useRef} from "react"

const createTrimSlidersStore = () =>
	createStore({
		context: {
			sliders: [] as TrimSlider[],
		},
		on: {
			initializeSliders: (context, event: {sources: string[]}) => ({
				...context,
				sliders: event.sources.map((source) => ({
					source,
					trimPercentage: [0] as [number],
				})),
			}),
			updateSliderValue: (context, event: {source: string; value: number}) => ({
				...context,
				sliders: context.sliders.map((slider) =>
					slider.source === event.source
						? {...slider, trimPercentage: [event.value] as [number]}
						: slider,
				),
			}),
		},
	})

/**
 * Hook for managing trim sliders with XState store
 */
export function useTrimSliders() {
	const trimSlidersStore = useRef(createTrimSlidersStore()).current

	const sliders = useSelector(
		trimSlidersStore,
		(state) => state.context.sliders,
	)

	const getTrimPercentage = useCallback(
		(source: string): number => {
			const slider = sliders.find((s) => s.source === source)
			if (slider === undefined) {
				throw new Error(`Trim percentage not found for source: ${source}`)
			}
			return slider.trimPercentage[0]
		},
		[sliders],
	)

	const getAppliedTrimming = useCallback(
		<T extends TrimableData>(data: T[], source: string): T[] => {
			const trimPercentage = getTrimPercentage(source)
			return applyTrimming(data, trimPercentage)
		},
		[getTrimPercentage],
	)

	return useMemo(
		() => ({
			trimSlidersStore,
			sliders,
			getTrimPercentage,
			getAppliedTrimming,
		}),
		[trimSlidersStore, sliders, getTrimPercentage, getAppliedTrimming],
	)
}
