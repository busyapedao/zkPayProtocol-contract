require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    hardhat: {

    },
    kovan: {
      url: 'https://kovan.infura.io/v3/c7cd730e3f1e4f9a8c702c6cb9d17f3f',
      chainId: 42,
      from: process.env.ETH_ADDRESS_0,
      accounts: [
        process.env.ETH_PK_0,
        process.env.ETH_PK_1,
        process.env.ETH_PK_2,
      ]
    },
    matic_mainnet: {
      // url: 'https://rpc-mainnet.maticvigil.com/v1/6ca36da1323f40dc42d64ed9ba89da9a6f59c23d',
      // url: 'https://rpc-mainnet.matic.network',
      url: 'https://matic-mainnet.chainstacklabs.com',
      // url: 'https://rpc-mainnet.matic.quiknode.pro',
      // url: 'https://matic-mainnet-full-rpc.bwarelabs.com',
      // url: 'https://matic-mainnet-archive-rpc.bwarelabs.com',
      chainId: 137,
      from: process.env.ETH_ADDRESS_0,
      accounts: [
        process.env.ETH_PK_0,
        process.env.ETH_PK_1,
        process.env.ETH_PK_2,
      ]
    },
    matic_testnet: {
      url: 'https://matic-mumbai.chainstacklabs.com',
      chainId: 80001,
      from: process.env.ETH_ADDRESS_0,
      accounts: [
        process.env.ETH_PK_0,
        process.env.ETH_PK_1,
        process.env.ETH_PK_2,
      ]
    },
    bsc_testnet: {
			url: 'https://data-seed-prebsc-1-s1.binance.org:8545',
			chainId: 97,
			from: process.env.ETH_ADDRESS_0,
			accounts: [
				process.env.ETH_PK_0,
				process.env.ETH_PK_1,
				process.env.ETH_PK_2
			]
		},
		bsc_mainnet: {
			url: 'https://bsc-dataseed2.binance.org/',
			chainId: 56,
			from: process.env.ETH_ADDRESS_0,
			accounts: [
				process.env.ETH_PK_0,
				process.env.ETH_PK_1,
				process.env.ETH_PK_2
			]
		},
		metis_testnet: {
			url: 'https://stardust.metis.io/?owner=588',
			chainId: 588,
			from: process.env.ETH_ADDRESS_0,
			accounts: [
				process.env.ETH_PK_0,
				process.env.ETH_PK_1,
				process.env.ETH_PK_2
			]
		},
  },
  solidity: '0.8.9',
  etherscan: {
    apiKey: {
        polygon: process.env.Polygonscan_API_KEY
    }
  }
};
