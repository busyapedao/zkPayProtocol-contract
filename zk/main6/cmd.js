var execSync = require('child_process').execSync;


console.log('cmd start')

execSync('circom circuit.circom --r1cs --wasm --sym')
console.log('compile done')

execSync('snarkjs powersoftau new bn128 12 pot12_0000.ptau -v')
console.log('generate pot12_0000.ptau done')
execSync('snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v -e=' + randStr())
console.log('generate pot12_0001.ptau done')
execSync('snarkjs powersoftau contribute pot12_0001.ptau pot12_0002.ptau --name="Second contribution" -v -e=' + randStr())
console.log('generate pot12_0002.ptau done')
execSync('snarkjs powersoftau export challenge pot12_0002.ptau challenge_0003')
console.log('generate challenge_0003 done')
execSync('snarkjs powersoftau challenge contribute bn128 challenge_0003 response_0003 -e=' + randStr())
console.log('generate response_0003 done')
execSync('snarkjs powersoftau import response pot12_0002.ptau response_0003 pot12_0003.ptau -n="Third contribution name"')
console.log('generate pot12_0003.ptau done')
execSync('snarkjs powersoftau beacon pot12_0003.ptau pot12_beacon.ptau ' + rand() + ' 10 -n="Final Beacon"')
console.log('generate pot12_beacon.ptau done')
execSync('snarkjs powersoftau prepare phase2 pot12_beacon.ptau pot12_final.ptau -v')
console.log('generate pot12_final.ptau done')

execSync('snarkjs groth16 setup circuit.r1cs pot12_final.ptau circuit_0000.zkey')
console.log('generate circuit_0000.zkey done')
execSync('snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="1st Contributor Name" -v -e=' + randStr())
console.log('generate circuit_0001.zkey done')
execSync('snarkjs zkey contribute circuit_0001.zkey circuit_0002.zkey --name="Second contribution Name" -v -e=' + randStr())
console.log('generate circuit_0002.zkey done')
execSync('snarkjs zkey export bellman circuit_0002.zkey  challenge_phase2_0003')
console.log('generate challenge_phase2_0003 done')
execSync('snarkjs zkey bellman contribute bn128 challenge_phase2_0003 response_phase2_0003 -e=' + randStr())
console.log('generate response_phase2_0003 done')

// execSync('snarkjs zkey import bellman circuit_0002.zkey response_phase2_0003 circuit_0003.zkey -n="name";') //error
// console.log('generate circuit_0003.zkey done')
// execSync('snarkjs zkey beacon circuit_0003.zkey circuit_final.zkey 0123abcd 10 -n="Final Beacon phase2"')
// console.log('generate circuit_final.zkey done')
// combine into one, or it will be error
execSync('snarkjs zkey import bellman circuit_0002.zkey response_phase2_0003 circuit_0003.zkey -n="name" ; snarkjs zkey beacon circuit_0003.zkey circuit_final.zkey ' + rand() + ' 10 -n="Final Beacon phase2"')
console.log('generate circuit_final.zkey done')

execSync('snarkjs zkey export verificationkey circuit_final.zkey verification_key.json')
console.log('generate verification_key.json done')

execSync('snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol')
console.log('generate verifier.sol done')

console.log('cmd end')


function rand() {
    return Math.random().toString()
}

function randStr() {
    return '"' + Math.random() + '"'
}