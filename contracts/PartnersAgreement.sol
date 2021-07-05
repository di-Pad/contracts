//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "./ISkillWallet.sol";

import "./TokenDistribution.sol";
import "./InteractionNFT.sol";
import "./IDistributedTown.sol";
import "./SupportedTokens.sol";
import "./ProfitSharing.sol";

contract PartnersAgreement {
    address partnersContract;
    address partnersInteractionNFTContract;
    address owner;
    address communityAddress;
    address supportedTokens;
    uint256 rolesCount;
    TokenDistribution treasury;
    address public profitSharing;

    constructor(
        address _distributedTownAddress,
        address _partnersContract,
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
        supportedTokens = address (new SupportedTokens(true));
        rolesCount = _rolesCount;
    }

    function deployProfitSharing(uint256 _sharedProfit) public {
        profitSharing = address(new ProfitSharing(owner, _sharedProfit, rolesCount, supportedTokens));
    }
}
