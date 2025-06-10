import { Channel, ChannelAABB2D, AABB2D, Instance, NetworkEvent } from 'nengi'
import { uWebSocketsInstanceAdapter } from 'nengi-uws-instance-adapter'
import { NType, uiActions, context, ChangePlayerObjectMessage, ChatMessage, CreatePlayerObject, game, CreateTestNPCs, CreateTestPickups, CreateTrees, ProcessAbilityCommand, WizardBlastAbility, decompressAngle, PistolAbility, PunchAbility, ProcessDropItemCommand, ServerScene, ShotgunAbility, GrenadeAbility, PlayerCountMessage, AssaultRifleAbility } from '../exports'

// mocks hitting an external service to authenticate a user
const authenticateUser = async handshake => {
    return new Promise((resolve, reject) => {
        setTimeout(() => { // as if the api took time to respond (nevermind i lowered the delay to 0)
            if (handshake.token === 12345) {
                // fake example data, to remind me this is a thing
                resolve({ character: 'neuron', level: 24, hp: 89 })
            } else {
                reject('Connection denied: invalid token.')
            }
        }, 0)
    })
}

let port = 8080
export let instance = new Instance(context)
let uws = new uWebSocketsInstanceAdapter(instance.network, {/*uws config*/ })
uws.listen(port, () => { console.log(chalk.cyan(`uws adapter listening on ${port}`)) })
instance.onConnect = authenticateUser
export let mainChannel = new Channel(instance.localState)
export let spatialChannel = new ChannelAABB2D(instance.localState)
// lol
instance.registerChannel(mainChannel)
instance.registerChannel(spatialChannel)
let queue = instance.queue

mainChannel.tryAddEntity = tryAddEntity
spatialChannel.tryAddEntity = tryAddEntity
function tryAddEntity(entity) {
    if (this.entities.array.includes(entity)) {
        console.warn('tried to add entity twice')
        return
    }
    this.addEntity(entity) // nengi's addEntity function will add it twice, i looked at the source
}
mainChannel.tryRemoveEntity = tryRemoveEntity
spatialChannel.tryRemoveEntity = tryRemoveEntity
function tryRemoveEntity(entity) {
    if (!this.entities.array.includes(entity)) {
        return
    }
    this.removeEntity(entity)
}
let viewBodies = []
// exploit warning: the update loop is currently set to process an unlimited amount of commands/etc from a client so the client may be able to send 99999999 commands and freeze the update loop, so eventually the update loop should only process a maximum amount of commands from a user per frame and once exceeded ignore the rest and disconnect that user, prevent them from reconnecting for 10 minutes from the same ip
export function nengiUpdate(dt, tick, now) {
    let scene = game.scene.getScene(ServerScene.name)
    if (tick % 60 == 0) {
        mainChannel.addMessage(new PlayerCountMessage(Math.floor(scene.players.length * 1.5)))
    }
    for (let user of instance.users.values()) {
        if (user.view) {
            if (user.playerObject) {
                user.view.x = user.playerObject.x
                user.view.y = user.playerObject.y
            }
            let opts = scene.physics.world.treeMinMax, dist = 1600
            opts.minX = user.view.x - dist; opts.minY = user.view.y - dist
            opts.maxX = user.view.x + dist; opts.maxY = user.view.y + dist
            viewBodies.length = 0
            viewBodies.push(...(scene.physics.world.tree.search(opts)), ...(scene.physics.world.staticTree.search(opts)))
            for (let body of viewBodies) {
                body.gameObject.playerNearbyTime = scene.time.now
            }
        }
    }
    while (!queue.isEmpty()) {
        let networkEvent = queue.next()
        // disconnections
        if (networkEvent.type === NetworkEvent.UserDisconnected) {
            let user = networkEvent.user
            // console.log(`user has disconnected`)
            let entity = user.entity
            if (user.playerObject) {
                // console.log(`user has playerObject`)
                let allowRespawn = false
                user.playerObject.destroy(undefined, allowRespawn) // calls removeEntity on the entity too
            }
            else {
                // console.log(`user has no playerObject`)
                if (entity) {
                    spatialChannel.tryRemoveEntity(user.entity)
                }
                else {
                    // if they dont have an entity, i guess they just sat on the title screen then logged out without creating a character?
                    // console.log(`user has no entity`)
                }
            }
        }
        // connections
        if (networkEvent.type === NetworkEvent.UserConnected) {
            let user = networkEvent.user
            mainChannel.subscribe(user)
            user.UseAsPlayerObject = (object) => {
                if (!object.entity) console.error(`playerObject must have entity before calling this function`)
                // todo: eventually we need to account for whether the object we are giving control over already has another user already in control of it. at the very least we will have to kick the previous user's control off the object, and maybe tell that user to take control of some other object, i dont know yet
                if (object.user) console.warn(`the playerObject being assigned already has a user. this is an unhandled scenario with unknown consequences`)
                user.playerObject = object
                object.user = user
                user.queueMessage(new ChangePlayerObjectMessage(object.entity.nid, object.x, object.y))
            }
        }
        // commands
        if (networkEvent.type === NetworkEvent.CommandSet) {
            let { user, commands, clientTick } = networkEvent
            let { entity, view } = user
            commands.forEach(command => {
                if (command.ntype === NType.WASDCommand) {
                    user.wasdState = command.wasdState
                }
                if (command.ntype === NType.PointerPositionCommand) {
                    user.angleToMouse = decompressAngle(command.angle)
                    user.mouseX = command.mouseX
                    user.mouseY = command.mouseY
                }
                if (command.ntype === NType.UICommand) {
                    if (command.uiAction == uiActions.clickedAvatarSelect) {
                        if (!user.playerObject) {
                            if (!command.text || command.text.length > 40) {
                                console.warn('user sent a command with an abnormal text field')
                            }
                            else {
                                CreateNewPlayerObjectFor(user, command.text)
                                user.view = new AABB2D(0, 0, 1920 / 2 + 128, 1080 / 2 + 128)
                                spatialChannel.subscribe(user, user.view)
                            }
                        }
                        else console.warn(`user clicked play button while already having a playerObject, this should not be possible`)
                    }
                }
                if (command.ntype === NType.AbilityCommand) {
                    ProcessAbilityCommand(command, user)
                }
                if (command.ntype === NType.ChatCommand) {
                    if (user.playerObject) {
                        if (user.lastChatMessageTime && Date.now() - user.lastChatMessageTime < 50) {
                            console.log(chalk.redBright(`a user was disconnected because they triggered the chat spam check`))
                            user.disconnect('chat spam check triggered')
                        }
                        else if (!user.lastChatMessageTime || Date.now() - user.lastChatMessageTime >= 500) {
                            // command.chatText = command.chatText.replace(/[^a-z0-9]/gi, '') // doesnt allow people to use periods or other symbols i want to allow
                            if (command.chatText.length > 200) command.chatText = command.chatText.slice(0, 200)
                            user.lastChatMessageTime = Date.now()
                            spatialChannel.addMessage(new ChatMessage(user.playerObject.x, user.playerObject.y, command.chatText, user.playerObject.entity.nid))
                            user.playerObject.scene.HandleSpecialChat(user.playerObject, command.chatText)
                        }
                    }
                }
                if (command.ntype === NType.DropItemCommand) {
                    ProcessDropItemCommand(command, user)
                }
                if (command.ntype === NType.KeyDownCommand) {
                    if (command.keyCode == Phaser.Input.Keyboard.KeyCodes.R) {
                        if (user.playerObject && user.playerObject.lastAbilityUsed && user.playerObject.lastAbilityUsed.Reload) {
                            user.playerObject.lastAbilityUsed.Reload()
                        }
                    }
                }
            })
        }
    }
}

function CreateNewPlayerObjectFor(user, key) {
    let scene = game.scene.getScenes(true, false)[0]
    let playerObject = CreatePlayerObject(scene, 10 * 64, 10 * 64, key)
    user.UseAsPlayerObject(playerObject)
}