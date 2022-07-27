const { BigNumber, utils } = require('ethers')
const snarkjs = require("snarkjs")
const fs = require("fs")

describe('ZkPay-test-1', function () {
    let accounts
    let provider
    let zkPay
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

        
        const ZkPay = await ethers.getContractFactory('ZkPay')
        zkPay = await ZkPay.deploy()
        await zkPay.deployed()
        console.log('zkPay deployed:', zkPay.address)
    })


    it('deposit', async function () {
        await usdt.transfer(await zkPay.calcSafeboxAddr(accounts[0].address), m(100, 18))
        console.log('transfer done')

        await print()
    })


    it('createSafebox', async function () {
        let predictedAddress = await zkPay.calcSafeboxAddr(accounts[0].address)
        console.log('predictedAddress', predictedAddress)
        
        //set psw
        let psw = 'abc123'

        let input = [stringToHex(psw), accounts[0].address]
        let data = await snarkjs.groth16.fullProve({in:input}, "./zk/main4/circuit_js/circuit.wasm", "./zk/main4/circuit_final.zkey")

        console.log(JSON.stringify(data))

        const vKey = JSON.parse(fs.readFileSync("./zk/main4/verification_key.json"))
        const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

        if (res === true) {
            console.log("Verification OK")

            let boxhash = data.publicSignals[0]

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

            await (await zkPay.createSafebox(proof, boxhash)).wait()
            let safeboxAddr = await zkPay.getSafeboxAddr(accounts[0].address)
            console.log('createSafebox', safeboxAddr)

            const Safebox = await ethers.getContractFactory('Safebox')
            safebox = await Safebox.attach(safeboxAddr)

        } else {
            console.log("Invalid proof")
        }
    })


    it('deposit', async function () {
        await usdt.transfer(await zkPay.calcSafeboxAddr(accounts[0].address), m(30, 18))
        console.log('transfer done')

        await print()
    })


    it('call', async function () {
        let psw = 'abc123'

        let input = [stringToHex(psw), accounts[0].address]
        let data = await snarkjs.groth16.fullProve({in:input}, "./zk/main4/circuit_js/circuit.wasm", "./zk/main4/circuit_final.zkey")

        console.log(JSON.stringify(data))

        const vKey = JSON.parse(fs.readFileSync("./zk/main4/verification_key.json"))
        const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

        if (res === true) {
            console.log("Verification OK")

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

            const ERC = await ethers.getContractFactory('MockERC20')
            let contractAddr = usdt.address
            let sigData = ERC.interface.encodeFunctionData('transfer(address,uint256)', [accounts[3].address, m(40, 18)])

            await safebox.call(proof, contractAddr, sigData)
            console.log('call done')
    
            await print()

        } else {
            console.log("Invalid proof")
        }
    })


    it('batchCall', async function () {
        let psw = 'abc123'

        let input = [stringToHex(psw), accounts[0].address]
        let data = await snarkjs.groth16.fullProve({in:input}, "./zk/main4/circuit_js/circuit.wasm", "./zk/main4/circuit_final.zkey")

        console.log(JSON.stringify(data))

        const vKey = JSON.parse(fs.readFileSync("./zk/main4/verification_key.json"))
        const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

        if (res === true) {
            console.log("Verification OK")

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

            const ERC = await ethers.getContractFactory('MockERC20')
            let contractAddr = usdt.address
            let sigData0 = ERC.interface.encodeFunctionData('transfer(address,uint256)', [accounts[3].address, m(10, 18)])
            let sigData1 = ERC.interface.encodeFunctionData('transfer(address,uint256)', [accounts[4].address, m(10, 18)])


            await safebox.batchCall(proof, [contractAddr, contractAddr], [sigData0, sigData1])
            console.log('batchCall done')
    
            await print()

        } else {
            console.log("Invalid proof")
        }
    })


    async function print() {
        console.log('')
        for (let i=0; i<=4; i++) {
            let safeboxAddr = await zkPay.calcSafeboxAddr(accounts[i].address)
            console.log('accounts[' + i + ']',
                'safeboxAddr', safeboxAddr,
                'usdt:', d(await usdt.balanceOf(accounts[i].address), 18), 
                'safebox usdt:', d(await usdt.balanceOf(safeboxAddr), 18)
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
