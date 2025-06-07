let time = performance.now(), dt = 1 / 60
export const loop = (manager) => {
	setImmediate(loop, manager)
	let now = performance.now()
	dt = (now - time) / 1000
	time = now
	manager.step(dt, time)
}