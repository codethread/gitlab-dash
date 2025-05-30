import type {TrimableData} from "@/lib/trim-utils"
import {applyTrimming} from "@/lib/trim-utils"
import {createStore} from "@xstate/store"
import {useSelector} from "@xstate/store/react"
import {useCallback, useEffect, useMemo, useRef} from "react"
import {z} from "zod"

const TrimSlidersContextSchema = z.object({
	sliders: z.array(
		z.object({
			source: z.string(),
			trimPercentage: z.tuple([z.number()]),
		}),
	),
})
type TrimSlidersContext = z.infer<typeof TrimSlidersContextSchema>

const defaultContext: TrimSlidersContext = {
	sliders: [],
}

const createTrimSlidersStore = (snapshot: TrimSlidersContext | null) =>
	createStore({
		context: snapshot ?? defaultContext,
		on: {
			initializeSliders: (context, event: {sources: string[]}) => ({
				...context,
				sliders: event.sources.map((source) => ({
					source,
					trimPercentage: context.sliders.find((s) => s.source === source)
						?.trimPercentage ?? [0],
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

const loadSnapshot = (value: string | null): TrimSlidersContext | null => {
	if (value === null) {
		return null
	}
	try {
		return TrimSlidersContextSchema.parse(JSON.parse(value))
	} catch (error) {
		return null
	}
}

/**
 * Hook for managing trim sliders with XState store
 */
export function useTrimSliders({name}: {name: string}) {
	const snapshot = useRef(loadSnapshot(localStorage.getItem(name))).current
	const trimSlidersStore = useRef(createTrimSlidersStore(snapshot)).current

	useEffect(() => {
		const unsubscribe = trimSlidersStore.subscribe((state) => {
			localStorage.setItem(name, JSON.stringify(state.context))
		})
		return () => unsubscribe.unsubscribe()
	}, [trimSlidersStore, name])

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
