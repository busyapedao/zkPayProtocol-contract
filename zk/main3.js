const snarkjs = require("snarkjs")
const fs = require("fs")
const BN = require('bn.js')

async function run() {
    let psw = 'abc123'
    let tokenAddr = '0x0' //hex or int
    let amount = '0' //hex or int
    let input = [stringToHex(psw), tokenAddr, amount]
    console.log('input', input)

    const { proof, publicSignals } = await snarkjs.groth16.fullProve({in:input}, "./main3_js/main3.wasm", "circuit_final.zkey")

    console.log("publicSignals: ", publicSignals)
    console.log("Proof: ")
    console.log(JSON.stringify(proof, null, 1))

    const vKey = JSON.parse(fs.readFileSync("verification_key.json"))

    const res = await snarkjs.groth16.verify(vKey, publicSignals, proof)

    if (res === true) {
        console.log("Verification OK")
    } else {
        console.log("Invalid proof")
    }
}


function stringToHex(string) {
    let hexStr = '';
    for (let i = 0; i < string.length; i++) {
        let compact = string.charCodeAt(i).toString(16)
        hexStr += compact
    }
    return '0x' + hexStr
}


function binaryToString(arr) {
    let binStr = '';
    let resultArray = [];

    for (let i = 0; i < arr.length; i++) {
        binStr += arr[i].toString()
    }
    console.log(binStr)

    return binStr
}



run().then(() => {
    process.exit(0)
})