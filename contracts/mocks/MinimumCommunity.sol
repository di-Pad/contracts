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
    uint[] members;
    constructor(address _skillWalletAddress) public {
        skillWalletAddress = _skillWalletAddress;
    }

    function isMember(address member) public view override returns(bool) {
        return true;
    }

    function getMembers() public view override returns (uint[] memory) {
        uint[] memory members;
        return members;
    }

    function getSkillWalletAddress() public view override returns(address) {
        return skillWalletAddress;
    }

    function getMemberAddresses() public view override returns(address[] memory) {
        address[] memory members;
        return members;
    }
}
