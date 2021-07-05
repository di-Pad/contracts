//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import "./ProfitSharing.sol";

contract ProfitSharingFactory {
    function depolyProfitSharing(address _partner, uint256 _sharedProfit, uint256 _rolesCount, address _supportedTokens) public returns (address) {
        return address(new ProfitSharing(_partner, _sharedProfit, _rolesCount, _supportedTokens));
    }
}