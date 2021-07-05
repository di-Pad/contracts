//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

interface ISupportedTokens {
    function supportedTokens(uint256) external view returns (address);

    function isTokenSupported(address) external view returns (bool);

    function getSupportedTokensCount() external view returns (uint256);
}