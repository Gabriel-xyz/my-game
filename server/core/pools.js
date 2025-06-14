export class Pool{
	entries = []
	type
	constructor(){

	}
	get(){
		let o = this.entries.pop() ?? new this.type()
		return o
	}
}
