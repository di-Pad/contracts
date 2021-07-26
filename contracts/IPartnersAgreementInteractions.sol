//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

interface IPartnersAgreementInteractions {   
    function getAllMembers() external view returns (address[] memory);

    function getInteractionNFT(address user) external view returns(uint);
}
