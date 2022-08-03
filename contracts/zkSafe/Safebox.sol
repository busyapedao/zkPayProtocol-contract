// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "../pws/PasswordService.sol";
import "./SafeboxFactory.sol";
import "hardhat/console.sol";

contract Safebox is Context {
    using SafeERC20 for IERC20;

    PasswordService public pws;

    event WithdrawERC20(address indexed tokenAddr, uint amount);

    event WithdrawERC721(address indexed tokenAddr, uint tokenId);

    event WithdrawETH(uint tokenId);

    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );

    address public factory;

    address private _owner;

    bool isInit;

    constructor() {}

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    function init(address newOwner) external {
        require(!isInit, "function forbidden");
        isInit = true;
        factory = _msgSender();
        pws = SafeboxFactory(factory).pws();
        _transferOwnership(newOwner);
    }

    function transferOwnership(
        uint[8] memory proof,
        address newOwner,
        uint expiration,
        uint allhash
    ) external payable onlyOwner {
        require(
            newOwner != address(0),
            "Ownable: new owner is the zero address"
        );

        uint datahash = uint(uint160(newOwner));
        bool success = pws.verify(
            owner(),
            proof,
            datahash,
            expiration,
            allhash
        );
        require(success, "Safebox::transferOwnership: verify fail");

        SafeboxFactory(factory).changeSafeboxOwner{value: msg.value}(
            owner(),
            newOwner
        );

        _transferOwnership(newOwner);
    }

    function withdrawETH(
        uint[8] memory proof,
        uint amount,
        uint expiration,
        uint allhash
    ) external onlyOwner {
        //must be 254b, not 256b
        uint datahash = uint(keccak256(abi.encodePacked(amount))) / 100;
        bool success = pws.verify(
            owner(),
            proof,
            datahash,
            expiration,
            allhash
        );
        require(success, "Safebox::withdrawETH: verify fail");

        payable(owner()).transfer(amount);

        emit WithdrawETH(amount);
    }

    function withdrawERC20(
        uint[8] memory proof,
        address tokenAddr,
        uint amount,
        uint expiration,
        uint allhash
    ) external onlyOwner {
        //must be 254b, not 256b
        uint datahash = uint(keccak256(abi.encodePacked(tokenAddr, amount))) /
            100;
        bool success = pws.verify(
            owner(),
            proof,
            datahash,
            expiration,
            allhash
        );
        require(success, "Safebox::withdrawERC20: verify fail");

        IERC20(tokenAddr).safeTransfer(owner(), amount);

        emit WithdrawERC20(tokenAddr, amount);
    }

    function withdrawERC721(
        uint[8] memory proof,
        address tokenAddr,
        uint tokenId,
        uint expiration,
        uint allhash
    ) external onlyOwner {
        //must be 254b, not 256b
        uint datahash = uint(keccak256(abi.encodePacked(tokenAddr, tokenId))) /
            100;
        bool success = pws.verify(
            owner(),
            proof,
            datahash,
            expiration,
            allhash
        );
        require(success, "Safebox::withdrawERC721: verify fail");

        IERC721(tokenAddr).transferFrom(address(this), owner(), tokenId);

        emit WithdrawERC721(tokenAddr, tokenId);
    }
}
