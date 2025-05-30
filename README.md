# Gitlab dashboards

A simple dashboard application for viewing various metrics about GitLab pipeline health within a deployed instance.

## Features

- View key pipeline health metrics at a glance.
- **Job Duration Dashboard**: Visualizes the duration of different CI/CD jobs (e.g., checks, build, deployment) over time, allowing users to identify bottlenecks or performance changes in specific jobs.
- **Pipeline Duration Dashboard**: Displays the duration of CI/CD pipelines, grouped by their trigger source (e.g., push, merge request, schedule). This helps in understanding how different types of triggers impact pipeline performance.
- Filter metrics by specific GitLab application/project.
- Adjustable data trimming to exclude outliers from visualizations.
- View average durations for jobs and pipelines.
- Direct links to corresponding GitLab jobs/pipelines from the dashboards.
- Copy GraphQL queries used for fetching data.
