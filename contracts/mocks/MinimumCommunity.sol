//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "../ICommunity.sol";
import "skill-wallet/contracts/main/ISkillWallet.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

contract MinimumCommunity is ICommunity {
    address private skillWalletAddress;
    uint256[] members;
    mapping(address => bool) public override isMember;
 
    constructor(address _skillWalletAddress) public {
        skillWalletAddress = _skillWalletAddress;
    }

    function getMembers() public view override returns (uint256[] memory) {
        uint256[] memory members;
        return members;
    }

    function getSkillWalletAddress() public view override returns (address) {
        return skillWalletAddress;
    }

    function getMemberAddresses()
        public
        view
        override
        returns (address[] memory)
    {
        address[] memory members;
        return members;
    }

    function joinNewMember(
        uint64 displayStringId1,
        uint8 level1,
        uint64 displayStringId2,
        uint8 level2,
        uint64 displayStringId3,
        uint8 level3,
        string memory uri,
        uint256 credits
    ) public override {
        isMember[msg.sender] = true;
    }
}
