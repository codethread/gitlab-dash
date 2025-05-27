import {exec} from "node:child_process"

export function run(cmd: string) {
	return new Promise((res, rej) => {
		exec(cmd)
			.on("error", rej)
			.on("exit", (status) => {
				if (status === 0) res(undefined)
				else rej(`FAILED: ${cmd}`)
			})
	})
}
