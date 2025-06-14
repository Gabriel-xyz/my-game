// https://egghead.io/blog/object-pool-design-pattern
export class PoolsManager {
	constructor() {

	}
}
export class Pool {
	entries = []
	actives = new Set()
	constructor(constructorFunction, resetFunction, initialSize = 100) {
		this.constructorFunction = constructorFunction
		this.resetFunction = resetFunction
		this.create(initialSize)
	}
	create(amount) {
		for (let i = 0; i < amount; i++) {
			let o = this.constructorFunction()
			this.entries.push(o)
		}
	}
	get() {
		let o = this.entries.pop() ?? this.constructorFunction()
		this.actives.add(o)
		return o
	}
	set(o) {
		if (this.actives.has(o)) {
			this.actives.delete(o)
			this.reset(o)
		}
	}
	reset(o) {
		this.resetFunction.call(o)
	}
}
