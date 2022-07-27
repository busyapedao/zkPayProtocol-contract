const { BigNumber } = require('ethers')
const snarkjs = require('snarkjs')
const fs = require('fs')

/**
 * generateProof
 * @param {string} psw e.g. 'abc123'
 * @param {string} tokenAddr hex or int e.g. '0x00'
 * @param {string} amount hex or int e.g. '0'
 * @returns pswHash, tokenAddr, amount, allHash, proof
 */
async function generateProof(psw, tokenAddr, amount) {
    let input = [stringToHex(psw), tokenAddr, amount]
    console.log('[generateProof] input', input)

    let data = await snarkjs.groth16.fullProve({ in: input }, __dirname + '/main3_js/main3.wasm', __dirname + '/circuit_final.zkey')

    // console.log('pswHash: ', data.publicSignals[0])
    // console.log(JSON.stringify(data))

    const vKey = JSON.parse(fs.readFileSync(__dirname + '/verification_key.json'))
    const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

    if (res === true) {
        console.log('[generateProof] Verification OK')

        let proof = [
            BigNumber.from(data.proof.pi_a[0]).toHexString(),
            BigNumber.from(data.proof.pi_a[1]).toHexString(),
            BigNumber.from(data.proof.pi_b[0][1]).toHexString(),
            BigNumber.from(data.proof.pi_b[0][0]).toHexString(),
            BigNumber.from(data.proof.pi_b[1][1]).toHexString(),
            BigNumber.from(data.proof.pi_b[1][0]).toHexString(),
            BigNumber.from(data.proof.pi_c[0]).toHexString(),
            BigNumber.from(data.proof.pi_c[1]).toHexString()
        ]

        return {
            pswHash: data.publicSignals[0],
            tokenAddr: data.publicSignals[1],
            amount: data.publicSignals[2],
            allHash: data.publicSignals[3],
            proof: proof
        }

    } else {
        console.log('[generateProof] Invalid proof')
    }
}

/**
 * getBoxhash
 * @param {string} pswHash
 * @param {string} address wallet address
 * @returns boxhash
 */
function getBoxhash(pswHash, address) {
    return ethers.utils.solidityKeccak256(['uint256', 'address'], [pswHash, address])
}


function stringToHex(string) {
    let hexStr = '';
    for (let i = 0; i < string.length; i++) {
        let compact = string.charCodeAt(i).toString(16)
        hexStr += compact
    }
    return '0x' + hexStr
}


exports.generateProof = generateProof;
exports.getBoxhash = getBoxhash;