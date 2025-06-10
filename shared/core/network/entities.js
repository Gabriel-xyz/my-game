import { Binary, defineSchema } from "nengi"
import { clamp, compressAngle, decompressAngle, depthSyncMult, scaleSyncMult, NType, stringToTextureId, textureIdToString, textureIds } from "../exports.js"
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