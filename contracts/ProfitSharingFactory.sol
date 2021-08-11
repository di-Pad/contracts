//SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.8.0;

import "./ProfitSharing.sol";
import "./IPartnersAgreementData.sol";

contract ProfitSharingFactory {
    event ProfitSharingDeployed(
        address _profitSharing,
        address _deployedBy,
        address _partnersAgreement,
        address _partner, 
        uint256 _sharedProfit, 
        uint256 _rolesCount, 
        address _supportedTokens
    );

    function deployProfitSharing(address _partnersAgreement, uint256 _sharedProfit, address _supportedTokens) public returns (address) {
        IPartnersAgreementData partnersAgreementData = IPartnersAgreementData(_partnersAgreement);
        require (partnersAgreementData.profitSharing() == address(0), "PA already has profit sharing");

        address partner = partnersAgreementData.owner();
        uint256 rolesCount = partnersAgreementData.rolesCount();
        
        address newProfitSharing = address(new ProfitSharing(_partnersAgreement, partner, _sharedProfit, rolesCount, _supportedTokens));

        emit ProfitSharingDeployed(newProfitSharing, msg.sender, _partnersAgreement, partner, _sharedProfit, rolesCount, _supportedTokens);

        return newProfitSharing;
    }
}