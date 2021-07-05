//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "skill-wallet/contracts/main/ISkillWallet.sol";

import "./Treasury.sol";
import "./InteractionNFT.sol";
import "./ICommunity.sol";
import "./IDistributedTown.sol";

contract PartnersAgreement is ChainlinkClient {
    address public partnersContract;
    address owner;
    address public communityAddress;
    uint lastBlockQueried;

    // Chainlink params
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    mapping(address => uint) lastBlockPerUserAddress;
    mapping(bytes32 => address) userRequests;

    Treasury treasury;
    InteractionNFT partnersInteractionNFTContract;

    struct UserInteractions {
        address userAddress;
        uint transactionsCount;
    }

    constructor(
        address _distributedTownAddress,
        address _partnersContract,
        address _owner,
        address _communityAddress,
        uint _rolesCount,
        uint _numberOfActions
    ) public {
        lastBlockQueried = 0;

        partnersContract = _partnersContract;
        partnersInteractionNFTContract = new InteractionNFT(_rolesCount, _numberOfActions);
        owner = _owner;
        communityAddress = _communityAddress;
        treasury = new Treasury();
        
        setChainlinkToken(address(0));
        oracle = address(0);
        jobId = "31061086cb2749f7a3f99f2d5179caf7";
        fee = 0.1 * 10**18; // 0.1 LINK
    }

    function getAllMembers() public returns (address[] memory) {
        // TODO - add getMembers function in community.
        ICommunity community = ICommunity(communityAddress);
        ISkillWallet skillWallet = ISkillWallet(community.getSkillWalletAddress());
        uint[] memory members = community.getMembers();
        address[] memory result;

        for(uint index = 0; index < members.length; index ++ ) {
            result[index] = skillWallet.ownerOf(members[index]);
        }
        return result;
    }

    function getInteractions(
        address userAddress
    ) public {
        require(
            userAddress != address(0),
            "No user address passed!"
        );

        Chainlink.Request memory req =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.transferInteractionNFTs.selector
            );
        req.add("userAddress",string(abi.encodePacked(userAddress)) );
        req.add("contractAddress", string(abi.encodePacked(partnersContract)));
        req.add("chainId", "80001");
        req.addUint("startBlock", lastBlockPerUserAddress[userAddress]);
        req.add("covalentAPIKey", "ckey_aae01fa51e024af3a2634d9d030");

        bytes32 reqId = sendChainlinkRequestTo(oracle, req, fee);

        lastBlockPerUserAddress[userAddress] = block.number;
        userRequests[reqId] = userAddress;

    }

    function transferInteractionNFTs(bytes32 _requestId, uint _result)
        public
        recordChainlinkFulfillment(_requestId)
    {
        require(userRequests[_requestId] != address(0), "req not found");
        ICommunity community = ICommunity(communityAddress);
        require(community.isMember(userRequests[_requestId]), "Invalid user address");
        ISkillWallet skillWallet = ISkillWallet(community.getSkillWalletAddress());
        uint skillWalletId = skillWallet.getSkillWalletIdByOwner(userRequests[_requestId]);
        Types.SkillSet memory skillSet = skillWallet.getSkillSet(skillWalletId);
        partnersInteractionNFTContract.safeTransferFrom(address(this), userRequests[_requestId], skillSet.skill1.level, _result, "");
    }
}
