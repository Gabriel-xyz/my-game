import { Binary, defineSchema } from "nengi"
import { NType } from "../enums.js"
export class AllPlayerPositionsMessage {
    ntype = NType.AllPlayerPositionsMessage
    constructor(array) {
        this.array = array
    }
}
export const AllPlayerPositionsMessageSchema = defineSchema({
    array: Binary.UInt16Array
})
// the client will be informed by the server that the server changed their playerobject to another object, so the client can change camera target etc
export class ChangePlayerObjectMessage {
    ntype = NType.ChangePlayerObjectMessage
    constructor(nid, x, y) {
        this.playerNid = nid
        this.x = x
        this.y = y
    }
}
export const ChangePlayerObjectMessageSchema = defineSchema({
    playerNid: Binary.UInt32,
    x: Binary.Float32,
    y: Binary.Float32,
})
export class ChatMessage {
    ntype = NType.ChatMessage
    constructor(x, y, chatText, senderNid, timeout = 8000) {
        this.x = x
        this.y = y
        this.chatText = chatText
        this.senderNid = senderNid
        this.timeout = timeout
    }
}
export const ChatMessageSchema = defineSchema({
    x: Binary.Float32,
    y: Binary.Float32,
    chatText: Binary.String,
    senderNid: Binary.UInt32,
    timeout: Binary.UInt16,
})
export class ObtainAbilityMessage {
    ntype = NType.ObtainAbilityMessage
    constructor(abilityId, clientImagePath, abilityName, abilityDesc, cooldownMs, canDrop) {
        this.abilityId = abilityId
        this.clientImagePath = clientImagePath
        this.abilityName = abilityName
        this.abilityDesc = abilityDesc
        this.cooldownMs = cooldownMs
        this.canDrop = canDrop
    }
}
export const ObtainAbilityMessageSchema = defineSchema({
    abilityId: Binary.UInt32,
    clientImagePath: Binary.String,
    abilityName: Binary.String,
    abilityDesc: Binary.String,
    cooldownMs: Binary.Int16,
    canDrop: Binary.Boolean,
})
export class LoseAbilityMessage {
    ntype = NType.LoseAbilityMessage
    constructor(abilityId) {
        this.abilityId = abilityId
    }
}
export const LoseAbilityMessageSchema = defineSchema({
    abilityId: Binary.UInt32
})
export class PlaySoundMessage {
    ntype = NType.PlaySoundMessage
    constructor(soundId, x, y) {
        this.soundId = soundId
        this.x = x
        this.y = y
    }
}
export const PlaySoundMessageSchema = defineSchema({
    soundId: Binary.UInt8
})