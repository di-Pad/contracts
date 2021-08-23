//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

interface ICommunity {

    function isMember(address memberAddress) external view returns(bool);
    
    function getMembers() external view returns (uint256[] memory);
    
    function getMemberAddresses() external view returns (address[] memory);
    
    function  getSkillWalletAddress() external view returns (address);
    
    function joinNewMember(
        uint64 displayStringId1,
        uint8 level1,
        uint64 displayStringId2,
        uint8 level2,
        uint64 displayStringId3,
        uint8 level3,
        string memory uri,
        uint256 credits
    ) external; 
}
