import { discover } from "../dist/index.js"

discover(roku => {
    console.log(typeof roku == "object")
})

// I suck at tests lol