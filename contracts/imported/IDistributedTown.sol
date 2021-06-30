//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

interface IDistributedTown is IERC1155 {
    event CommunityCreated(
        address communityContract,
        uint256 communityId,
        uint256 template,
        address indexed creator
    );

    function createCommunity(
        string memory communityMetadata,
        uint256 template
    ) external;

    function getCommunities() external view returns (address[] memory);

    function deployGenesisCommunities(uint256 template) external;
    function getCommunityByOwner(address owner) external view returns(address);

}
