const fs = require('fs')
const ethers = require('ethers')
const { BigNumber, utils } = ethers


// metis testnet
// passwordService deployed: 0x6009234967B1c7872de00BB3f3e77610b8D6dc9e
// safeboxFactory deployed: 0xa877a2247b318b40935E102926Ba5ff4F3b0E8b1
// usdt deployed: 0x6D288698986A3b1C1286fB074c45Ac2F10409E28
// busd deployed: 0x072777f02Ad827079F188D8175FB155b0e75343D
// WordsNFT deployed: 0xCd327e2688b4aCF4219Fb8455bB3749303265761

//default
var signer
var provider

var passwordService
var safeboxFactory
var usdt
var busd
var wordsNFT

var userAddr
var safeboxAddr

async function main() {
    //default
    // let privateKey = '0x0123456789012345678901234567890123456789012345678901234567890123'
    // let wallet = new ethers.Wallet(privateKey)

    const url = 'https://stardust.metis.io/?owner=588'
    provider = new ethers.providers.JsonRpcProvider(url)
    signer = provider.getSigner(0)

    //config
    let passwordServiceAddr = '0x6009234967B1c7872de00BB3f3e77610b8D6dc9e'
    let safeboxFactoryAddr = '0xa877a2247b318b40935E102926Ba5ff4F3b0E8b1'
    let usdtAddr = '0x6D288698986A3b1C1286fB074c45Ac2F10409E28'
    let busdAddr = '0x072777f02Ad827079F188D8175FB155b0e75343D'
    let wordsNFTAddr = '0xCd327e2688b4aCF4219Fb8455bB3749303265761'

    //init
    passwordService = new ethers.Contract(passwordServiceAddr, getAbi('../artifacts/contracts/pws/PasswordService.sol/PasswordService.json'), provider)
    safeboxFactory = new ethers.Contract(safeboxFactoryAddr, getAbi('../artifacts/contracts/zkSafe/SafeboxFactory.sol/SafeboxFactory.json'), provider)
    usdt = new ethers.Contract(usdtAddr, getAbi('../artifacts/contracts/mock/MockERC20.sol/MockERC20.json'), provider)
    busd = new ethers.Contract(busdAddr, getAbi('../artifacts/contracts/mock/MockERC20.sol/MockERC20.json'), provider)
    wordsNFT = new ethers.Contract(wordsNFTAddr, getAbi('../artifacts/contracts/mock/MockERC721.sol/MockERC721.json'), provider)

    await home()
    // await myToken()
    // await myNFT()
    await importToken()
    await importNFT()
}


async function home() {
    userAddr = '0xE44081Ee2D0D4cbaCd10b44e769A14Def065eD4D' //input wallet address

    safeboxAddr = await safeboxFactory.getSafeboxAddr(userAddr)
    let existSafeboxAddr = await safeboxFactory.userToSafebox(userAddr)
    if (existSafeboxAddr == safeboxAddr) {
        console.log('用户已创建保险箱', safeboxAddr)
    } else {
        console.log('用户未创建保险箱，保险箱的地址预计为', safeboxAddr)
    }
}


async function myToken() {
    console.log('in wallet metis:', d(await provider.getBalance(userAddr), 18))
    console.log('in safebox metis:', d(await provider.getBalance(safeboxAddr), 18))
    console.log('in wallet usdt:', d(await usdt.balanceOf(userAddr), 18))
    console.log('in safebox usdt:', d(await usdt.balanceOf(safeboxAddr), 18))
    console.log('in wallet busd:', d(await busd.balanceOf(userAddr), 18))
    console.log('in safebox busd:', d(await busd.balanceOf(safeboxAddr), 18))
}


async function myNFT() {
    for (let i=1; i<=3; i++) {
        let nftOwner = await wordsNFT.ownerOf(i)
        if (userAddr == nftOwner) {
            console.log('in wallet WordsNFT:', 'Words#' + i)
            console.log(await wordsNFT.tokenURI(i)) //svg
        } else if (safeboxAddr == nftOwner) {
            console.log('in safebox WordsNFT:', 'Words#' + i)
            console.log(await wordsNFT.tokenURI(i)) //svg
        }
    }
}


async function importToken() {
    let tokenAddr = '0x072777f02Ad827079F188D8175FB155b0e75343D' //input contract address

    let token = new ethers.Contract(tokenAddr, getAbi('../artifacts/contracts/mock/MockERC20.sol/MockERC20.json'), provider)
    console.log('导入的token', await token.name(), await token.symbol())
    console.log('wallet token:', d(await token.balanceOf(userAddr), 18))
    console.log('safebox token:', d(await token.balanceOf(safeboxAddr), 18))
}


async function importNFT() {
    let nftAddr = '0xCd327e2688b4aCF4219Fb8455bB3749303265761' //input contract address
    let nftId = '1' //input NFT id number

    let nft = new ethers.Contract(nftAddr, getAbi('../artifacts/contracts/mock/MockERC721.sol/MockERC721.json'), provider)
    console.log('导入的nft', await nft.name(), await nft.symbol())

    let nftOwner = await nft.ownerOf(nftId)
    if (userAddr == nftOwner) {
        console.log('in wallet')
    } else {
        console.log('not in wallet')
    }
    
    if (safeboxAddr == nftOwner) {
        console.log('in safebox')
    } else {
        console.log('not in safebox')
    }

    console.log(await nft.tokenURI(nftId)) //svg
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