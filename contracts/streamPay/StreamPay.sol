// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "./interfaces/IERC1620.sol";
import "hardhat/console.sol";

contract StreamPay is Context, IERC1620, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint public streamCount = 0;

    struct Stream {
        uint streamId;
        uint deposit;
        uint ratePerSecond;
        uint remainingBalance;
        uint startTime;
        uint stopTime;
        address recipient;
        address sender;
        address tokenAddress;
        bool isEntity;
    }

    mapping(uint => Stream) public streams;

    // for frontend use
    // index start from 1, user2index2streamId[address][0] return lastIndex(length)
    mapping(address => mapping(uint => uint)) public user2index2streamId;
    // streamId2indexes[streamId] return [index of senderStreams, index of recipientStreams]
    mapping(uint => uint[]) internal streamId2indexes;


    modifier onlySenderOrRecipient(uint streamId) {
        require(
            _msgSender() == streams[streamId].sender || _msgSender() == streams[streamId].recipient,
            "StreamPay::onlySenderOrRecipient: fail"
        );
        _;
    }

    modifier streamExists(uint streamId) {
        require(streams[streamId].isEntity, "StreamPay::streamExists: fail");
        _;
    }


    constructor() {
        
    }


    function getStream(uint streamId) external override view
        returns (
            address sender,
            address recipient,
            uint deposit,
            address tokenAddress,
            uint startTime,
            uint stopTime,
            uint remainingBalance,
            uint ratePerSecond
        )
    {
        sender = streams[streamId].sender;
        recipient = streams[streamId].recipient;
        deposit = streams[streamId].deposit;
        tokenAddress = streams[streamId].tokenAddress;
        startTime = streams[streamId].startTime;
        stopTime = streams[streamId].stopTime;
        remainingBalance = streams[streamId].remainingBalance;
        ratePerSecond = streams[streamId].ratePerSecond;
    }


    function getUserStreams(address user, uint startIndex, uint endIndex) public view returns (Stream[] memory result) {
        require(startIndex >= 1, "StreamPay::getUserStreams: startIndex must >= 1");
        require(endIndex >= startIndex, "StreamPay::getUserStreams: endIndex must >= startIndex");

        uint length = endIndex - startIndex + 1;
        Stream[] memory tempArr = new Stream[](length);
        uint i = 0;
        for (i = 0; i<length; i++) {
            uint index = startIndex + i;
            uint streamId = user2index2streamId[user][index];
            Stream memory stream = streams[streamId];
            if (!stream.isEntity) {
                break;
            }
            tempArr[i] = stream;
        }

        if (i == length) {
            result = tempArr;
        } else {
            length = i;
            result = new Stream[](i);
            for (i = 0; i<length; i++) {
                result[i] = tempArr[i];
            }
        }
    }


    function timePassed(uint streamId) public view streamExists(streamId) returns (uint) {
        Stream storage stream = streams[streamId];
        if (block.timestamp <= stream.startTime) return 0;
        if (block.timestamp < stream.stopTime) return block.timestamp - stream.startTime;
        return stream.stopTime - stream.startTime;
    }


    function createStream(address recipient, uint deposit, address tokenAddress, uint startTime, uint stopTime)
        external
        override
        returns (uint)
    {
        return createStreamWithSender(_msgSender(), recipient, deposit, tokenAddress, startTime, stopTime);
    }


    function createStreamWithSender(address sender, address recipient, uint deposit, address tokenAddress, uint startTime, uint stopTime)
        public
        returns (uint)
    {
        require(recipient != address(0), "StreamPay::createStream: stream to the zero address");
        require(recipient != address(this), "StreamPay::createStream: stream to the contract itself");
        require(recipient != sender, "StreamPay::createStream: stream to the sender");
        require(deposit > 0, "StreamPay::createStream: deposit is zero");
        // console.log("StreamPay::createStream", startTime, block.timestamp);
        // require(startTime >= block.timestamp, "StreamPay::createStream: start time should be after block.timestamp");
        require(stopTime > startTime, "StreamPay::createStream: stop time should be after the start time");

        uint duration = stopTime - startTime;

        /* Without this, the rate per second would be zero. */
        require(deposit >= duration, "StreamPay::createStream: deposit should be larger than timePassed");

        /* This condition avoids dealing with remainders */
        require(deposit % duration == 0, "StreamPay::createStream: deposit should be multiple of duration");

        uint ratePerSecond = deposit / duration;

        /* Create and store the stream object. */
        uint streamId = ++streamCount;
        streams[streamId] = Stream(
            streamId,
            deposit,
            ratePerSecond,
            deposit,
            startTime,
            stopTime,
            recipient,
            sender,
            tokenAddress,
            true
        );

        uint count1 = user2index2streamId[sender][0];
        user2index2streamId[sender][++count1] = streamId;
        user2index2streamId[sender][0] = count1;

        uint count2 = user2index2streamId[recipient][0];
        user2index2streamId[recipient][++count2] = streamId;
        user2index2streamId[recipient][0] = count2;

        streamId2indexes[streamId] = [count1, count2];

        IERC20(tokenAddress).safeTransferFrom(sender, address(this), deposit);
        emit CreateStream(streamId, sender, recipient, deposit, tokenAddress, startTime, stopTime);
        return streamId;
    }


    function balanceOf(uint streamId, address who) public override view streamExists(streamId) returns (uint balance) {
        Stream memory stream = streams[streamId];

        uint delta = timePassed(streamId);
        uint recipientBalance = delta * stream.ratePerSecond;

        /*
         * If the stream `balance` does not equal `deposit`, it means there have been withdrawals.
         * We have to subtract the total amount withdrawn from the amount of money that has been
         * streamed until now.
         */
        if (stream.deposit > stream.remainingBalance) {
            uint withdrawalAmount = stream.deposit - stream.remainingBalance;
            recipientBalance -= withdrawalAmount;
            /* `withdrawalAmount` cannot and should not be bigger than `recipientBalance`. */
        }

        if (who == stream.recipient) return recipientBalance;
        if (who == stream.sender) {
            uint senderBalance = stream.remainingBalance - recipientBalance;
            /* `recipientBalance` cannot and should not be bigger than `remainingBalance`. */
            return senderBalance;
        }
        return 0;
    }


    function withdrawFromStream(uint streamId, uint amount)
        external
        override
        nonReentrant
        streamExists(streamId)
        onlySenderOrRecipient(streamId)
        returns (bool success)
    {
        require(amount > 0, "StreamPay::withdrawFromStream: amount is zero");
        Stream storage stream = streams[streamId];

        uint balance = balanceOf(streamId, stream.recipient);
        require(balance >= amount, "StreamPay::withdrawFromStream: amount exceeds the available balance");

        stream.remainingBalance -= amount;

        if (stream.remainingBalance == 0) {
            uint[] memory indexes = streamId2indexes[streamId];

            // delete
            uint lastIndex = user2index2streamId[stream.sender][0];
            user2index2streamId[stream.sender][indexes[0]] = user2index2streamId[stream.sender][lastIndex];
            delete user2index2streamId[stream.sender][lastIndex];
            user2index2streamId[stream.sender][0] = --lastIndex;

            lastIndex = user2index2streamId[stream.recipient][0];
            user2index2streamId[stream.recipient][indexes[1]] = user2index2streamId[stream.recipient][lastIndex];
            delete user2index2streamId[stream.recipient][lastIndex];
            user2index2streamId[stream.recipient][0] = --lastIndex;

            delete streamId2indexes[streamId];

            delete streams[streamId];
            // end delete
        }

        IERC20(stream.tokenAddress).safeTransfer(stream.recipient, amount);
        emit WithdrawFromStream(streamId, stream.recipient, amount);
        return true;
    }


    function cancelStream(uint streamId)
        external
        override
        nonReentrant
        streamExists(streamId)
        onlySenderOrRecipient(streamId)
        returns (bool success)
    {
        Stream memory stream = streams[streamId];
        uint senderBalance = balanceOf(streamId, stream.sender);
        uint recipientBalance = balanceOf(streamId, stream.recipient);

        // delete
        uint[] memory indexes = streamId2indexes[streamId];

        uint lastIndex = user2index2streamId[stream.sender][0];
        user2index2streamId[stream.sender][indexes[0]] = user2index2streamId[stream.sender][lastIndex];
        delete user2index2streamId[stream.sender][lastIndex];
        user2index2streamId[stream.sender][0] = --lastIndex;

        lastIndex = user2index2streamId[stream.recipient][0];
        user2index2streamId[stream.recipient][indexes[1]] = user2index2streamId[stream.recipient][lastIndex];
        delete user2index2streamId[stream.recipient][lastIndex];
        user2index2streamId[stream.recipient][0] = --lastIndex;

        delete streamId2indexes[streamId];

        delete streams[streamId];
        // end delete

        IERC20 token = IERC20(stream.tokenAddress);
        if (recipientBalance > 0) token.safeTransfer(stream.recipient, recipientBalance);
        if (senderBalance > 0) token.safeTransfer(stream.sender, senderBalance);

        emit CancelStream(streamId, stream.sender, stream.recipient, senderBalance, recipientBalance);
        return true;
    }
}