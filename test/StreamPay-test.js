const { BigNumber } = require('ethers')

describe('StreamPay-test', function () {
    let accounts
    let provider
    let streamPay
    let usdt

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

        const StreamPay = await ethers.getContractFactory('StreamPay')
        streamPay = await StreamPay.deploy()
        await streamPay.deployed()
        console.log('streamPay deployed:', streamPay.address)
    })

    
    it('createStream', async function () {
        await usdt.approve(streamPay.address, m(100, 18))
        console.log('step 1 approve done')

        let blockHeight = await provider.getBlockNumber()
        let block = await provider.getBlock(blockHeight)
        // console.log('block', block)

        let startTime = block.timestamp - 1;
        let stopTime = startTime + 100;
		await streamPay.createStream(accounts[1].address, m(100, 18), usdt.address, startTime, stopTime)
        console.log('step 2 createStream done')

        // let streamId = n(await streamPay.streamCount());
        // let stream = await streamPay.getStream(streamId)
        // console.log('stream', stream)
        
        let streams = await streamPay.getUserStreams(accounts[0].address, 1, 2)
        console.log('stream', streams)
        streams = await streamPay.getUserStreams(accounts[1].address, 1, 2)
        console.log('stream', streams)

        await print()
    })
 
 
    it('withdrawFromStream', async function () {
        await delay(10)
        await accounts[9].sendTransaction({to:accounts[10].address, value:m(1,18)}) //force hardhat node running

        await print()

        let streamId = 1;
		await streamPay.withdrawFromStream(streamId, m(5, 18))
        console.log('withdrawFromStream done')

        await print()
    })

    
    it('cancelStream', async function () {
        await delay(10)
        await accounts[9].sendTransaction({to:accounts[10].address, value:m(1,18)}) //force hardhat node running

        await print()

        let streamId = 1;
		await streamPay.cancelStream(streamId)
        console.log('cancelStream done')

        let streams = await streamPay.getUserStreams(accounts[0].address, 1, 2)
        console.log('stream', streams)
        streams = await streamPay.getUserStreams(accounts[1].address, 1, 2)
        console.log('stream', streams)

        await print()
    })


    async function print() {
        console.log('')
        for (let i=0; i<2; i++) {
            console.log('accounts[' + i + ']',
            'usdt:', d(await usdt.balanceOf(accounts[i].address), 18)
			)
		}
        
        let streamId = n(await streamPay.streamCount());
        let stream = await streamPay.streams(streamId)
        if (stream.isEntity) {
            console.log('stream remainingBalance', d(stream.remainingBalance, 18))
            console.log('balanceOf sender', d(await streamPay.balanceOf(streamId, stream.sender), 18))
            console.log('balanceOf recipient', d(await streamPay.balanceOf(streamId, stream.recipient), 18))
        } else {
            console.log('stream not exist')
        }
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
