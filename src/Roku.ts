import xml2js from "xml2js"

interface AppInfo {
    name: string,
    version: string
}

function XML(text: string): Promise<any> {
    const parser = new xml2js.Parser()
    return parser.parseStringPromise(text)
}

class Roku {
    public readonly ip: string

    constructor(ip: string) {
        this.ip = ip
    }

    private makeRequestURL(query: string[]): string {
        return `http://${this.ip}:8060/${query.join("/")}`
    }
    private async request(query: string[], post?: boolean): Promise<Response> {
        let method = "GET"
        if (post === true) {
            method = "POST"
        }
        const url = this.makeRequestURL(query)
        const response = await fetch(url, {
            method
        })
        if (!response.ok) {
            throw new Error(`${response.status}: Roku ECP path not defined: ${method} ${url}`)
        }
        return response
    }

    public async keypress(key: string): Promise<boolean> {
        const response = await this.request(["keypress", key], true)
        return response.ok
    }
    // May need utf-8 urlencoding in the future. only works for ascii
    public keypressLetter(letter: string): Promise<boolean> {
        if (letter.length > 1) {
            throw new Error("Only one letter can be provided")
        }
        return this.keypress(`lit_${letter}`)
    }
    public async keydown(key: string): Promise<boolean> {
        const response = await this.request(["keydown", key], true)
        return response.ok
    }
    public async keyup(key: string): Promise<boolean> {
        const response = await this.request(["keyup", key], true)
        return response.ok
    }
    public async holdKey(key: string, time: number): Promise<boolean> {
        const finished = new Promise<boolean>(async resolve => {
            await this.keydown(key)
            setTimeout(() => {
                this.keyup(key)
                resolve(true)
            })
        })
        return finished
    }

    public async info() {
        const response = await this.request(["query", "device-info"])
        const text = await response.text()
        const data = await XML(text)
        let info: { [key: string]: string } = {}
        //this is some typescript + xml garbage, but it basically shucks the complicated parsed xml tree into a clean object
        Object.entries(data["device-info"]).forEach(kv => {
            const value: string[] = kv[1] as string[]
            info[kv[0]] = value[0]
        })
        return info
    }
    public async player() {
        const response = await this.request(["query", "media-player"])
        const text = await response.text()
        const data = await XML(text)
        let player: { [key: string]: string | object | boolean } = {}
        // shucking data from parsed xml into clean object
        player.state = data.player["$"].state
        player.bandwidth = data.player.plugin[0]["$"].bandwidth
        if (data.player.hasOwnProperty("plugin")) {
            player.id = data.player.plugin[0]["$"].id
            player.name = data.player.plugin[0]["$"].name
        }
        // These properties were found when playing YouTube specifically. I am unsure if these are standard
        if (data.player.hasOwnProperty("format")) {
            player.format = {
                audio: data.player.format[0]["$"].audio,
                video: data.player.format[0]["$"].video,
                captions: data.player.format[0]["$"].captions,
                live: "false"
            }
        }
        if (data.player.hasOwnProperty("position")) {
            player.position = data.player.position[0]
        }
        // Pretty sure this is YouTube exclusive
        if (data.player.hasOwnProperty("is_live")) {
            player.live = Boolean(data.player.is_live[0])
        }
        return player
    }
    public async icon(appid: string) {
        const response = await this.request(["query", "icon", appid])
        const image = await response.blob()
        return image
    }
    
    public async apps(): Promise<Map<string, AppInfo>> {
        
        const response = await this.request(["query", "apps"])
        const text = await response.text()
        const data = await XML(text)
        let apps = new Map<string, AppInfo>()
        data.apps.app.forEach((app: any) => {
            apps.set(app["$"].id, {
                name: app._ as string,
                version: app["$"].version
            })
        })
        return apps
    }
    public async launch(appid: string, contentID?: string, mediaType?: string): Promise<boolean> {
        let launchCommand = appid
        if (contentID != undefined) {
            const encodedcontentID = encodeURIComponent(contentID)
            launchCommand = launchCommand + "?contentID="+ encodedcontentID
        }
        if (mediaType != undefined) {
            const mediaTypes = ["season", "episode", "movie", "short-form", "special", "live"]
            if (!mediaTypes.includes(mediaType)) {
                throw new Error("Invalid Roku deep link MediaType provided")
            }
            if (contentID != undefined) {
                launchCommand = launchCommand + "&MediaType=" + mediaType
            } else {
                //This theoretically should never occur. Just in case :)
                launchCommand = launchCommand + "?MediaType=" + mediaType
            }
        }
        const response = await this.request(["launch", launchCommand], true)
        return response.ok
    }
    //Keypress alias functions

    public home()          { return this.keypress("Home") }
    public reverse()       { return this.keypress("Rev") }
    public forward()       { return this.keypress("Fwd") }
    public play()          { return this.keypress("Play") }
    public select()        { return this.keypress("Select") }
    public up()            { return this.keypress("Up") }
    public down()          { return this.keypress("Down") }
    public left()          { return this.keypress("Left") }
    public right()         { return this.keypress("Right") }
    public instantReplay() { return this.keypress("InstantReplay") }
    public options()       { return this.keypress("Info") }
    public search()        { return this.keypress("Search") }
    //not on remote keys. used during typing
    public backspace()     { return this.keypress("Backspace") }
    public enter()         { return this.keypress("Enter") }

    // Roku TV control
    public volumeDown()    { return this.keypress("VolumeDown") }
    public volumeUp()      { return this.keypress("VolumeUp") }
    public volumeMute()    { return this.keypress("VolumeMute") }
    public powerOff()      { return this.keypress("PowerOff") }
    public powerOn()       { return this.keypress("PowerOn") }
    //custom way to toggle power state
    public async powerToggle(): Promise<boolean> {
        const info = await this.info()
        if (!info.hasOwnProperty("power-mode")) {
            throw new Error("Roku Device does not support changing power state")
        }
        const isPoweredOn = info["power-mode"] === "PowerOn"
        if (isPoweredOn) {
            return this.powerOff()
        }
        return this.powerOn()
    }
    // change TV input
    // Supported Inputs: Tuner, HDMI1, HDMI2, HDMI3, HDMI4, AV1
    public switchToInput(input: string): Promise<boolean> {
        const supportedInputs = ["Tuner", "HDMI1", "HDMI2", "HDMI3", "HDMI4", "AV1"]
        if (!supportedInputs.includes(input)) {
            throw new Error("Not a supported TV input")
        }
        return this.keypress("Input" + input)
    }


    //Not implemented: TV channel support. Will implement if needed. 
    //I have no way to test it, so please contact me if you want it.

}


export default Roku
