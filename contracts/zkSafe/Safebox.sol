// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./verifier.sol";
import "hardhat/console.sol";

contract Safebox is Ownable {

    using SafeERC20 for IERC20;

    event SetBoxhash(
        uint indexed boxhash
    );
  
    event Withdraw(
        address indexed to,
        address indexed tokenAddr,
        uint amount
    );

    event Call(
        address indexed contractAddr,
        bytes sigData,
        bytes returnData
    );

    Verifier verifier = new Verifier();

    uint public boxhash;

    address public factory;

    mapping(uint => bool) internal usedProof;


    constructor() {
        factory = msg.sender;
    }


    // called once by the factory at time of deployment
    function initialize(
        address initOwner, 
        uint[8] memory proof,
        uint newBoxhash
    ) external {
        require(msg.sender == factory, 'Safebox::initialize: FORBIDDEN'); // sufficient check

        require(!usedProof[proof[0]], "Safebox::initialize: proof used");
        require(verifyProof(proof, newBoxhash), "Safebox::initialize: verifyProof fail");

        usedProof[proof[0]] = true;

        boxhash = newBoxhash;

        emit SetBoxhash(newBoxhash);

        _transferOwnership(initOwner);
    }


    function setBoxhash(
        uint[8] memory proof1,
        uint[8] memory proof2,
        uint newBoxhash
    ) public onlyOwner {

        if (boxhash != 0) { 
            // check old boxhash 
            require(!usedProof[proof1[0]], "Safebox::setBoxhash: proof1 used");
            require(verifyProof(proof1, boxhash), "Safebox::setBoxhash: verifyProof1 fail");

            usedProof[proof1[0]] = true;
        }

        require(!usedProof[proof2[0]], "Safebox::setBoxhash: proof2 used");
        require(verifyProof(proof2, newBoxhash), "Safebox::setBoxhash: verifyProof2 fail");

        usedProof[proof2[0]] = true;

        boxhash = newBoxhash;

        emit SetBoxhash(newBoxhash);
    }


    function call(
        uint[8] memory proof,
        address contractAddr,
        bytes calldata sigData
    ) public onlyOwner {
        require(!usedProof[proof[0]], "Safebox::call: proof used");
        require(verifyProof(proof, boxhash), "Safebox::call: verifyProof fail");

        usedProof[proof[0]] = true;

        (bool success, bytes memory returnData) = contractAddr.call(sigData);
        require(success, "Safebox::call: call fail");

        emit Call(contractAddr, sigData, returnData);
    }
    

    function batchCall(
        uint[8] memory proof,
        address[] calldata contractAddrArr,
        bytes[] calldata sigDataArr
    ) public onlyOwner {
        require(contractAddrArr.length == sigDataArr.length, "Safebox::batchCall: params error");
        require(!usedProof[proof[0]], "Safebox::batchCall: proof used");
        require(verifyProof(proof, boxhash), "Safebox::batchCall: verifyProof fail");

        usedProof[proof[0]] = true;

        for (uint i=0; i<contractAddrArr.length; i++) {
            address contractAddr = contractAddrArr[i];
            bytes memory sigData = sigDataArr[i];
            (bool success, bytes memory returnData) = contractAddr.call(sigData);
            require(success, "Safebox::call: call fail");
            emit Call(contractAddr, sigData, returnData);
        }
    }



    /////////// util ////////////

    function verifyProof(
        uint[8] memory proof,
        uint _boxhash
    ) internal view returns (bool) {
        return verifier.verifyProof(
            [proof[0], proof[1]],
            [[proof[2], proof[3]], [proof[4], proof[5]]],
            [proof[6], proof[7]],
            [_boxhash]
        );
    }

}