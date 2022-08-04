const fs = require('fs')
const ethers = require('ethers')
const { BigNumber, utils } = ethers
const snarkjs = require('snarkjs')


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

    //metis testnet
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
    await myToken()
    await myNFT()
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


// 设置密码，弹出插件让用户输入密码, 如果没有设置过密码返回ZKP，之前设置过密码返回null，需要用resetPassword
async function setPassword() {
    let psw = '123abc' //input onChain password
    
    let datahash = '0'
    let zkp = await getProof(psw, userAddr, datahash)
    let zkhash = await passwordService.zkhashOf(userAddr)

    if (s(zkhash) == '0') {
        return zkp //Verification OK
    } else {
        return null //Verification Fail
    }
}


// 重置密码，弹出插件让用户输入新旧密码, 旧密码正确返回新旧2个ZKP，错误返回null
async function resetPassword() {
    let oldPsw = '123abc' //input onChain password(old)
    let newPsw = '123456' //input onChain password(new)
    
    let datahash = '0'
    let oldZkp = await getProof(oldPsw, userAddr, datahash)
    let zkhash = await passwordService.zkhashOf(userAddr)

    if (s(zkhash) == oldZkp.zkhash) {
        let newZkp = await getProof(newPsw, userAddr, datahash)
        return {oldZkp, newZkp} //Verification OK
    } else {
        return null //Verification Fail
    }
}


// 转移保险箱，弹出插件让用户输入密码, 密码正确返回ZKP，错误返回null
async function transferOwnership() {
    let psw = '123abc' //input onChain password
    
    let datahash = '0'
    let zkp = await getProof(psw, userAddr, datahash)
    let zkhash = await passwordService.zkhashOf(userAddr)

    if (s(zkhash) == zkp.zkhash) {
        return zkp //Verification OK
    } else {
        return null //Verification Fail
    }
}


// 从保险箱提token到钱包，弹出插件让用户输入密码, 密码正确返回ZKP，错误返回null
async function withdrawERC20() {
    let psw = '123abc' //input onChain password
    let tokenAddr = usdt.address //input contract address
    let amount = s(m(40, 18)) //input token amount (40个token，18位精度)
    
    let datahash = utils.solidityKeccak256(['address', 'uint256'], [tokenAddr, amount])
    datahash = s(b(datahash).div(100)) //must be 254b, not 256b
    let zkp = await getProof(psw, userAddr, datahash)
    let zkhash = await passwordService.zkhashOf(userAddr)

    if (s(zkhash) == zkp.zkhash) {
        return zkp //Verification OK
    } else {
        return null //Verification Fail
    }
}


// 从保险箱提nft到钱包，弹出插件让用户输入密码, 密码正确返回ZKP，错误返回null
async function withdrawERC721() {
    let psw = '123abc' //input onChain password
    let tokenAddr = nft.address //input contract address
    let tokenId = b('1') //input NFT id

    let datahash = utils.solidityKeccak256(['address','uint256'], [tokenAddr, tokenId]);
    datahash = s(b(datahash).div(100)) //must be 254b, not 256b
    let zkp = await getProof(psw, userAddr, datahash)
    let zkhash = await passwordService.zkhashOf(userAddr)

    if (s(zkhash) == zkp.zkhash) {
        return zkp //Verification OK
    } else {
        return null //Verification Fail
    }
}


// 从保险箱提nft到钱包，弹出插件让用户输入密码, 密码正确返回ZKP，错误返回null
async function withdrawETH() {
    let psw = '123abc' //input onChain password
    let amount = s(m(1, 18)) //input Metis amount

    let datahash = utils.solidityKeccak256(['uint256'], [amount]);
    datahash = s(b(datahash).div(100)) //must be 254b, not 256b
    let zkp = await getProof(psw, userAddr, datahash)
    let zkhash = await passwordService.zkhashOf(userAddr)

    if (s(zkhash) == zkp.zkhash) {
        return zkp //Verification OK
    } else {
        return null //Verification Fail
    }
}


//util
async function getProof(psw, user, datahash) {
    let network = await provider.getNetwork()

    let input = [stringToHex(psw), user, datahash, parseInt(Date.now()/1000+600), network.chainId]
    let data = await snarkjs.groth16.fullProve({in:input}, '../zk/main7/circuit_js/circuit.wasm', '../zk/main7/circuit_final.zkey')

    // console.log(JSON.stringify(data))

    const vKey = JSON.parse(fs.readFileSync('../zk/main7/verification_key.json'))
    const res = await snarkjs.groth16.verify(vKey, data.publicSignals, data.proof)

    if (res === true) {
        // console.log('Verification OK')

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

        console.log('ZKP:', {proof, zkhash, expiration, allhash})
        return {proof, zkhash, expiration, allhash}

    } else {
        console.log('Invalid proof')
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