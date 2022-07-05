import { Roku } from "../dist/index.js"
import { argv } from "process"

//Useful syncronous wait
const wait = time => new Promise(resolve => setTimeout(resolve, time))

const host = argv[2] || "10.0.0.8"

console.log("Testing host: " + host)

const myRoku = new Roku(host)

console.info("Test power toggle")
console.log(await myRoku.powerToggle() === true)

console.info("List GET resources")
console.log(typeof await myRoku.apps() == "object")
console.log(typeof await myRoku.info() == "object")
console.log(typeof await myRoku.player() == "object")

console.info("Launch apps and inputs test")
console.log(await myRoku.launch("837") === true)
await wait(5000)
console.log(await myRoku.switchToInput("HDMI1") == true)

console.info("Test keys")
console.log(await myRoku.options() == true)
console.log(await myRoku.holdKey("Home", 1000) == true)
console.log(await myRoku.keypressLetter("a") == true)

console.info("Power off device at end")
console.log(await myRoku.powerOff() == true)