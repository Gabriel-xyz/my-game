import { loop } from "./loop"
import { Manager } from "./manager"

export let manager = new Manager()
loop(manager)