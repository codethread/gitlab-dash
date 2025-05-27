import {graphql} from "@/graphql"

export const PipesQuery = graphql(`
	query JobDurations($app: ID!, $cursor: String) {
		project(fullPath: $app) {
			name
			pipelines(status: SUCCESS, first: 100, after: $cursor) {
				pageInfo {
					hasNextPage
					endCursor
				}
				nodes {
					duration
					createdAt
					finishedAt
					jobs(statuses: [SUCCESS]) {
						nodes {
							name
							webPath
							duration
						}
					}
				}
			}
		}
	}
`)
