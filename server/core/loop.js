// TODO at this time i think loop functionality should be part of the manager, idk why i made it this way
let time = performance.now(), dt = 1 / 60, tick = 0
export const loop = (manager) => {
	setImmediate(loop, manager)
	let now = performance.now()
	dt = (now - time) / 1000
	time = now
	manager.step(dt, time, tick++)
}