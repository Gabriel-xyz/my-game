import { scene1, AddAbilityToInventory, RemoveAbilityFromInventory, AddFloatingNameTo, ShowOverheadMessage, context, interpDelay, serverFPS, NType, getSprite, RemoveAbilityFromHotbar, getSound, sanitize, textureIdToString, StartRadar } from '../exports'
import { Client, Interpolator } from 'nengi'
import { WebSocketClientAdapter } from 'nengi-websocket-client-adapter'

export let entities = new Map() // i was going to use nengi's internal Map of entities (client.network.entities) but when delete entities event occurs, the entity has already seemingly been removed from nengi's internal map so i get a null reference. also in nengi 2.0's official examples they dont use the internal map, they make one like i do here
export let client
export let interpolator
export let serverTimestamp = 0

async function StartClient() {
	client = new Client(context, WebSocketClientAdapter, serverFPS)
	console.log(`client before connecting:`, client)
	interpolator = new Interpolator(client)
	client.setDisconnectHandler((reason, event) => {
		console.log(`disconnected from server`, reason, event)
		client.connected = false
		if (document.querySelector('.title-ui').hidden == false) tryConnect()
		else location.reload()
	})
	client.HandlePlayerObjectChanged = async (nid, x, y) => {
		console.log(`HandlePlayerObjectChanged(${nid})`)
		client.playerNID = nid // tell the client which nid to be on the lookout for in the createEntity event so when it comes through it will know this is supposed to be its player object
		let entity = entities.get(nid)
		// if the entity exists already then it was created in the createEntity event before we were told it is supposed to be our player object, so run this code that would have ran on the entity during the createEntity event had we known this was supposed to be our player object
		if (entity) client.HandlePlayerEntityCreatedEvent(nid)
	}
	client.HandlePlayerEntityCreatedEvent = nid => {
		let entity = entities.get(nid)
		let object = entity.object
		let cam = object.scene.cameras.main
		client.playerObject = object
		client.playerNID = nid
		cam.startFollow(object, false, 0.5, 0.5)
		AddFloatingNameTo(object, 'player')
	}
	tryConnect()
}

async function tryConnect() {
	try {
		let response
		if (window.location.hostname == 'localhost') response = await client.connect('ws://localhost:8080', { token: 12345 }) // local testing
		else response = await client.connect(`wss://chuds.online/ws`, { token: 12345 }) // production. nginx handles what port its reverse proxied to etc
		client.connected = true
		console.log(`connection response`, response)

	}
	catch (error) {
		console.log(`connection error, retrying...`, error)
		// await sleep(1000)
		tryConnect()
	}
}
// const registry = new FinalizationRegistry((heldValue) => {
// 	if (heldValue == 'Entity') console.log('collected', heldValue)
// })
let healthTag = 'health', healthBarTag = '.health-bar', xpTag = 'xp', xpBarTag = '.xp-bar', levelTag = 'level', levelDisplayTag = '.level-display'
function update(dt, tick, now) {
	serverTimestamp = client.network.latestFrame ? client.network.latestFrame.timestamp : 0
	let istate = interpolator.getInterpolatedState(interpDelay)
	// if (tick % 60 == 0) console.log('latency', client.network.latency)
	istate.forEach(snapshot => {
		snapshot.createEntities.forEach(entity => {
			let object = getSprite(scene1, entity.x, entity.y, textureIdToString.get(entity.textureId), undefined, entity)
			entity.object = object
			entities.set(entity.nid, entity)
			// this happens not only the first time the player is first created, but also when the player sprite on the server teleports further than the current view, the sprite is destroyed and recreated on the client by nengi for whatever reason. this line will only continue to work so long as the user's view on the server follows the server sprite's x/y, not the client camera x/y, because obviously the sprite will not be recreated on the client after a teleport since the view on the server did not follow the sprite's new x/y, and remains at whatever the camera's x/y on the client is. so it will still be destroyed on the client but it wont be recreated unless we tell the camera on the client to move to where the server sprite was teleported to
			if (entity.nid == client.playerNID) client.HandlePlayerEntityCreatedEvent(entity.nid)
			// registry.register(entity, 'Entity');
		})
		snapshot.updateEntities.forEach(update => {
			//2 okay this is important to know (i tested it btw): when a property has interpolation on, it will get multiple 'updates' here instead of just one (the one expected from the network message) as interpolated messages generated (presumably) clientside based on the framerate, and (presumably) not because it is sending them as actual multiple network messages from the server. for example, if the server increases the 'x' property from 0 to 1, ive witnessed from debug logs that even though on the server it was changed instantly from 0 to 1, the client will get 3-4 'update' messages here going from like 0 to 0.24 to 0.51 to 0.82 to 1. so yes we do get the message 'instantly' that 'x' 'should' become 1 but that's not what we receive as the 'update' here, we receive interpolated frames towards that final value over the next 100ms or whatever we end up setting nengi's interpolation time to
			//1 another thing to know is that (from what ive observed briefly on debug logs) each property update comes through as an individual message for each property, so 'x' gets its own event here, and 'y', and so on, each get their own event, even though its only from 1 network message, regardless by the time it reaches here its been made into one event for each changed property, or multiple events for each changed property when interpolation for that property is on. in other words, each 'update' event here is for one property (example: 'x') that changed
			let { nid, prop, value } = update
			let entity = entities.get(nid)
			entity[prop] = value
			if (entity.object && entity.object == client.playerObject) {
				if (prop == healthTag) {
					document.querySelector(healthBarTag).style.width = `${40 * (value / 100)}vw`
				}
				else if (prop == xpTag) {
					document.querySelector(xpBarTag).style.width = `${40 * (value / 100)}vw`
				}
				else if (prop == levelTag) {
					document.querySelector(levelDisplayTag).textContent = `Level ${value}`
				}
			}
		})
		snapshot.deleteEntities.forEach(nid => {
			let entity = entities.get(nid)
			if (entity) {
				entity.object.destroy()
				entity.object = null
			}
			entities.delete(nid)
		})
	})
	while (client.network.messages.length > 0) {
		let message = client.network.messages.shift()
		if (message.ntype === NType.AllPlayerPositionsMessage) {
			scene1.allPlayerPositions = message.array
			StartRadar()
		}
		if (message.ntype === NType.PlayerCountMessage) {
			document.querySelector('.players-online').textContent = `Players Online: ${message.playerCount}`
		}
		if (message.ntype === NType.ChangePlayerObjectMessage) {
			if (!message.playerNid) console.error(`ChangePlayerObjectMessage sent invalid playerNid: ${message.playerNid}`)
			else {
				client.HandlePlayerObjectChanged(message.playerNid, message.x, message.y)
			}
		}
		if (message.ntype === NType.ObtainAbilityMessage) {
			AddAbilityToInventory(message.abilityId, message.clientImagePath, message.abilityName, message.abilityDesc, message.cooldownMs, message.canDrop)
		}
		if (message.ntype === NType.LoseAbilityMessage) {
			RemoveAbilityFromInventory(message.abilityId)
			RemoveAbilityFromHotbar(message.abilityId)
		}
		if (message.ntype === NType.ChatMessage) {
			message.chatText = sanitize(message.chatText)
			let sendersEntity = entities.get(message.senderNid)
			let sendersCharacter = sendersEntity.object
			if (!sendersCharacter) console.warn('a chat message was just recieved for an entity that has no object')
			else ShowOverheadMessage(sendersCharacter, message.chatText, message.timeout)
		}
		if (message.ntype === NType.PlaySoundMessage) {
			getSound(scene1, message.soundId).play()
		}
	}
	client.flush()
}

// i was worried the nengi loop wasnt always guaranteed to happen deterministically before phaser's loop, but a simple test with console logs seems to indicate it is. so as of writing this, this is all working fine, probably because we import this script before we import the script that starts phaser. their update functions are executing sequentially within 0-1 ms of each other so its all good
window.addEventListener('load', async function () {
	await StartClient()
	let tick = 0
	let previous = performance.now()
	let loop = function () {
		window.requestAnimationFrame(loop)
		let now = performance.now()
		let delta = (now - previous) / 1000
		previous = now
		tick++
		update(delta, tick, now)
	}
	loop()
})