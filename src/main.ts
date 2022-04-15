import { TextModel } from "toad.js/model/TextModel"
import { NumberModel } from "toad.js/model/NumberModel"
import { bindModel } from "toad.js/controller/globalController"
import { Display } from "./Display"

Display.define("tx-display", Display)

type MIDIAccess = WebMidi.MIDIAccess
type MIDIMessageEvent = WebMidi.MIDIMessageEvent
type MIDIInput = WebMidi.MIDIInput

const kits = [
    { name: "AbsoHybMaple", desc: "The sound of the Yamaha Absolute Hybrid Maple series. The perfect modern drum sound." },
    { name: "Steel Ring", desc: "A more rock sounding drum kit. The steel snare has lots of mid range ring to help it cut through music." },
    { name: "Spiralizer", desc: "This kit features an effect which continuously moves the pitch up without ever reaching the top." },
    { name: "Bop Groove", desc: "A more jazz sounding kit with open drum sounds and thinner cymbals. Perfect for more acoustic styles." },
    { name: "SwedishMetal", desc: "A punchy, mid-scooped drum sound with lots of attack. This is a perfect processed drum sound for metal music." },
    { name: "VintNashvlle", desc: "Typical of the drum sound found on country music in the 1960's and 1970's." },
    { name: "Off The Hook", desc: "A highly processed, very electronic drum kit that punches through the mix." },
    { name: "Black Vinyl", desc: "A typical 1990's metal drum sound with reverb – very dark!" },
    { name: "D-Funk", desc: "This kit features a very highly tuned snare for contemporary funk and similar styles." },
    { name: "OldStudioKit", desc: "This mimics a kit that has been recorded in an old studio through very old microphones and an overloaded mixing desk - it is slightly distorted." },
    { name: "Jet Reverb", desc: "This kit features a long reverb and a phaser effect to make the drum sound feel like it is swirling around you. Great on headphones." },
    { name: "Short Stack", desc: "A drum kit made of short, layered, acoustic and electronic drum sounds." },
    { name: "ModrnCountry", desc: "A contemporary acoustic pop drum kit with lots of attack." },
    { name: "ExcitedSnare", desc: "This kit has bright, high snare sound. The Presence effect on the [EFFECT] knob adds even more brightness and cut to the whole kit." },
    { name: "Olden Days", desc: "This kit recreates a open, tuned-down old drum kit in larger sizes." },
    { name: "Little Kit", desc: "This kit is designed to sound like a drum set in small sizes – 16” bass drum, 10, 12, 13” toms and 12” snare." },
    { name: "26\" BassDrum", desc: "The classic 1970's big open rock drum sound with 26” bass drum and oversized toms." },
    { name: "Mix Vibe", desc: "This kit features a heavily dampened snare sound for ultra tight groove playing." },
    { name: "Hollywood", desc: "This kit recreates a classic 1960's American drum sound – the sounds of 1960's FM radio." },
    { name: "Engraved", desc: "This kit features a Yamaha brass 13x6.5” snare drum and the sound of closely recorded toms and kick. A very tight drum sound." },
    { name: "Filter Smack", desc: "The sound of this kit changes dramatically with your playing dynamics. It has a dynamic filter effect meaning the filter opens and lets more high frequencies through as you hit harder." },
    { name: "Classic Gate", desc: "This kit features a gated reverb effect that first became popular in 1980's. It's a big drum sound with no ring, and very dry." },
    { name: "Radio Dark", desc: "This kit simulates the lo-fi sound of an old radio." },
    { name: "Distorted", desc: "This kit features a distortion effect on the whole drum kit sound. You can adjust the distortion amount with [EFFECT] knob on the module." },
    { name: "EarlyReflctn", desc: "This kit has early-reflection reverb on it which is less harsh than gated reverb and still lets some of the natural ring of the drums come through." },
    { name: ">Classic 8<", desc: "This kit features classic analog drum machine sounds." },
    { name: ">The RX5<", desc: "This kit has sounds from the legendary Yamaha RX5 digital drum machine." },
    { name: "Selector", desc: "This kit has a more 'chopped up loop' sound and is ideal for drum'n'bass music." },
    { name: "45rpm", desc: "This kit is for dub-step and other more dance based styles." },
    { name: "Club Floor", desc: "This kit is more useful for hard dance music." },
    { name: "Mellow Volts", desc: "This kit features more mellow electronic drum sounds for a more chilled vibe." },
    { name: "Heavy Kick", desc: "This kit features a heavier kick sound for filling dance floors." },
    { name: "Crunch Delay", desc: "This kit features a more lo-fi sound and light delay effect on the snare." },
    { name: "Percussion", desc: "This kit has a Latin percussion set up on it including congas, timbales, shakers, cowbell and splash with a cajon bass drum sound." },
    { name: "Japan Kit", desc: "This kit features various traditional Japanese percussion sounds." },
    { name: "AHM+DynPhasr", desc: "AbsoHybMaple with effects" },
    { name: "AHM+Modulatr", desc: "AbsoHybMaple with effects" },
    { name: "AHM+AnalgDly", desc: "AbsoHybMaple with effects" },
    { name: "AHM+Symphnic", desc: "AbsoHybMaple with effects" },
    { name: "AHM+VCMFlngr", desc: "AbsoHybMaple with effects" },
]

const bank = new NumberModel(0)
bindModel("bank", bank)
const program = new NumberModel(0)
bindModel("program", program)
const kitName = new TextModel(kits[0].name)
bindModel("kitName", kitName)
const kitDesc = new TextModel(kits[0].desc)
bindModel("kitDesc", kitDesc)

const msg0 = new TextModel("")
bindModel("msg0", msg0)
const msg1 = new TextModel("")
bindModel("msg1", msg1)

// Timing Clock. Sent 24 times per quarter note when synchronization is required
const MIDI_TIMING_CLOCK = 0xF8
// Active Sensing.This message is intended to be sent repeatedly to tell the receiver
// that a connection is alive.Use of this message is optional.When initially received,
// the receiver will expect to receive another Active Sensing message each 300ms(max),
// and if it does not then it will assume that the connection has been terminated. At
// termination, the receiver will turn off all voices and return to normal(non - active
// sensing) operation.
const MIDI_END_OF_EXCLUSIVE = 0xF7
const MIDI_ACTIVE_SENSING = 0xFE
const MIDI_RESET = 0xFF

let midi = null  // global MIDIAccess object
function onMIDISuccess(midiAccess: MIDIAccess) {
    console.log("MIDI ready!")
    midi = midiAccess  // store in the global (in real usage, would probably keep in an object instance)
    // listInputsAndOutputs(midiAccess)
    let { input, output } = findDTX(midiAccess)
    if (input === undefined || output === undefined) {
        console.log("Failed to find DTX Drums")
        return
    }
    // console.log(input)
    // console.log(output)

    input.onmidimessage = onMIDIMessage

    // const MIDI_IDENTITY_REQUEST = [0xF0, 0x7E, 0x00, 0x06, 0x01, 0xF7]
    // output.send(MIDI_IDENTITY_REQUEST)
}

function onMIDIMessage(ev: Event) {
    const event = ev as MIDIMessageEvent

    if (event.data.length === 1 && (
        event.data[0] === MIDI_TIMING_CLOCK ||
        event.data[0] === MIDI_ACTIVE_SENSING
    )) {
        return
    }

    const MIDI_DTX_PRO_IDENTIFY_REPLY = new Uint8Array([0xf0, 0x7e, 0x7f, 0x6, 0x2, 0x43, 0x0, 0x41, 0x5d, 0x6, 0x0, 0x0, 0x0, 0x7f, 0xf7])
    if (eq(event.data, MIDI_DTX_PRO_IDENTIFY_REPLY)) {
        console.log(`Found Yamaha DTX-PRO`)
        return
    }

    if (event.data[0] == 0x99) {
        let name
        switch (event.data[1]) {
            case 0x10: // 16
                name = "Crash 2 Bell"
                break
            case 0x11: // 17
                name = "Crash 2 Bow"
                break
            case 0x24: // 36
                name = "Bass Drum (GM Electric Bass Drum)"
                break
            case 0x25: // 37
                name = "Snare Side Stick (GM Side Stick)"
                break
            case 0x26: // 38
                name = "Snare Center (GM Acoustic Snare)"
                break
            case 0x28: // 40
                name = "Snare Rimshot (GM Electric Snare)"
                break
            case 0x2a: // 42
                name = "HiHat Controller (GM Closed Hi-Hat)"
                break
            case 0x2b: // 43
                name = "Tom 3 (GM Hi Floor Tom)"
                break
            case 0x2c: // 44
                name = "HiHat ??? (GM Pedal Hi-Hat)"
                break
            case 0x2e: // 46
                name = "HiHat Bow (GM Open Hi-Hat)"
                break
            case 0x2f: // 47
                name = "Tom 2 (GM Low-Mid Tom)"
                break
            case 0x30: // 48
                name = "Tom 1 (GM Hi-Mid Tom)"
                break
            case 0x31: // 49
                name = "Crash 1 Rim (GM Crash Cymbal 1)"
                break
            case 0x33: // 51
                name = "Ride Bow (GM Ride Cymbal 1)"
                break
            case 0x34: // 52
                name = "Ride Rim (GM Chinese Cymbal)"
                break
            case 0x35: // 53
                name = "Ride Bell (GM Ride Bell)"
                break
            case 0x37: // 55
                name = "Crash 1 Bell (GM Splash Cymbal)"
                break
            case 0x39: // 57
                name = "Crash 2 Rim (GM Crash Cymbal 2)"
                break
            case 0x3b: // 59
                name = "Crash 1 Bow (GM Ride Cymbal 2)"
                break
            case 0x4e: // 78
                name = "HiHat Rim (GM Mute Cuica)"
                break
            case 0x53: // 83
                name = "HitHat Foot Close"
                break
            default:
                name = "0x" + event.data[1].toString(16)

        }
        // console.log(`Note On: ${name} ${event.data[2]}`)
        if (event.data[2] > 0) {
            msg0.value = `${name} ${event.data[2]}`
        }
        return
    }

    // Control Change
    if (event.data[0] === 0xB9) {
        let name
        switch (event.data[1]) {
            case 0x00: // Preset Kit (0x0, 0x7d preset kit   LSB=0, MSB=125)
                return
            case 0x20: // Bank Select (0x20, 0x0 bank select  LSB=32 MSB=0)
                bank.value = event.data[2]
                return
            case 0x04:
                name = "HiHat Controller Pressure"
                break
            case 16:
                name = "Snare Location"
                break
            case 17:
                name = "Ride Location"
                break

            // input only
            case 80:
                name = "Ambience"
                break
            case 81:
                name = "Compression"
                break
            case 82:
                name = "Effect"
                break

            default:
                name = "0x" + event.data[1].toString(16)
        }
        // console.log(`Control Change: ${name} ${event.data[2]}`)
        if (event.data[2] > 0) {
            msg1.value = `${name} ${event.data[2]}`
        }
        return
    }
    // Program Change
    if (event.data[0] == 0xC9) {
        program.value = event.data[1]
        switch (bank.value) {
            case 0:
                if (program.value < kits.length) {
                    const kit = kits[program.value]
                    // console.log(`${kit.name}: ${kit.desc}`)
                    kitName.value = kit.name
                    kitDesc.value = kit.desc
                }
                break
            case 1:
                kitName.value = `U${program.value + 1}`
                kitDesc.value = "User Kit"
                break
            case 2:
                kitName.value = `U${program.value + 101}`
                kitDesc.value = "User Kit"
                break
        }
        return
    }

    let str = "MIDI message received at timestamp " + event.timeStamp + "[" + event.data.length + " bytes]: "
    for (let i = 0; i < event.data.length; i++) {
        str += "0x" + event.data[i].toString(16) + " "
    }
    console.log(str)
}

function eq(a: Uint8Array, b: Uint8Array) {
    if (a.length !== b.length)
        return false
    var i = a.length
    while (i--) {
        if (a[i] !== b[i]) return false
    }
    return true
}

function equalArray<T>(a: T[], b: T[]) {
    if (a.length !== b.length)
        return false
    var i = a.length
    while (i--) {
        if (a[i] !== b[i]) return false
    }
    return true
}

function startLoggingMIDIInput(midiAccess: MIDIAccess, indexOfPort: number) {
    midiAccess.inputs.forEach((entry: MIDIInput) => { entry.onmidimessage = onMIDIMessage })
}

function onMIDIFailure(msg: any) {
    console.log("Failed to get MIDI access - " + msg)
}

function listInputsAndOutputs(midiAccess: MIDIAccess) {
    for (let entry of midiAccess.inputs) {
        let input = entry[1]
        console.log("Input port [type:'" + input.type + "'] id:'" + input.id +
            "' manufacturer:'" + input.manufacturer + "' name:'" + input.name +
            "' version:'" + input.version + "'")
    }

    for (let entry of midiAccess.outputs) {
        let output = entry[1]
        console.log("Output port [type:'" + output.type + "'] id:'" + output.id +
            "' manufacturer:'" + output.manufacturer + "' name:'" + output.name +
            "' version:'" + output.version + "'")
    }
}

function findDTX(midiAccess: MIDIAccess) {
    let i, o
    for (let entry of midiAccess.inputs) {
        let input = entry[1]
        if (input.name === "DTX Drums") {
            i = input
            break
        }
    }

    for (let entry of midiAccess.outputs) {
        let output = entry[1]
        if (output.name === "DTX Drums") {
            o = output
            break
        }
    }
    return { input: i, output: o }
}

export function main() {
    try {
        navigator.requestMIDIAccess({ sysex: false }).then(onMIDISuccess, onMIDIFailure)
    } catch(e) {
        kitName.value = ""
        kitDesc.value = ""
        msg0.value = "Your browser does not support MIDI. Please try Firefox, Chrome or other."
    }
}