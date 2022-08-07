<div align="center"><img src="./doc/zkSafe-logo.svg"></div>
<br>
<br>


## Ethereum Password Service
#### EPS contract binding password hash to wallet address.
<br>
<div align="center"><img src="./doc/eps.png"></div>
<br>

### How it works
<p>User input password to EPS ZK Circuit (running at frontend), it output hash + proof, it proving that the hash is generate from the password, EPS contract can verify it, if the hash equals the one binging in EPS contract, that means the user input the right password.</p>

<p>Advanced, used proofs is recorded in EPS contract, to avoid Double Spent.<br>
And, datahash\expiration\chainId are added to ZK Circuit, make (ZK) Password to sign data as PrivateKey.</p>
<br>
<br>

## Safebox
#### If privatekey is stolen, Safebox is still safe.
<br>
<div align="center"><img src="./doc/safebox.png"></div>
<br>

### How it works
<p>Safebox is a Smart Contract Wallet, deployed by user. </p>
<p>User holds Wallet, Wallet holds Safebox, Safebox holds Assets.</p>
<p>Withdraw from Safebox need the ZK Password.<br>
The withdraw to-address must be Safebox's owner.<br>
The caller must be Safebox's owner.</p>
<br>
<br>

## FAQ
<ul>
<li>Where is the password store?
<p>In your mind.</p>
</li>
<li>If the project fail or be hacked, is my Safebox safe?
<p>Yes, the Safebox is Smart Contract Wallet, you're the only owner of the contract, it's running forever and no one can control it except you.</p>
</li>
</ul>
<br>
<br>

## Hackthon & Grant
#### 2022 BNBChain Hackthon 1st at DAO Track <a href="https://dorahacks.io/bnb/1/top">zkPayroll</a>
#### 2022 ETHShanghai Hackathon Sponser Track Winner <a href="https://gitcoin.co/hackathon/ethshanghai/projects/?org=abridged">zkSafebox</a>