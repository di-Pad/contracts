//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import "./ProfitSharing.sol";

contract ProfitSharingFactory {
    event ProfitSharingDeployed(
        address _profitSharing,
        address _deployedBy,
        address _partner, 
        uint256 _sharedProfit, 
        uint256 _rolesCount, 
        address _supportedTokens
    );

    function deployProfitSharing(address _partner, uint256 _sharedProfit, uint256 _rolesCount, address _supportedTokens) public returns (address) {
        address newProfitSharing = address(new ProfitSharing(msg.sender, _partner, _sharedProfit, _rolesCount, _supportedTokens));

        emit ProfitSharingDeployed(newProfitSharing, msg.sender, _partner, _sharedProfit, _rolesCount, _supportedTokens);

        return newProfitSharing;
    }
}