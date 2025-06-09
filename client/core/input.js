// so for other scripts to listen to input stuff should we use events? (in events.js). every script can then listen for keyup/keydown events i guess? im not sure if this is the best way. think about it. we can make scenes have a singleton on them idk
import { ChatFocusToggle, chatting, client, BaseScene, scene1, abilityState, wasdStates, AbilityCommand, PointerPositionCommand, WASDCommand, compressAngle, KeyDownCommand, clamp } from "../exports"

export let wasdState = wasdStates.released
export let inputScene

export class InputScene extends BaseScene {
	lastSentMouseTime = 0
	lastSentMouseAngle = 0
	lastSentMouseX = 0
	lastSentMouseY = 0
	constructor() {
		super({ key: InputScene.name })
		inputScene = this
		this.lastSentWASDState = -1
	}
	init() {
		this.input.keyboard.enabled = true
		this.preventDefaultKeys = ['w', 'a', 's', 'd', 'space', 'up', 'down', 'left', 'right', 'enter', 'i', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'zero', 'r']
		this.input.keyboard.addCapture(this.preventDefaultKeys)
		/*
		properties of interest on input event objects:
		altKey: false,
		ctrlKey: false,
		shiftKey: false,
		originalEvent.key // "w" etc
		originalEvent.type // "keyup" or "keydown"
		plugin.scene (will be the InputScene object)
		*/
		// the down/up events only fire once, they are not on repeat
		//2 should i convert this to a Map instead of attaching them as properties on the scene? i might not even need this Input Scene thing in that case, and having multiple scenes running even if theyre empty probably has some overhead, just like running multiple Groups did
		for (let key of this.preventDefaultKeys) {
			/*
			properties of interest on the object returned by keyboard.addKey():
			altKey: false,
			ctrlKey: false,
			shiftKey: false,
			isDown: false,
			isUp: true,
			*/
			this[`${key}Key`] = this.input.keyboard.addKey(key)
			this[`${key}Key`].on(`down`, KeypressHandlerDown)
			this[`${key}Key`].on(`up`, KeypressHandlerUp)
		}
		this.input.on('pointerdown', PointerDown)
		this.input.on('pointerup', PointerUp)
	}
	preload() {

	}
	create() {

	}
	update() {
		if (!client) return
		// something they can only trigger every 1000ms
		// if (this.input.keyboard.checkDown(this.aKey, 1000)) {
		// 	console.log(`timed keypress`)
		// }
		this.updateAngleToMouse()
		this.checkSendMouseAngle()
		this.CaptureWASDInput()
		this.HandlePointerInput()
	}
	updateAngleToMouse() {
		if (!client.playerObject) return
		let pointer = this.input.activePointer
		if (!pointer) return
		pointer.updateWorldPoint(scene1.cameras.main)
		let radian = Phaser.Math.Angle.Between(client.playerObject.x, client.playerObject.y, pointer.worldX, pointer.worldY)
		let angle = Phaser.Math.RadToDeg(radian)
		this.angleToMouse = angle
	}
	checkSendMouseAngle() {
		let pointer = this.input.activePointer
		if (!client.playerObject || Date.now() - this.lastSentMouseTime < 1000 / 60 * 1) return // final number is resolution
		let sendAngle = Math.abs(Phaser.Math.Angle.ShortestBetween(this.angleToMouse, this.lastSentMouseAngle)) >= 180 / 200
		let sendPosition = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.lastSentMouseX, this.lastSentMouseY) >= 16
		if (!pointer.leftButtonDown() && !pointer.rightButtonDown()) sendPosition = false
		if(!sendAngle && !sendPosition) return
		let mouseX = clamp(pointer.worldX, 0, 65535), mouseY = clamp(pointer.worldY, 0, 65535)
		client.addCommand(new PointerPositionCommand(compressAngle(this.angleToMouse), mouseX, mouseY))
		this.lastSentMouseTime = Date.now()
		this.lastSentMouseAngle = this.angleToMouse
		this.lastSentMouseX = pointer.worldX
		this.lastSentMouseY = pointer.worldY
	}
	CaptureWASDInput() {
		if (chatting) wasdState = wasdStates.released
		else {
			const { wKey, aKey, sKey, dKey } = this
			const { released, north, south, east, west, northwest, northeast, southwest, southeast } = wasdStates
			if (!wKey.isDown && !aKey.isDown && !sKey.isDown && !dKey.isDown) wasdState = released
			if (wKey.isDown) wasdState = north
			if (sKey.isDown) wasdState = south
			if (dKey.isDown) wasdState = east
			if (aKey.isDown) wasdState = west
			if (wKey.isDown && aKey.isDown) wasdState = northwest
			if (wKey.isDown && dKey.isDown) wasdState = northeast
			if (sKey.isDown && aKey.isDown) wasdState = southwest
			if (sKey.isDown && dKey.isDown) wasdState = southeast
		}
		// console.log(Object.keys(wasdStates)[wasdState])
		if (wasdState != this.lastSentWASDState) {
			client.addCommand(new WASDCommand(wasdState))
			this.lastSentWASDState = wasdState
		}
	}
	HandlePointerInput() {
		if (this.input.activePointer.leftButtonDown()) {
		}
		if (this.input.activePointer.rightButtonDown()) {
		}
	}
}

function PointerDown(event) {
	PointerHandler(event, true, false) // i cant find an up/down state on the event itself so im just going to do this
}

function PointerUp(event) {
	PointerHandler(event, false, true)
}

function PointerHandler(event, isDown, isUp) {
	const LMB = 0, RMB = 2
	if (event.button == LMB) {
		let useState = isDown ? abilityState.repeat : isUp ? abilityState.stop : null
		CheckHotbarInput('LMB', useState)
	}
	if (event.button == RMB) {
		let useState = isDown ? abilityState.repeat : isUp ? abilityState.stop : null
		CheckHotbarInput('RMB', useState)
	}
}

function KeypressHandlerDown(event) {
	KeypressHandler(event)
}

function KeypressHandlerUp(event) {
	KeypressHandler(event)
}

function KeypressHandler(event) {
	const { keyCode, isDown, isUp } = event
	const { ENTER, I, ONE, TWO, THREE, FOUR, FIVE, SIX, SEVEN, EIGHT, NINE, ZERO, R } = Phaser.Input.Keyboard.KeyCodes
	if (keyCode == ENTER) {
		if (isDown) {
			ChatFocusToggle()
		}
	}
	if (keyCode == I) {
		if (isDown) {
			if (!chatting) {
				let invWindow = document.querySelector('.inv-window')
				invWindow.hidden = !invWindow.hidden
			}
		}
	}
	// Phaser's keycode enum has ZERO = 48 and NINE = 57. and the others in between as expected. btw subtracting 48 from any of them would give the ACTUAL numeric 0-9
	if (keyCode >= ZERO && keyCode <= NINE) {
		let useState = isDown ? abilityState.repeat : isUp ? abilityState.stop : null
		if (chatting) useState = abilityState.stop
		CheckHotbarInput(keyCode, useState)
	}
	if (keyCode == R) {
		if (isDown) {
			if (!chatting) client.addCommand(new KeyDownCommand(keyCode))
		}
	}
}

function CheckHotbarInput(keyCode, useState) {
	let slotNumber = keyCode == 'LMB' ? 10 : keyCode == 'RMB' ? 11 : keyCode >= 48 && keyCode <= 57 ? keyCode - 48 : console.warn(`U DUN GOOFED`)
	let slot = document.querySelector(`.hotbar-slot-${slotNumber}`)
	let abilityId = slot.getAttribute('data-item')
	if (!abilityId) return
	abilityId = Number(abilityId)
	UseAbility(abilityId, useState)
	slot.style.background = useState == abilityState.stop ? '' : 'yellow'
}

export function UseAbility(abilityId, useState) {
	client.addCommand(new AbilityCommand(abilityId, useState))
}