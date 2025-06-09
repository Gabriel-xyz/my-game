import { getSound, getSprite } from "./exports"

export function TotalBloodFx(scene, x, y, pool = true, splatter = true, amount, range, minSize, maxSize, poolSize, poolKey = 'blood-pool', splatterKey = 'blood-splatter') {
	if (pool) BloodPoolFx(scene, x, y, poolSize, poolKey)
	if (splatter) BloodSplatterFx(scene, x, y, amount, range, minSize, maxSize, splatterKey)
}
export function BloodPoolFx(scene, x, y, size = 1, poolKey = 'blood-pool') {
	let o = getSprite(scene, x, y, poolKey)
	o.baseDepth = -1
	o.setOrigin(0.5, 0.15)
	if (size) o.setScale(size * 2)
	o.deleteAfter = scene.time.now + 30000
	o.deleteFadeAlphaTime = 1000
}
export function BloodSplatterFx(scene, x, y, amount = 10, range = 100, minSize = 1.7, maxSize = 2.6, splatterKey = 'blood-splatter') {
	getSound(scene, range <= 200 ? 'splatter-1' : 'splatter-2').play()
	for (let i = 0; i < amount; i++) {
		let rx = x + Phaser.Math.RND.between(0, range * 2) - range
		let ry = y + Phaser.Math.RND.between(0, range * 2) - range
		if (Phaser.Math.Distance.Between(x, y, rx, ry) > range) {
			i--
			continue //try again - out of range - will not be circular as desired
		}
		let o = getSprite(scene, x, y, splatterKey)
		o.anims.play(splatterKey, false)
		o.angle = Phaser.Math.RND.between(0, 360) - 180
		o.baseDepth = 1
		o.isBloodSplatter = true
		let scale = Phaser.Math.RND.between(minSize * 100, maxSize * 100) / 100
		o.setScale(scale)
		let radian = Phaser.Math.Angle.Between(x, y, rx, ry)
		let vel = 2.5 * range
		let velX = Math.cos(radian) * vel
		let velY = Math.sin(radian) * vel
		let dist = Phaser.Math.Distance.Between(x, y, rx, ry)
		let timeNeeded = dist / vel //seconds required to cover the needed distance
		o.bloodVelX = velX
		o.bloodVelY = velY
		o.bloodMoveUntil = scene.time.now + timeNeeded * 1000
		o.deleteAfter = Math.random() * 5000 + 5000 + scene.time.now
		o.deleteFadeAlphaTime = 1000
	}
}
export function ExplosionFX(scene, x, y) {
	ShockwaveFx(scene.cameras.main, x, y)
	getSound(scene, 'explosion').play()
	let o = getSprite(scene, x, y, 'explosion-1')
	o.anims.play('explosion-1', false)
	o.baseDepth = 2
	o.scale = 1.7
	o.deleteAfter = scene.time.now + 2000
	let fireSprite = MakeFireFXAt(scene, x, y)
	fireSprite.deleteAfter = scene.time.now + 12000
    fireSprite.deleteFadeAlphaTime = 1400
}
let fireRND
export function FireFX(scene, x, y, amount = 15, radius = 180, playSound = true) {
	if (!fireRND) fireRND = new Phaser.Math.RandomDataGenerator()
	if (playSound) getSound(scene, 'fire-ignite').play()
	fireRND.sow([x + y])
	let angle = fireRND.angle()
	let angleAdd = 42.777
	let fireObjects = []
	for (let i = 0; i <= amount; i++) {
		angle = Phaser.Math.Angle.WrapDegrees(angle + angleAdd)
		let o = MakeFireFXAt(scene, x, y)
		o.scale = 1.5
		o.originY = 0.75
		let _radius = radius - (o.displayWidth + o.displayHeight) / 2 / 2 * 0.1 // because the halfwidth of the sprite makes it seem you can stand in the fire even though you should be being damaged because half the sprite on the client's side is sitting father than the damage area on the server
		if (_radius < 1) _radius = 1
		let dist = _radius * 0.2 + _radius * 0.2 * (i % 5)
		o.fireFxGoalPosition = o.scene.physics.velocityFromAngle(angle, dist)
		o.fireFxGoalPosition.x += x
		o.fireFxGoalPosition.y += y
		fireObjects.push(o)
	}
	return fireObjects
}
export function MakeFireFXAt(scene, x, y) {
	let o = getSprite(scene, x, y, 'fire-1')
	o.scene.fireSprites.push(o)
	o.anims.play('fire-1', false)
	o.baseDepth = 0.1
	o.scale = 1.2 + Math.random() * 0.2
	return o
}
export function ShockwaveFx(camera, x = 0, y = 0, radiusAdd = 2000, widthSub = 800, waveWidth = 300) {
	//1 there can only be 1 shockwave effect per camera. i guess for multiple shockwaves maybe i could just spawn temporary cameras or something. conveniently, using this function before the first shockwave is done just restarts the shockwave, so i dont have to do anything extra to make sure no shockwave is already in progress before calling this function again
	// https://rexrainbow.github.io/phaser3-rex-notes/docs/site/shader-shockwave/
	let canvasX = x - camera.scrollX + camera.x
	let canvasY = y - camera.scrollY + camera.y
	let fx = camera.scene.plugins.get('rexShockwavePipeline').add(camera, {
		center: {
			x: canvasX,
			y: canvasY,
		},
		waveRadius: 0,
		waveWidth: waveWidth,
		powBaseScale: 0.8,
		powExponent: 0.1,
		name: 'rexShockwavePostFx',
	})
	fx.radiusAdd = radiusAdd // per second
	fx.widthSub = widthSub // per second
	fx.camera = camera
	fx.deleteAfter = camera.scene.time.now + 1000 * (fx.waveWidth / fx.widthSub)
	camera.scene.shockwaves.push(fx)
}