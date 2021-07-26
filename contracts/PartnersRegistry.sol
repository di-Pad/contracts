//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "./PartnersAgreement.sol";
import "./IDistributedTown.sol";
import "./ICommunity.sol";

import "skill-wallet/contracts/main/ISkillWallet.sol";

contract PartnersRegistry {

    event PartnersAgreementCreated(
        address partnersAgreementAddress,
        address communityAddress
    );
    IDistributedTown distributedTown;
    address[] agreements;
    address private profitSharingFactory;
    address oracle;
    address linkToken;

    constructor(address _distributedTownAddress, address _profitSharingFactory,
    address _oracle, address _linkToken) public {
        distributedTown = IDistributedTown(_distributedTownAddress);
        profitSharingFactory = _profitSharingFactory;
        oracle = _oracle;
        linkToken = _linkToken;
    }

    function getPartnerAgreementAddresses() public view returns(address[] memory) {
        return agreements;
    }

    function create(
        string memory metadata,
        uint256 template,
        uint256 rolesCount,
        uint256 numberOfActions,
        address partnersContractAddress,
        uint256 membersAllowed
    ) public {
        require(
            template >= 0 && template <= 2,
            "Template should be between 0 and 2"
        );
        require(
            numberOfActions > 0 && numberOfActions <= 100,
            "Number of actions should be between 1 and 100"
        );

        distributedTown.createCommunity(metadata, template, membersAllowed, msg.sender);
        address communityAddress = distributedTown.getCommunityByOwner(
            msg.sender
        );

        if (communityAddress != address(0)) {
            ICommunity community = ICommunity(communityAddress);
            uint256 credits;

            PartnersAgreement agreement = new PartnersAgreement(
                partnersContractAddress,
                msg.sender,
                communityAddress,
                rolesCount,
                numberOfActions,
                profitSharingFactory,
                oracle,
                linkToken
            );
            agreements.push(address(agreement));

            emit PartnersAgreementCreated(address(agreement), communityAddress);
        }
    }
}
