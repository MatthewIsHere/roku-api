## Roku-js

`roku-js` is a complete Typescript implementation of the Roku "External Control Protocol" API. Built using ECMAScript modules, this package is compatible in the browser out-of-the-box!

### **Features**
* Full control of Roku devices, as if using the remote
* Volume and TV power control
* Simple discovery of Roku devices on network (Not possible on frontend)
* Switch TV inputs instantly
* Content deep linking using launch method [see Deep Linking](#deep-linking)
* Access to Roku app icons for interface building

### **Installation**
to install:
```
npm install roku-js
```

to import (ESM-only):
```
import { Roku, discover } from "roku-js"
```
# Usage

### Roku Class:
**Instantiation**
```
import { Roku } from "roku-js"

const ip = "0.0.0.0"
const roku = new Roku(ip)
```
**Methods**
* roku.keypress(key: string) keypresses  *key*
* roku.keydown(key: string) begins holding down *key*
* roku.keyup(key: string) releases *key*
* roku.keypressLetter(letter: string) keypresses ASCII *letter*. Useful for keyboard input fields
* roku.holdKey(key: string, time: number) holds *key* for *time* milliseconds
* roku.info() returns object containing the devices properties, state, and configuration
* roku.player() return object with current media state and playback service
* roku.icon(appid: string) returns promise of BLOB containing app icon photo
* roku.apps() returns Map with appids as key and object containing name and version as value
* roku.launch(appid: string, contentID?: string, mediaType?: string) launches app by id with optional contentID and mediaType for deep linking

**Self explanatory keypress aliases**
* roku.home()
* roku.reverse()
* roku.forward()
* roku.play()
* roku.up()
* roku.down()
* roku.left()
* roku.right()
* roku.instantReplay()
* roku.options()
* roku.search()
* roku.backspace()
* roku.enter()

**Roku-enabled TV controls**
* roku.volumeUp()
* roku.volumeDown()
* roku.volumeMute()
* roku.powerOn()
* roku.powerOff()
* roku.powerToggle()
* roku.switchToInput(input: string)  Supported Inputs: ["Tuner", "HDMI1", "HDMI2", "HDMI3", "HDMI4", "AV1"]

### Discovery function
Usage:
```
import { discover } from "roku-js"

async function foundRoku(roku) {
    console.log(await roku.info())
}
discover(foundRoku)
```
function discover(callback: (device: Roku) => void) uses Roku SSDP api to discover local network roku devices. runs callback with a Roku instance argument when found. function self-destructs after five seconds of discovery.

# Deep Linking
Deep linking is a key feature of the ECP AP because it allows you to open specific resources on applications. This can be used for playing certain movies or videos on streaming services. Deep linking is implemented using the launch method and providing a contentID parameter; the contentID value is dependent on the app's own logic
Example:
```
import { Roku } from "roku-js"

const ip = "0.0.0.0" // Example IP
const roku = new Roku(ip)

// Launch YouTube Video (YouTube Appid: 837)
const contentID = "dQw4w9WgXcQ" // Extracted from YouTube share link
roku.launch("837", contentID)
```

# Contributing
Any suggestions, issues, pull requests, or help is appreciated. This was intended to be an open and shut API implementation, but I will modify it if necessary or wanted.