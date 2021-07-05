//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

interface IProfitSharingFactory {
    function deployProfitSharing(address _partner, uint256 _sharedProfit, uint256 _rolesCount, address _supportedTokens) external returns (address);
}