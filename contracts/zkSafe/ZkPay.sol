// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./Safebox.sol";
import "hardhat/console.sol";

contract ZkPay {

    mapping(address => address) public getSafeboxAddr;


    constructor() {}


    function createSafebox(
        uint[8] memory proof,
        uint boxhash
    ) external returns (address) {

        require(getSafeboxAddr[msg.sender] == address(0), 'ZkPay::createSafebox: EXISTS'); // single check is sufficient

        bytes32 salt = bytes32(bytes20(msg.sender));
        Safebox box = new Safebox{salt: salt}();
        box.initialize(msg.sender, proof, boxhash);

        getSafeboxAddr[msg.sender] = address(box);

        return address(box);
    }


    function calcSafeboxAddr(address user) external view returns (address) {
        bytes32 salt = bytes32(bytes20(user));
        address predictedAddress = address(uint160(uint(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(
                type(Safebox).creationCode
            )
        )))));

        return predictedAddress;
    }

}