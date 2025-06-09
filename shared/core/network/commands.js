import { Binary, defineSchema } from "nengi"
import { NType } from "../enums.js"
export class AbilityCommand {
	ntype = NType.AbilityCommand
	constructor(abilityId, useState) {
		this.abilityId = abilityId
		this.useState = useState // once, repeat, stop (from enum). client gets to decide useState because i have to add autofire button (e?) etc and i cant have the server interfering. hotbar slots might send 'once' whereas some other key/button might send 'repeat', and i want that flexibility on the client since its no problem
	}
}
export const AbilityCommandSchema = defineSchema({
	abilityId: Binary.UInt16,
	useState: Binary.UInt8
})
export class WASDCommand {
	ntype = NType.WASDCommand
	constructor(wasdState) {
		this.wasdState = wasdState
	}
}
export const WASDCommandSchema = defineSchema({
	wasdState: Binary.UInt8
})
// the client interacted with something to do with UI, clicked play button etc
export class UICommand {
	ntype = NType.UICommand
	constructor(uiAction, text) {
		this.uiAction = uiAction
		this.text = text
	}
}
export const UICommandSchema = defineSchema({
	uiAction: Binary.UInt8,
	text: Binary.String
})
export class ChatCommand {
	ntype = NType.ChatCommand
	constructor(chatText) {
		this.chatText = chatText
	}
}
export const ChatCommandSchema = defineSchema({
	chatText: Binary.String
})
// add x/y to this later if needed
export class PointerPositionCommand {
	ntype = NType.PointerPositionCommand
	constructor(angle,mouseX,mouseY) {
		this.angle = angle
		this.mouseX=mouseX
		this.mouseY=mouseY
	}
}
export const PointerPositionCommandSchema = defineSchema({
	angle: Binary.UInt8,
	mouseX:Binary.UInt16,
	mouseY:Binary.UInt16,
})
export class DropItemCommand {
	ntype = NType.DropItemCommand
	constructor(id) {
		this.id = id
	}
}
export const DropItemCommandSchema = defineSchema({
	id: Binary.Int32
})
export class KeyDownCommand {
	ntype = NType.KeyDownCommand
	constructor(keyCode) {
		this.keyCode = keyCode
	}
}
export const KeyDownCommandSchema = defineSchema({
	keyCode: Binary.UInt8
})