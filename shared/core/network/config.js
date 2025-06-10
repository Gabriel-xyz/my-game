//1 why does this file import everything from the actual file its in instead of from exports.js? did i just forget to make it use exports.js back when i converted to that system? probably should make it use exports.js
import { Context } from 'nengi'
import { AbilityCommandSchema, ChatCommandSchema, DropItemCommandSchema, KeyDownCommandSchema, PointerPositionCommandSchema, UICommandSchema, WASDCommandSchema } from './commands.js'
import { VisualsEntitySchema } from './entities.js'
import { ChatMessageSchema, ChangePlayerObjectMessageSchema, LoseAbilityMessageSchema, ObtainAbilityMessageSchema, PlaySoundMessageSchema, AllPlayerPositionsMessageSchema } from './messages.js'
import { NType } from '../enums.js'

export let serverFPS = 30000
export let interpDelay = 1000 / serverFPS + 15

export let context = new Context()
context.register(NType.VisualsEntity, VisualsEntitySchema)
context.register(NType.AbilityCommand, AbilityCommandSchema)
context.register(NType.ChatCommand, ChatCommandSchema)
context.register(NType.UICommand, UICommandSchema)
context.register(NType.WASDCommand, WASDCommandSchema)
context.register(NType.ChangePlayerObjectMessage, ChangePlayerObjectMessageSchema)
context.register(NType.LoseAbilityMessage, LoseAbilityMessageSchema)
context.register(NType.ObtainAbilityMessage, ObtainAbilityMessageSchema)
context.register(NType.ChatMessage, ChatMessageSchema)
context.register(NType.PointerPositionCommand, PointerPositionCommandSchema)
context.register(NType.DropItemCommand, DropItemCommandSchema)
context.register(NType.PlaySoundMessage, PlaySoundMessageSchema)
context.register(NType.KeyDownCommand, KeyDownCommandSchema)
context.register(NType.AllPlayerPositionsMessage,AllPlayerPositionsMessageSchema)