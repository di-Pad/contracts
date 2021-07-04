//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

/**
 * @title DistributedTown Community
 *
 * @dev Implementation of the Community concept in the scope of the DistributedTown project
 * @author DistributedTown
 */

interface ICommunity {
    event MemberAdded(
        address indexed _member,
        uint256 _skillWalletTokenId,
        uint256 _transferredTokens
    );
    event MemberLeft(address indexed _member);

    // check if it's called only from deployer.
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

    function join(uint256 skillWalletTokenId, uint256 credits) external;

    function leave(address memberAddress) external;

    function getMembers() external view returns (uint256[] memory);

    // TODO: check called only by milestones!
    function transferToCommunity(address from, uint256 amount) external;

    function getTokenId() external view returns (uint256);

    function getTemplate() external view returns (uint256);

    function getTreasuryBalance() external view returns (uint256);

    function getProjects() external view returns (uint256[] memory);

    // Called only by project (or create project from Community.sol (better))
    function addProjectId(uint256 projectId) external;

    function getProjectTreasuryAddress(uint256 projectId)
        external
        view
        returns (address);

    function balanceOf(address member) external view returns (uint256);

    function transferCredits(address to, uint256 amount) external;

    function getSkillWalletAddress() external returns(address);
}
