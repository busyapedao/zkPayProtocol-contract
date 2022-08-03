//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./verifier.sol";
import "hardhat/console.sol";

contract PasswordService is Ownable {
    Verifier verifier = new Verifier();

    event SetZKhash(uint indexed zkhash, address indexed user);

    event Verified(uint indexed zkhash, address indexed user);

    mapping(address => uint) public zkhashOf;

    mapping(uint => bool) internal usedProofs;

    uint public fee = 0.1 ether;

    constructor() {}

    function setFee(uint newFee) public onlyOwner {
        fee = newFee;
    }

    function resetPassword(
        uint[8] memory proof1,
        uint expiration1,
        uint allhash1,
        uint[8] memory proof2,
        uint zkhash2,
        uint expiration2,
        uint allhash2
    ) public payable returns (bool) {
        bool success = true;
        uint zkhash1 = zkhashOf[_msgSender()];
        
        if (zkhash1 != 0) {
            // check old zkhash
            if (!verify(_msgSender(), proof1, 0, expiration1, allhash1)) {
                success = false;
            }
            // check new zkhash
            if (!verify(_msgSender(), proof2, 0, expiration2, allhash2)) {
                success = false;
            }
        } else {
            // create
            if (block.timestamp > expiration2) {
                success = false;
            } else if (usedProofs[proof2[0]]) {
                success = false;
            } else if (!verifyProof(proof2, zkhash2, 0, expiration2, allhash2)) {
                success = false;
            } else {
                usedProofs[proof2[0]] = true;
                emit Verified(proof2[0], _msgSender());
            }
        }
        
        if (msg.value < fee) {
            success = false;
        }

        if (success) {
            zkhashOf[_msgSender()] = zkhash2;
            payable(owner()).transfer(msg.value);
            emit SetZKhash(zkhash2, _msgSender());
        }
        return success;
    }

    function verify(
        address user,
        uint[8] memory proof,
        uint datahash,
        uint expiration,
        uint allhash
    ) public returns (bool) {
        uint zkhash = zkhashOf[user];

        if (block.timestamp > expiration) {
            console.log("[PasswordService][verify] expiration", block.timestamp, expiration);
            return false;
        }

        if (usedProofs[proof[0]]) {
            console.log("[PasswordService][verify] proof used");
            return false;
        }

        if (!verifyProof(proof, zkhash, datahash, expiration, allhash)) {
            console.log("[PasswordService][verify] verifyProof fail", zkhash, datahash);
            return false;
        }

        usedProofs[proof[0]] = true;
        emit Verified(proof[0], _msgSender());

        return true;
    }

    /////////// util ////////////

    function verifyProof(
        uint[8] memory proof,
        uint zkhash,
        uint datahash,
        uint expiration,
        uint allhash
    ) internal view returns (bool) {
        return
            verifier.verifyProof(
                [proof[0], proof[1]],
                [[proof[2], proof[3]], [proof[4], proof[5]]],
                [proof[6], proof[7]],
                [zkhash, datahash, expiration, block.chainid, allhash]
            );
    }
}
