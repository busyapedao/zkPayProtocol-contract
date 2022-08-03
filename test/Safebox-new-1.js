const { BigNumber, utils } = require('ethers')
const snarkjs = require("snarkjs")
const fs = require("fs")

describe('Safebox-old-1', function () {
    let accounts
    let provider
    let passwordService
    let safeboxFactory
    let safebox
    let usdt
    let busd
    let nft
    let fee

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


        const MockERC721 = await ethers.getContractFactory('MockERC721')
        nft = await MockERC721.deploy('MockNFT', 'NFT')
        await nft.deployed()
        console.log('nft deployed:', nft.address)
		await nft.mint(accounts[0].address, b('9988'))
        console.log('busd mint to accounts[0]', await nft.ownerOf(b('9988')))

        
        const PasswordService = await ethers.getContractFactory('PasswordService')
        passwordService = await PasswordService.deploy()
        await passwordService.deployed()
        console.log('passwordService deployed:', passwordService.address)
        await passwordService.transferOwnership(accounts[1].address)
        console.log('passwordService transferOwnership(fee) to', await passwordService.owner())
        fee = await passwordService.fee()
        console.log('passwordService fee(Ether)', utils.formatEther(fee))
        

        const SafeboxFactory = await ethers.getContractFactory('SafeboxFactory')
        safeboxFactory = await SafeboxFactory.deploy(passwordService.address)
        await safeboxFactory.deployed()
        console.log('safeboxFactory deployed:', safeboxFactory.address)


        let safeboxAddr = await safeboxFactory.getSafeboxAddr(accounts[0].address)
        console.log('safebox predictedAddress', safeboxAddr)
        const Safebox = await ethers.getContractFactory('Safebox')
        safebox = await Safebox.attach(safeboxAddr)
    })


    it('deposit', async function () {
        await usdt.transfer(safebox.address, m(100, 18))
        console.log('transfer ERC20 done')

        await nft.transferFrom(accounts[0].address, safebox.address, b('9988'))
        console.log('transfer ERC721 done')

        await accounts[0].sendTransaction({to: safebox.address, value: m(2, 18)})
        console.log('transfer ETH done')

        await print()
    })


    it('resetPassword', async function () {
        let psw = 'abc123'

        let datahash = '0'

        let p = await getProof(psw, accounts[0].address, datahash)
            
        //need fee
        await passwordService.resetPassword(p.proof, 0, 0, p.proof, p.zkhash, p.expiration, p.allhash, {value: fee})
        console.log('resetPassword done')

        await print()
    })


    it('createSafebox', async function () {
        let receipt = await (await safeboxFactory.createSafebox()).wait()
        console.log('createSafebox, address:', b(receipt.logs[1].topics[2]).toHexString())

        let safeboxAddr = await safeboxFactory.getSafeboxAddr(accounts[0].address)
        console.log('getSafeboxAddr:', safeboxAddr)
    })


    it('withdrawERC20', async function () {
        let psw = 'abc123'

        let tokenAddr = usdt.address
        let amount = s(m(40, 18))
        let datahash = utils.solidityKeccak256(['address', 'uint256'], [tokenAddr, amount])
        datahash = s(b(datahash).div(100)) //must be 254b, not 256b
        
        let p = await getProof(psw, accounts[0].address, datahash)

        await safebox.withdrawERC20(p.proof, tokenAddr, amount, p.expiration, p.allhash)
        console.log('withdrawERC20 done')

        await print()
    })


    it('withdrawETH', async function () {
        let psw = 'abc123'

        let amount = s(m(1, 18))
        let datahash = utils.solidityKeccak256(['uint256'], [amount]);
        datahash = s(b(datahash).div(100)) //must be 254b, not 256b

        let p = await getProof(psw, accounts[0].address, datahash)

        await safebox.withdrawETH(p.proof, amount, p.expiration, p.allhash)
        console.log('withdrawETH done')

        await print()
    })


    it('withdrawERC721', async function () {
        let psw = 'abc123'

        let tokenAddr = nft.address
        let tokenId = b('9988')
        let datahash = utils.solidityKeccak256(['address','uint256'], [tokenAddr, tokenId]);
        datahash = s(b(datahash).div(100)) //must be 254b, not 256b

        let p = await getProof(psw, accounts[0].address, datahash)

        await safebox.withdrawERC721(p.proof, tokenAddr, tokenId, p.expiration, p.allhash)
        console.log('withdrawERC721 done')

        await print()
    })


    it('transferOwnership', async function () {
        let psw = 'abc123'

        let newOwner = accounts[2].address
        let datahash = newOwner

        let p = await getProof(psw, accounts[0].address, datahash)

        //need fee
        await safebox.transferOwnership(p.proof, newOwner, p.expiration, p.allhash, {value: fee})
        console.log('transferOwnership done')

        await print()
    })




    //util
    async function getProof(psw, user, datahash) {
        let network = await provider.getNetwork()

        let input = [stringToHex(psw), user, datahash, parseInt(Date.now()/1000+600), network.chainId]
        let data = await snarkjs.groth16.fullProve({in:input}, "./zk/main7/circuit_js/circuit.wasm", "./zk/main7/circuit_final.zkey")

        // console.log(JSON.stringify(data))

        const vKey = JSON.parse(fs.readFileSync("./zk/main7/verification_key.json"))
        const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

        if (res === true) {
            console.log("Verification OK")

            let zkhash = data.publicSignals[0]
            // let datahash = data.publicSignals[1]
            let expiration = data.publicSignals[2]
            // let chainId = data.publicSignals[3]
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

            return {proof, zkhash, expiration, allhash}

        } else {
            console.log("Invalid proof")
        }
    }


    async function print() {
        console.log('')
        for (let i=0; i<=4; i++) {
            let safeboxAddr = await safeboxFactory.getSafeboxAddr(accounts[i].address)
            console.log('accounts[' + i + ']',
                'safeboxAddr', safeboxAddr,
                'usdt:', d(await usdt.balanceOf(accounts[i].address), 18), 
                'eth:', d(await provider.getBalance(accounts[i].address), 18),
                'safebox usdt:', d(await usdt.balanceOf(safeboxAddr), 18),
                'safebox eth:', d(await provider.getBalance(safeboxAddr), 18)
			)
		}
        console.log('nft#9988 owner:', await nft.ownerOf(b('9988')))
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
