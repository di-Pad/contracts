//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "distributed-town-smart-contracts/contracts/IDistributedTown.sol";
import "distributed-town-smart-contracts/contracts/community/ICommunity.sol";
import "skill-wallet/contracts/main/ISkillWallet.sol";

import "./PartnersAgreement.sol";

contract PartnersRegistry {

    IDistributedTown distributedTown;
    address[] agreements;

    constructor(address distributedTownAddress) public {
        distributedTown = IDistributedTown(distributedTownAddress);
    }

    function create(
        string memory metadata,
        uint template,
        uint rolesCount,
        uint numberOfActions,
        address partnersContractAddress
    ) public {
        require(
            template >= 0 && template <= 2,
            "Template should be between 0 and 2"
        );
        require(
            numberOfActions > 0 && template <= 100,
            "Number of actions should be between 1 and 100"
        );

        distributedTown.createCommunity(metadata, template);
        address communityAddress = distributedTown.getCommunityByOwner(
            msg.sender
        );

        if (communityAddress != address(0)) {

            ICommunity community = ICommunity(communityAddress);
            uint credits;

            PartnersAgreement agreement = new PartnersAgreement(
                address(distributedTown),
                partnersContractAddress,
                msg.sender,
                communityAddress,
                rolesCount,
                numberOfActions
            );
            agreements.push(address(agreement));
        }
    }
}
