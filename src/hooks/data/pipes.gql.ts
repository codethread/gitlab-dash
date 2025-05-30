import {graphql} from "@/graphql"

export const JobsQuery = graphql(`
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

export const PipesQuery = graphql(`
	query Pipes($app: ID!, $cursor: String) {
		project(fullPath: $app) {
			name
			pipelines(status: SUCCESS, first: 100, after: $cursor) {
				pageInfo {
					hasNextPage
					endCursor
				}
				nodes {
					source
					path
					duration
					createdAt
					finishedAt
				}
			}
		}
	}
`)
