export class ComponentManager {
	componentType1 = []
	componentType2 = []
	update(dt, time) {
		for (let i = 0; i < this.componentType1.length; i++) {
			// do component1 thing
		}
		for (let i = 0; i < this.componentType2.length; i++) {
			// do component2 thing
		}
		// etc
	}
}