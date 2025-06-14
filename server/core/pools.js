// https://egghead.io/blog/object-pool-design-pattern
export class PoolsManager {
	constructor() {

	}
}
export class Pool {
	entries = []
	actives = new Set() // cant be 'gotten' if its in this set, its in use
	constructor(constructorFunction, resetFunction, initialSize = 100) {
		this.constructorFunction = constructorFunction
		this.resetFunction = resetFunction
		this.create(initialSize)
	}
	create(amount) {

	}
	get() {
		let o = this.entries.pop() ?? this.constructorFunction()
		return o
	}
	set(o) {

	}
	reset(o) {

	}
}
