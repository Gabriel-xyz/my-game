import { Projectile } from "../exports"
/*
although byond does it, syncing the x/y/etc of every projectile every frame is the most expensive way to do it. it would be cheaper, for projectiles that go straight or some other preset pattern, to have the user send their mouse position 20x per second to the server, and just send the projectile flying towards that on the server but never sync its x/y but send a special message for the user to spawn their own visualization of that projectile going in the same direction in the same velocity
*/
//1 the reason i use lastUnpooled to begin with is because of nengi's interpolation ghosting, if i let a pooled object be pulled from the pool almost immediately after it just 'deleted', clientside nengi ghosting occurs, i need to give nengi entity system time to know that this entity no longer exists on the client's screen because it has been repooled on the server and it will send the entity destroy signal to that client which means next time it is unpooled it is like an entirely new entity appearing on the client's screen for the first time, thus no interpolation ghosting (seems like nengi interpolation ghosting is no longer an issue now that i remove the entity from the channel when the sprite deletes, and add the entity back to the channel when the sprite is pulled from the pool again)
// todo: delete pooled projectiles permanently if they havent been unpooled in over 5 minutes, since it implies too many have filled the pool for current conditions, for whatever reason, but probably leave them be if theres under 50 of them total
// i decided not to have some base Pool class. each pool for different types of object has its own specific needs, so im just going to code them as needed unrelated to each other. for example to fire a projectile you need x,y,angle etc, but for another type of pool it needs entirely separate and/or more/less arguments to use that pooled object. i want autocomplete on those functions showing clearly the desired parameters
export class ProjectilePool {
	scene
	entries = []
	constructor(scene) {
		this.scene = scene
	}
	get(x, y, angle, firer, texture = 'rapid-blast', alpha) {
		let now = Date.now()
		let object, wasNew = false
		for (let o of this.entries) {
			if (!o.active && now - o.lastUnpooled > 500) {
				object = o
				break
			}
		}
		if (!object) {
			object = new Projectile(this.scene, x, y, angle, texture, undefined, alpha)
			this.entries.push(object)
			wasNew = true
		}
		object.setTexture(texture)
		object.firer = firer
		object.pooled = false
		object.setActive(true)
		object.setVisible(true)
		object.setAlpha(alpha === undefined ? 1 : alpha)
		object.lastUnpooled = now
		if(!wasNew) object.resetObject()
		object.setPosition(x,y)
		object.setAngle(angle)
		return object
	}
}

// todo: PickupPool