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
}
