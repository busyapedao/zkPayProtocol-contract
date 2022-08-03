var execSync = require('child_process').execSync;


console.log('cmd start')

execSync('circom circuit.circom --r1cs --wasm --sym')
console.log('compile done')

execSync('snarkjs powersoftau new bn128 20 pot20_0000.ptau -v')
console.log('generate pot20_0000.ptau done')
execSync('snarkjs powersoftau contribute pot20_0000.ptau pot20_0001.ptau --name="First contribution" -v -e="some random text"')
console.log('generate pot20_0001.ptau done')
execSync('snarkjs powersoftau contribute pot20_0001.ptau pot20_0002.ptau --name="Second contribution" -v -e="some random text"')
console.log('generate pot20_0002.ptau done')
execSync('snarkjs powersoftau export challenge pot20_0002.ptau challenge_0003')
console.log('generate challenge_0003 done')
execSync('snarkjs powersoftau challenge contribute bn128 challenge_0003 response_0003 -e="some random text"')
console.log('generate response_0003 done')
execSync('snarkjs powersoftau import response pot20_0002.ptau response_0003 pot20_0003.ptau -n="Third contribution name"')
console.log('generate pot20_0003.ptau done')
execSync('snarkjs powersoftau beacon pot20_0003.ptau pot20_beacon.ptau 0123abcd 10 -n="Final Beacon"')
console.log('generate pot20_beacon.ptau done')
execSync('snarkjs powersoftau prepare phase2 pot20_beacon.ptau pot20_final.ptau -v')
console.log('generate pot20_final.ptau done')

execSync('snarkjs groth16 setup circuit.r1cs pot20_final.ptau circuit_0000.zkey')
console.log('generate circuit_0000.zkey done')
execSync('snarkjs zkey contribute circuit_0000.zkey circuit_0001.zkey --name="1st Contributor Name" -v -e="Another random entropy"')
console.log('generate circuit_0001.zkey done')
execSync('snarkjs zkey contribute circuit_0001.zkey circuit_0002.zkey --name="Second contribution Name" -v -e="Another random entropy"')
console.log('generate circuit_0002.zkey done')
execSync('snarkjs zkey export bellman circuit_0002.zkey  challenge_phase2_0003')
console.log('generate challenge_phase2_0003 done')
execSync('snarkjs zkey bellman contribute bn128 challenge_phase2_0003 response_phase2_0003 -e="some random text"')
console.log('generate response_phase2_0003 done')

// execSync('snarkjs zkey import bellman circuit_0002.zkey response_phase2_0003 circuit_0003.zkey -n="name";') //error
// console.log('generate circuit_0003.zkey done')
// execSync('snarkjs zkey beacon circuit_0003.zkey circuit_final.zkey 0123abcd 10 -n="Final Beacon phase2"')
// console.log('generate circuit_final.zkey done')
// combine into one, or it will be error
execSync('snarkjs zkey import bellman circuit_0002.zkey response_phase2_0003 circuit_0003.zkey -n="name" ; snarkjs zkey beacon circuit_0003.zkey circuit_final.zkey 0123abcd 10 -n="Final Beacon phase2"')

execSync('snarkjs zkey export verificationkey circuit_final.zkey verification_key.json')
console.log('generate verification_key.json done')

execSync('snarkjs zkey export solidityverifier circuit_final.zkey verifier.sol')
console.log('generate verifier.sol done')

console.log('cmd end')


// var exec = require('child_process').exec;
// var workerProcess = exec('snarkjs zkey import bellman circuit_0002.zkey response_phase2_0003 circuit_0003.zkey -n="name"', function (error, stdout, stderr) {
//     if (error) {
//         console.log(error.stack);
//         console.log('Error code: '+error.code);
//         console.log('Signal received: '+error.signal);
//     }
//     console.log('stdout: ' + stdout);
//     console.log('stderr: ' + stderr);
// });

// workerProcess.on('exit', function (code) {
//     console.log('子进程已退出，退出码 '+code);
// });