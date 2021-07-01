//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "skill-wallet/contracts/main/ISkillWallet.sol";
import "distributed-town-smart-contracts/contracts/IDistributedTown.sol";

import "./Treasury.sol";
import "./InteractionNFT.sol";

contract PartnersAgreement {
    address partnersContract;
    address partnersInteractionNFTContract;
    address owner;
    address communityAddress;
    Treasury treasury;

    constructor(
        address _distributedTownAddress,
        address _partnersContract,
        address _owner,
        address _communityAddress,
        uint _rolesCount,
        uint _numberOfActions
    ) public {
        partnersContract = _partnersContract;
        partnersInteractionNFTContract = address(
            new InteractionNFT(_rolesCount, _numberOfActions)
        );
        owner = _owner;
        communityAddress = _communityAddress;
        treasury = new Treasury();
    }
}
