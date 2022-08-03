const { BigNumber, utils } = require('ethers')
const snarkjs = require("snarkjs")
const fs = require("fs")

describe('Safebox-old-1', function () {
    let accounts
    let provider
    let safeboxFactory
    let safebox
    let usdt
    let busd

    before(async function () {
        accounts = await ethers.getSigners()
        provider = accounts[0].provider
    })

    it('deploy', async function () {
        const MockERC20 = await ethers.getContractFactory('MockERC20')
        usdt = await MockERC20.deploy('MockUSDT', 'USDT')
        await usdt.deployed()
        console.log('usdt deployed:', usdt.address)
		await usdt.mint(accounts[0].address, m(1000, 18))
        console.log('usdt mint to accounts[0]', d(await usdt.balanceOf(accounts[0].address), 18))
		await usdt.mint(accounts[1].address, m(1000, 18))
        console.log('usdt mint to accounts[1]', d(await usdt.balanceOf(accounts[1].address), 18))


        busd = await MockERC20.deploy('MockBUSD', 'BUSD')
        await busd.deployed()
        console.log('busd deployed:', busd.address)
		await busd.mint(accounts[0].address, m(1000, 18))
        console.log('busd mint to accounts[0]', d(await busd.balanceOf(accounts[0].address), 18))
		await busd.mint(accounts[1].address, m(1000, 18))
        console.log('busd mint to accounts[1]', d(await busd.balanceOf(accounts[1].address), 18))

        
        const SafeboxFactory = await ethers.getContractFactory('SafeboxFactory')
        safeboxFactory = await SafeboxFactory.deploy()
        await safeboxFactory.deployed()
        console.log('safeboxFactory deployed:', safeboxFactory.address)
    })


    it('deposit', async function () {
        let safeboxAddr = await safeboxFactory.calcSafeboxAddr(accounts[0].address)
        console.log('safebox predictedAddress', safeboxAddr)

        await usdt.transfer(safeboxAddr, m(100, 18))
        console.log('transfer ERC20 done')

        await accounts[0].sendTransaction({to: safeboxAddr, value: m(2, 18)});
        console.log('transfer ETH done')

        await print()
    })


    it('createSafebox', async function () {
        //set psw
        let psw = 'abc123'

        let input = [stringToHex(psw), accounts[0].address, '0', '0', parseInt(Date.now()/1000+600)]
        let data = await snarkjs.groth16.fullProve({in:input}, "./zk/main6/circuit_js/circuit.wasm", "./zk/main6/circuit_final.zkey")

        console.log(JSON.stringify(data))

        const vKey = JSON.parse(fs.readFileSync("./zk/main6/verification_key.json"))
        const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

        if (res === true) {
            console.log("Verification OK")

            let boxhash = data.publicSignals[0]
            let tokenAddr = data.publicSignals[1]
            let amount = data.publicSignals[2]
            let expiration = data.publicSignals[3]
            let allhash = data.publicSignals[4]

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

            await (await safeboxFactory.createSafebox(proof, boxhash, expiration, allhash)).wait()
            let safeboxAddr = await safeboxFactory.getSafeboxAddr(accounts[0].address)
            console.log('createSafebox', safeboxAddr)

            const Safebox = await ethers.getContractFactory('Safebox')
            safebox = await Safebox.attach(safeboxAddr)

        } else {
            console.log("Invalid proof")
        }
    })


    it('withdrawERC20', async function () {
        let psw = 'abc123'

        let input = [stringToHex(psw), accounts[0].address, usdt.address, s(m(40, 18)), parseInt(Date.now()/1000+600)]
        let data = await snarkjs.groth16.fullProve({in:input}, "./zk/main6/circuit_js/circuit.wasm", "./zk/main6/circuit_final.zkey")

        console.log(JSON.stringify(data))

        const vKey = JSON.parse(fs.readFileSync("./zk/main6/verification_key.json"))
        const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

        if (res === true) {
            console.log("Verification OK")

            let boxhash = data.publicSignals[0]
            let tokenAddr = data.publicSignals[1]
            let amount = data.publicSignals[2]
            let expiration = data.publicSignals[3]
            let allhash = data.publicSignals[4]

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

            await safebox.withdrawERC20(proof, usdt.address, amount, expiration, allhash)
            console.log('withdrawERC20 done')
    
            await print()

        } else {
            console.log("Invalid proof")
        }
    })


    it('withdrawETH', async function () {
        let psw = 'abc123'

        let input = [stringToHex(psw), accounts[0].address, '0', s(m(1, 18)), parseInt(Date.now()/1000+600)]
        let data = await snarkjs.groth16.fullProve({in:input}, "./zk/main6/circuit_js/circuit.wasm", "./zk/main6/circuit_final.zkey")

        console.log(JSON.stringify(data))

        const vKey = JSON.parse(fs.readFileSync("./zk/main6/verification_key.json"))
        const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

        if (res === true) {
            console.log("Verification OK")

            let boxhash = data.publicSignals[0]
            let tokenAddr = data.publicSignals[1]
            let amount = data.publicSignals[2]
            let expiration = data.publicSignals[3]
            let allhash = data.publicSignals[4]

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

            await safebox.withdrawETH(proof, amount, expiration, allhash)
            console.log('withdrawETH done')
    
            await print()

        } else {
            console.log("Invalid proof")
        }
    })



    async function print() {
        console.log('')
        for (let i=0; i<=4; i++) {
            let safeboxAddr = await safeboxFactory.calcSafeboxAddr(accounts[i].address)
            console.log('accounts[' + i + ']',
                'safeboxAddr', safeboxAddr,
                'usdt:', d(await usdt.balanceOf(accounts[i].address), 18), 
                'safebox usdt:', d(await usdt.balanceOf(safeboxAddr), 18),
                'eth:', d(await provider.getBalance(accounts[i].address), 18), 
                'safebox eth:', d(await provider.getBalance(safeboxAddr), 18)
			)
		}
        console.log('')
    }


    function stringToHex(string) {
        let hexStr = '';
        for (let i = 0; i < string.length; i++) {
            let compact = string.charCodeAt(i).toString(16)
            hexStr += compact
        }
        return '0x' + hexStr
    }

    function getAbi(jsonPath) {
        let file = fs.readFileSync(jsonPath)
        let abi = JSON.parse(file.toString()).abi
        return abi
    }

    async function delay(sec) {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, sec * 1000);
        })
    }

    function m(num, decimals) {
        return BigNumber.from(num).mul(BigNumber.from(10).pow(decimals))
    }

    function d(bn, decimals) {
        return bn.mul(BigNumber.from(100)).div(BigNumber.from(10).pow(decimals)).toNumber() / 100
    }

    function b(num) {
        return BigNumber.from(num)
    }

    function n(bn) {
        return bn.toNumber()
    }

    function s(bn) {
        return bn.toString()
    }
})
