import { loop } from "./loop.js"
import { Manager } from "./manager.js"

export let manager = new Manager()
loop(manager)