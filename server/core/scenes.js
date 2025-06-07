import { System } from "skale-physics"
export class Scene {
	objects = []
	constructor(map) {
		this.map = map
		this.physics = new System()
	}
	create(config) {

	}
	add(object) {
		if (this.objects.indexOf(object) != -1) return
		this.objects.push(object)
	}
	remove(object) {
		if (this.objects.indexOf(object) === -1) return
		this.objects.splice(this.objects.indexOf(object), 1)
	}
}