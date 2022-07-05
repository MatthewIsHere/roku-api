import { Roku } from "./index.js"
import dgram from "dgram"

// Requires port 1900 UDP allowed inbound on host

const SSDP = `M-SEARCH * HTTP/1.1
Host: 239.255.255.250:1900
Man: "ssdp:discover"
ST: roku:ecp
`

function discover(callback: (roku: Roku) => void) {
    let socket = dgram.createSocket("udp4")
    socket.bind(1900)
    socket.on("message", (message, rinfo) => {
        if (message.toString().slice(0, 15) === "HTTP/1.1 200 OK") {
            callback(new Roku(rinfo.address))
        }
    })
    socket.send(SSDP, 1900, "239.255.255.250")
    setTimeout(() => socket.close(), 5000)
}

export default discover