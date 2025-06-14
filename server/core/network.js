import { Channel, ChannelAABB2D, AABB2D, Instance, NetworkEvent } from 'nengi'
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter'
import { NType, context, decompressAngle } from '../index.js'
// mocks hitting an external service to authenticate a user
const authenticateUser = async handshake => {
	return new Promise((resolve, reject) => {
		setTimeout(() => { // as if the api took time to respond
			if (handshake.token === 12345) {
				// fake example data, to remind me this is a thing
				resolve({ character: 'neuron', level: 24, hp: 89 })
			} else {
				reject('Connection denied: invalid token.')
			}
		}, 0)
	})
}
export class NetworkManager {
	constructor(port = 8080) {
		this.port = port
		this.instance = new Instance(context)
		this.uws = new uWebSocketsInstanceAdapter(this.instance.network, {/*uws config*/ })
		this.instance.onConnect = authenticateUser
	}
	listen() {
		this.uws.listen(this.port, () => { console.log(`uws adapter listening on ${this.port}`) })
		this.mainChannel = new Channel(this.instance.localState)
		this.spatialChannel = new ChannelAABB2D(this.instance.localState)
	}
	addEntity(channel, entity) {
		if (channel.entities.array.includes(entity)) {
			console.warn('tried to add entity twice')
			return
		}
		channel.addEntity(entity)
	}
	removeEntity(channel, entity) {
		if (!channel.entities.array.includes(entity)) {
			console.warn('tried to remove non-existing entity')
			return
		}
		channel.removeEntity(entity)
	}
	// possible exploit: this update loop is set to process an unlimited amount of commands/etc from a client per tick. probably should limit it to a reasonable amount or they might freeze the server. if they exceed this amount ignore them and disconnect the user and prevent them from reconnecting for 10+ minutes from the same ip
	update(dt, tick, time) {
		let users = this.instance.users.values()
		for (let user of users) {
			if (user.view) {
				if (user.playerObject) {
					user.view.x = user.playerObject.x
					user.view.y = user.playerObject.y
				}
				let opts = this.instance.scene.physics.world.treeMinMax, dist = 1600
				opts.minX = user.view.x - dist; opts.minY = user.view.y - dist
				opts.maxX = user.view.x + dist; opts.maxY = user.view.y + dist
				let viewBodies = []
				viewBodies.push(...(this.instance.scene.physics.world.tree.search(opts)), ...(this.instance.scene.physics.world.staticTree.search(opts)))
				for (let body of viewBodies) {
					body.gameObject.playerNearbyTime = this.instance.scene.time.now
				}
			}
		}
		while (!this.instance.queue.isEmpty()) {
			let networkEvent = this.instance.queue.next()
			if (networkEvent.type === NetworkEvent.UserDisconnected) {
				let user = networkEvent.user
				console.log(`user has disconnected`)
				let entity = user.entity
				if (user.playerObject) {
					// destroy playerObject
				}
				if (user.entity) {
					this.removeEntity(this.mainChannel, entity)
					this.removeEntity(this.spatialChannel, entity)
				}
				else {
					console.log('user has no entity')
				}
				continue
			}
			if (networkEvent.type === NetworkEvent.UserConnected) {
				let user = networkEvent.user
				console.log(`user has connected`)
				this.mainChannel.subscribe(user)
				continue
			}
			if (networkEvent.type === NetworkEvent.UserConnectionDenied) {
				continue
			}
			if (networkEvent.type === NetworkEvent.Command) {
				continue
			}
			if (networkEvent.type === NetworkEvent.CommandSet) {
				let { user, commands, clickTick } = networkEvent
				let { entity, view } = user
				for (let command of commands) {
					if (command.ntype === NType.WASDCommand) {
						user.wasdState = command.wasdState
						continue
					}
					if (command.ntype === NType.PointerPositionCommand) {
						user.angleToMouse = decompressAngle(command.angle)
						user.mouseX = command.mouseX
						user.mouseY = command.mouseY
						continue
					}
					if (command.ntype === NType.KeyDownCommand) {
						if (command.keyCode == Phaser.Input.Keyboard.KeyCodes.R) {

						}
						continue
					}
				}
				continue
			}
		}
	}
}