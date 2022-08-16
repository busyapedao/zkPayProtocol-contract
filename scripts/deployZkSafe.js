const hre = require('hardhat')
const fs = require('fs')
const { BigNumber, utils } = require('ethers')


// metis testnet
// passwordService deployed: 0x6009234967B1c7872de00BB3f3e77610b8D6dc9e
// safeboxFactory deployed: 0xa877a2247b318b40935E102926Ba5ff4F3b0E8b1
// usdt deployed: 0x6D288698986A3b1C1286fB074c45Ac2F10409E28
// busd deployed: 0x072777f02Ad827079F188D8175FB155b0e75343D
// WordsNFT deployed: 0xCd327e2688b4aCF4219Fb8455bB3749303265761

// polygon mainnet
// passwordService deployed: 0xE8C56D41b5B44F366F60407761E3E1815DB5B96C
// safeboxFactory deployed: 0xd9D6f700242D50D0C193EaB1BBcDBD0E62Cd0C43



async function main() {
	const accounts = await hre.ethers.getSigners()
	const feeTo = '0x50D8aD8e7CC0C9c2236Aac2D2c5141C164168da3'
	// const Bob = '0x0c79981387B11FD4a1D40Df4c1AdF61A9E335E8D'

	const PasswordService = await ethers.getContractFactory('PasswordService')
	const passwordService = await PasswordService.deploy()
	await passwordService.deployed()
	console.log('passwordService deployed:', passwordService.address)
	await passwordService.transferOwnership(feeTo)
	console.log('passwordService transferOwnership(fee) to', await passwordService.owner())
	const fee = await passwordService.fee()
	console.log('passwordService fee(Ether)', utils.formatEther(fee))
	

	const SafeboxFactory = await ethers.getContractFactory('SafeboxFactory')
	const safeboxFactory = await SafeboxFactory.deploy(passwordService.address)
	await safeboxFactory.deployed()
	console.log('safeboxFactory deployed:', safeboxFactory.address)


	// const MockERC20 = await ethers.getContractFactory('MockERC20')
	// const usdt = await MockERC20.deploy('MockUSDT', 'USDT')
	// await usdt.deployed()
	// console.log('usdt deployed:', usdt.address)
	// const usdt = await MockERC20.attach('0x6D288698986A3b1C1286fB074c45Ac2F10409E28')
	// await usdt.mint(accounts[0].address, m(100000, 18))
	// console.log('usdt mint to accounts[0]', d(await usdt.balanceOf(accounts[0].address), 18))
	// await usdt.mint(Bob, m(100000, 18))
	// console.log('usdt mint to bob', d(await usdt.balanceOf(Bob), 18))


	// const busd = await MockERC20.deploy('MockBUSD', 'BUSD')
	// await busd.deployed()
	// console.log('busd deployed:', busd.address)
	// const busd = await MockERC20.attach('0x072777f02Ad827079F188D8175FB155b0e75343D')
	// await busd.mint(accounts[0].address, m(100000, 18))
	// console.log('busd mint to accounts[0]', d(await busd.balanceOf(accounts[0].address), 18))
	// await busd.mint(Bob, m(100000, 18))
	// console.log('busd mint to Bob', d(await busd.balanceOf(Bob), 18))

	
	// const NFT = await ethers.getContractFactory('Words')
    // const nft = await NFT.deploy()
    // await nft.deployed()
    // console.log('WordsNFT deployed:', nft.address)
    // const nft = await NFT.attach('0xCd327e2688b4aCF4219Fb8455bB3749303265761')
    // const TokenURI = await ethers.getContractFactory('WordsURI')
    // const tokenURI = await TokenURI.deploy(nft.address)
    // await tokenURI.deployed()
    // console.log('WordsURI deployed:', tokenURI.address)
	
    // await nft.setName('Words NFT', 'Words')
    // console.log({name: await nft.name(), symbol: await nft.symbol()})
    // await nft.setUriContract(tokenURI.address)
    // await nft.setFeeTo(feeTo)
    // console.log('set done')
    // await nft.mint('&#10022;', 'rgb(39,112,38)', '&#128757;', 'Buy a Bike', 'George', 'From bull to bear, from cryto to express', {value: m(0, 18)})
    // console.log('nft.mint done')
    // await nft.mint('&#10022;', 'rgb(11, 179, 38)', '&#128757;', 'Buy a Bike', 'George', 'From bull to bear, from cryto to express', {value: m(0, 18)})
    // console.log('nft.mint done')
	// await nft.transferFrom(accounts[0].address, Bob, 3)


	console.log('done')
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

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});