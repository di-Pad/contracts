//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "distributed-town-smart-contracts/contracts/IDistributedTown.sol";
import "skill-wallet/contracts/main/ISkillWallet.sol";
import "./InteractionNFT.sol"; 

import "@openzeppelin/contracts/utils/Counters.sol";

contract PartnersRegistry {
    using Counters for Counters.Counter;
    
    IDistributedTown distributedTown;
    mapping(uint => address) partnerCommunity;
    mapping(uint => address) partnersContract;
    mapping(uint => address) partnersInteractionNFTContract;
    mapping(address => uint) partnersAgreementOwner;
    Counters.Counter partnerIds;

    constructor(address distributedTownAddress) public {
        distributedTown = IDistributedTown(distributedTownAddress);
    }

    // Should have SW created and activated!
    function create(
        string memory metadata,
        uint template,
        uint rolesCount,
        uint numberOfActions,
        address partnersContractAddress
    ) public { 
        require(template >= 0 && template <= 2, "Template should be between 0 and 2");
        require(numberOfActions > 0 && template <= 100, "Number of actions should be between 1 and 100");
        
        // It'll fail in case the SW of msg.sender is not activated yet.
        distributedTown.createCommunity(metadata, template);
        address communityAddress = distributedTown.getCommunityByOwner(msg.sender);

        uint partnerId = partnerIds.current();
        if(communityAddress != address(0)) {
            
            if(partnersContractAddress != address(0))
                partnersContract[partnerId] = partnersContractAddress;

            partnerCommunity[partnerId] = communityAddress;
            partnersInteractionNFTContract[partnerId] = address(new InteractionNFT(rolesCount, numberOfActions));
            partnersAgreementOwner[msg.sender] = partnerId;
            partnerIds.increment();
        }
    }
}