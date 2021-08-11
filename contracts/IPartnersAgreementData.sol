//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

interface IPartnersAgreementData {
    function owner() external view returns (address);
    function communityAddress() external view returns (address);
    function partnersContract() external view returns (address);
    function rolesCount() external view returns (uint256);
    function profitSharing() external view returns (address);

    function setProfitSharing(address _profitSharing) external;
}