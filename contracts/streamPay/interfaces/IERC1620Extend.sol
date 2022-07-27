// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "./IERC1620.sol";

interface IERC1620Extend is IERC1620 {
    function depositToStream(uint256 streamId, uint256 amount) external returns (bool success);
}
