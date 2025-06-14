export class GameObject{
	constructor(){
		this.components = new Map()
	}
	addComponent(type){
		if(this.components.has(type)){
			console.warn(`component ${type} already exists`)
			return
		}
		this.components.set(type, new type(this))
	}
	removeComponent(type){
		let result = this.components.delete(type)
	}
	getComponent(type){
		return this.components.get(type)
	}
	// objects need to be able to be reset for pools
	reset(){
		
	}
	setActive(active){
		
	}
}