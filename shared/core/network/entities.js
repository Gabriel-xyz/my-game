import { Binary, defineSchema } from "nengi"
import { clamp, compressAngle, decompressAngle, depthSyncMult, scaleSyncMult, NType, stringToTextureId, textureIdToString, textureIds } from "../exports.js"
export class FireDamageAreaEntity {
	lastUpdate = 0 // do not remove. all entities need a lastUpdate property for the code that checks whether update should be called, elsewhere, even if its not technically needed within the entity itself
	nid = 0
	ntype = NType.FireDamageAreaEntity
	x = 0
	y = 0
	fireDamageRadius = 0
	fireStartedAt = 0
	constructor(parent) {
		parent.entity = this
		this.update(parent)
	}
	update(from) {
		this.x = from.x
		this.y = from.y
		this.fireDamageRadius = from.areaDamageRadius // different names because DamageAreas and FireDamageAreas both have the areaDamageRadius property and i want the client to be able to differentiate by the property on the entity that this is a fireDamageArea so it knows to spawn fire fx
		this.fireStartedAt = from.fireStartedAt
	}
}
export const FireDamageAreaEntitySchema = defineSchema({
	x: { type: Binary.Float32, interp: false },
	y: { type: Binary.Float32, interp: false },
	fireDamageRadius: { type: Binary.UInt16, interp: false },
	fireStartedAt: { type: Binary.Float64, interp: false }, // warning: nothing other than Float64 will work for a timestamp from Date.now, it is too big (1.6 trillion at this time), Float32 'works' if you want the timestamp to only change like every minute or two since thats its max precision for numbers that large and it doesnt register those small changes. the reason im using Date.now is because nengi uses Date.now to set its server timestamp that is shared between the server and client. annoying. one day i could edit the nengi source or do something else to make it not just use raw Date.now which measures from 1970, but just measure from when the server started. then i could safely use a uint32, but i couldnt use a uint16 since 0 to 65535 is only 108 minutes assuming each +1 represents 1/10th seconds and not miliseconds since im going to divide the timestamp by 100 to make it into 100ms measurements instead of 1ms intervals
	//1 actually you know what, this method of doing this is probably completely flawed, i dont have to send a property of when the fire started on the entity, the client can deduce it during its createEntities cycle, by checking if the entity is being created near the edge of their view, if it is then dont play the sound because the fire already existed there and you just walked to where it was, otherwise play the sound because the fire appeared deeper in your view which means its probably new fire that was just made on the server
})
export class VisualsEntity {
	lastUpdate = 0
	nid = 0 // will be assigned by nengi, 0 is placeholder
	ntype = NType.VisualsEntity
	x = 0
	y = 0
	angle = 0
	alpha = 1 // alpha appears to be between 0 and 1 from what i saw in the phaser source code
	scale = 1
	textureId = 0
	frame = 0
	depth = 0
	autoFlipX = false
	weaponOverlayId = 0
	attackAngle = 0
	health = 0
	xp = 0
	level = 0
	overlays = 0b0000000000000000
	constructor(parent) {
		parent.entity = this
		this.update(parent)
		this.lastUpdate = parent.scene.time.now + Math.random() * 500 // i dont want all entity's slow-update when the player hasnt been nearby to be on the same timestep
	}
	update(from) {
		this.lastUpdate = from.scene.time.now
		this.x = clamp(from.x, 0, 65535) // clamped to prevent nengi ERR_OUT_OF_RANGE because even though i have collideworldbounds on, you would think that would limit their x/y to 0 to 500*64 the way i have my map set up, but in actuality if they go to the far top or left of the map, their x/y can become like -2 temporarily which causes this error
		this.y = clamp(from.y, 0, 65535)
		this.angle = compressAngle(from.angle)
		this.alpha = from.alpha * 255
		this.scale = clamp(from.scale * scaleSyncMult, 0, 255)
		this.textureId = (from.texture && from.texture.key) ? stringToTextureId.get(from.texture.key) : textureIds.none
		this.depth = clamp(from.depth * depthSyncMult, 0, 255) // since depth schema is uint8, but im multiplying the server sprite's depth by 25 here, the possible syncronized depths are 0-10 (depth of 10, *25 = 250), so on the server i should not set a sprite's depth to anything but 0-10 because it wont syncronize anything other than that. but the resolution of possible depths i can give the sprite is 10 / 255, or 0.04, so i can use 1, 1.04, 1.08, 1.12, etc so long as its between 0-10
		this.autoFlipX = from.autoFlipX
		this.weaponOverlayId = stringToTextureId.get(from.weaponOverlay)
		// console.log(this.weaponOverlayId,from.weaponOverlay)
		this.attackAngle = compressAngle(from.attackAngle)
		this.health = from.health
		this.xp = from.xp
		this.level = from.level
		this.overlays = from.overlays
	}
}
export function entityUpdateClient(dt) {
	let entity = this.entity
	if (entity.autoFlipX) {
		if (entity.x < this.x - 0.1) this.setFlipX(true)
		if (entity.x > this.x + 0.1) this.setFlipX(false)
	}
	this.x = entity.x
	this.y = entity.y
	// the reason for all these undefined checks is that there are many different possible types of entities this sprite may have, not just VisualsEntity, so this is an attempt to use any properties that are present, without checking the entity type explicitly, since i dont know how to do that at this time
	if (entity.angle !== undefined) this.angle = decompressAngle(entity.angle)
	if (entity.alpha !== undefined) this.alpha = entity.alpha / 255
	if (entity.scale !== undefined) this.scale = entity.scale / scaleSyncMult
	if (entity.textureId !== undefined && this.texture.key !== textureIdToString.get(entity.textureId)) this.setTexture(textureIdToString.get(entity.textureId))
	if (entity.depth !== undefined) this.baseDepth = entity.depth / depthSyncMult
	if (entity.weaponOverlayId !== undefined) this.weaponOverlay = textureIdToString.get(entity.weaponOverlayId)
	if (entity.attackAngle !== undefined) {
		let attackAngle = decompressAngle(entity.attackAngle)
		this.attackAngle = Phaser.Math.RadToDeg(Phaser.Math.Angle.RotateTo(Phaser.Math.DegToRad(this.attackAngle), Phaser.Math.DegToRad(attackAngle), 15 * dt / 1000))
	}
	if (entity.health !== undefined) this.health = entity.health
	if (entity.overlays !== undefined) this.overlays = entity.overlays
}
//2 the biggest reason it is important to optimize the entities properties to the least amount of bits possible is because entities are constantly being created/destroyed in/out of the player's viewport. if NPCs are constantly walking in and out of the player's viewport their entity is constantly being recreated for every NPC that enters the viewport. recreating the entire entity and all its properties for that client so that it spawns in with all the correct values at once must be the most expensive aspect of having many moving objects in the game constantly moving in/out of the player's view
//1 this is also why its important to have as few properties on the entities as possible. there's no bigger optimization to the bits contained in a property than to get rid of the property
export const VisualsEntitySchema = defineSchema({
	// nid: Binary.UInt32 is already included by nengi (look into using something less than uint32)
	// ntype: Binary.UInt8 is already included by nengi
	x: { type: Binary.UInt16, interp: true }, // uint16 works fine because 64 * 500 map is only 32000, 64 * 1000 is 64000
	y: { type: Binary.UInt16, interp: true },
	angle: { type: Binary.UInt8, interp: false }, // the reason interp is false on this is because nengi's interpolation causes the sprite to jerk when the angle goes from for example 255 then to 0, its supposed to wrap like an angle but nengi's interpolation has no concept of knowing that this is an angle
	alpha: { type: Binary.UInt8, interp: true }, // eventually we want to compress this into UInt4 (0-15), 15 shades of alpha seems good enough to me but if not use more
	scale: { type: Binary.UInt8, interp: true }, // can probably compress this into a UInt6 or lower when the time comes
	textureId: { type: Binary.UInt8 },
	frame: { type: Binary.UInt8, interp: false }, // not sure i want to send the actual frame, instead maybe send the animation to play, or not idk
	depth: { type: Binary.UInt8, interp: false },
	autoFlipX: { type: Binary.Boolean },
	weaponOverlayId: { type: Binary.UInt8, interp: false },
	attackAngle: { type: Binary.UInt8, interp: false },
	health: { type: Binary.UInt8, interp: false }, // theoretically this could be 6 bits (0-64) and i just scale it up to 0-100 on the client
	xp: { type: Binary.UInt8, interp: false }, // could also be 6 bits
	level: { type: Binary.UInt8, interp: false },
	overlays: { type: Binary.UInt16, interp: false },
})