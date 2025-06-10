let nTypeId = 0 // yes this should start at 0 not -1, because for whatever reason nTypeId++ returns 0 not 1 like i expected, so yes our first enum value will be 0 as desired
let textureId = 0
export const textureIds = {
	none: textureId++,
	rapidPunches: textureId++,
	fireBarrel: textureId++,
	pistolPickup: textureId++,
	shotgunPickup: textureId++,
	tracer1: textureId++,
	doomPepe: textureId++,
}
export const overlayBit = {
	fire: 0,
	// the rest dont exist yet. it can go up to 15. 0-15. correlates to the overlays property the visuals entity
}
export const npcAction = {
	wander: 0,
	attackNearestPlayer: 1,
	runRandomlyOnFire: 2,
	runFromPlayers: 3,
}
export const NType = {
	NULL: nTypeId++,
	// entities
	VisualsEntity: nTypeId++,
	FireDamageAreaEntity: nTypeId++,
	// commands
	AbilityCommand: nTypeId++,
	ChatCommand: nTypeId++,
	UICommand: nTypeId++,
	WASDCommand: nTypeId++,
	PointerPositionCommand: nTypeId++,
	DropItemCommand: nTypeId++,
	KeyDownCommand: nTypeId++,
	// messages
	ChangePlayerObjectMessage: nTypeId++,
	LoseAbilityMessage: nTypeId++,
	ObtainAbilityMessage: nTypeId++,
	ChatMessage: nTypeId++,
	PlaySoundMessage: nTypeId++,
	PlayerCountMessage: nTypeId++,
	AllPlayerPositionsMessage: nTypeId++,
}
export const wasdStates = {
	released: 0,
	north: 1,
	northeast: 2,
	east: 3,
	southeast: 4,
	south: 5,
	southwest: 6,
	west: 7,
	northwest: 8,
}
export const uiActions = {
	clickedPlayButton: 0,
	clickedAvatarSelect: 1,
}
export const abilityState = {
	none: 0,
	once: 1,
	repeat: 2,
	stop: 3
}
export const directions = {
	east: 0,
	southeast: 1,
	south: 2,
	southwest: 3,
	west: 4,
	northwest: 5,
	north: 6,
	northeast: 7,
}
export const soundIds = {
	reload1: 0,
	ayoWtf: 1,
	youFuckingChud: 2,
	youStupidChud: 3,
}