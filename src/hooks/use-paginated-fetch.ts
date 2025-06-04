import {useFetch} from "./use-fetch"

interface PageInfo {
	hasNextPage: boolean
	endCursor?: string | null
}

export interface PaginatedData {
	project?: {
		pipelines?: {
			pageInfo: PageInfo
			nodes?: any[] | null
		} | null
	} | null
}

/**
 * Fetches paginated data from GraphQL queries with cursor-based pagination
 * @param query The GraphQL query document
 * @param variables The variables for the query
 * @param maxPages Maximum number of pages to fetch (default: 4)
 * @returns The combined result from all fetched pages
 */
export function usePaginatedFetch() {
	const fetch = useFetch()

	return async function fetchPaginated<T extends PaginatedData>(
		query: any,
		initialVariables: Record<string, any>,
		maxPages: number = 4,
	): Promise<T | null> {
		let currentPage = 1
		let cursor: string | undefined = initialVariables.cursor
		let hasNextPage = true
		let allData: T | null = null

		while (hasNextPage && currentPage <= maxPages) {
			// Create a new variables object with the current cursor
			const variables = {...initialVariables, cursor}

			// Type assertion is needed because we don't know the exact structure at compile time
			const pageData = (await fetch(query, variables)) as T

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
	}
}
