const { BigNumber } = require('ethers')

describe('words-test', function () {
	let accounts
    let provider
	let nft
    let tokenURI

	before(async function () {
		accounts = await ethers.getSigners()
        provider = accounts[0].provider
	})
	
	it('deploy', async function () {
        const NFT = await ethers.getContractFactory('Words')
		nft = await NFT.deploy()
		await nft.deployed()
        
        const TokenURI = await ethers.getContractFactory('WordsURI')
		tokenURI = await TokenURI.deploy(nft.address)
		await tokenURI.deployed()

        await nft.setUriContract(tokenURI.address)
        await nft.setFeeTo(accounts[1].address)
        await nft.setName('只言片语', 'Words')

        console.log({name: await nft.name(), symbol: await nft.symbol()})
	})

    it('mint', async function () {
        await nft.mint('&#10022;', 'rgb(39,112,38)', '&#128757;', '为自己的投资留一辆电动车', '外卖币哥', 'Words is opensource and free.', {value: m(0, 18)})
        await print()
	})

    it('modify', async function () {
        await nft.modify(1, '加仓他妈的', '韭菜哥', '加仓就对了啊', {value: m(10, 18)})
        await print()
	})
    

    async function print() {
        console.log('')
        
        let minted = await nft.minted()
        for (let i = 1; i <= minted; i++) {
            let owner = await nft.ownerOf(i)
            let info = await nft.tokenIdToInfo(i)
            console.log(i, owner, info)
            console.log(await nft.tokenURI(i))
        }

        console.log('totalSupply:', await nft.totalSupply())

        console.log('eth:', d(await provider.getBalance(accounts[1].address), 18))
    
        console.log('')
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
