//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./ISkillWallet.sol";

import "./TokenDistribution.sol";
import "./InteractionNFT.sol";
import "./IDistributedTown.sol";

contract PartnersAgreement {
    address partnersContract;
    address partnersInteractionNFTContract;
    address owner;
    address communityAddress;
    TokenDistribution treasury;

    constructor(
        address _distributedTownAddress,
        address _partnersContract,
        address _distributedToken,
        address _owner,
        address _communityAddress,
        uint _rolesCount,
        uint _numberOfActions
    ) public {
        require(_rolesCount == 2 || _rolesCount == 3, "Only 2 or 3 roles accepted");
        partnersContract = _partnersContract;
        partnersInteractionNFTContract = address(
            new InteractionNFT(_rolesCount, _numberOfActions)
        );
        owner = _owner;
        communityAddress = _communityAddress;
        treasury = new TokenDistribution(_distributedToken, _rolesCount, "");
    }
}
