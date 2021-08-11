//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "skill-wallet/contracts/main/ISkillWallet.sol";
import "skill-wallet/contracts/main/SkillWallet.sol";

import "./InteractionNFT.sol";
//import "./SupportedTokens.sol";
import "./ICommunity.sol";
import "./IProfitSharingInteractions.sol";

contract PartnersAgreement is ChainlinkClient {
    address public owner;
    address public communityAddress;
    address public partnersContract;
    //address supportedTokens;
    uint256 public rolesCount;
    address public profitSharing;

    mapping(address => uint) lastBlockPerUserAddress;
    mapping(bytes32 => address) userRequests;

    //TokenDistribution treasury;
    InteractionNFT partnersInteractionNFTContract;


    // Chainlink params
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    constructor(
        address _partnersContract,
        address _owner,
        address _communityAddress,
        uint _rolesCount,
        uint _numberOfActions,
        address _oracle,
        address _chainlinkToken
    ) public {
        require(_rolesCount == 2 || _rolesCount == 3, "Only 2 or 3 roles accepted");
        rolesCount = _rolesCount;
        partnersContract = _partnersContract;
        partnersInteractionNFTContract = new InteractionNFT(_rolesCount, _numberOfActions);
        owner = _owner;
        communityAddress = _communityAddress;
        
        setChainlinkToken(_chainlinkToken);
        oracle = _oracle;
        jobId = "e1e26fa27aa7436c95a78a40c21f5404";
        fee = 0.1 * 10**18; // 0.1 LINK
    }

    function getInteractionNFTContractAddress() public view returns(address) {
        return address(partnersInteractionNFTContract);
    }
    
    function getAllMembers() public view returns (address[] memory) {
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

    function queryForNewInteractions(
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
        address user = userRequests[_requestId];

        require(user != address(0), "req not found");
        ICommunity community = ICommunity(communityAddress);
        require(community.isMember(user), "Invalid user address");
        partnersInteractionNFTContract.safeTransferFrom(
            address(this), 
            user, 
            uint256(partnersInteractionNFTContract.userRoles(user)), 
            _result, 
            ""
        );
        //TODO: maybe add record interactions!
        if (profitSharing != address(0)) {
            IProfitSharingInteractions(profitSharing).recordInteraction(user, _result);
        }
    }

    function getInteractionNFT(address user) public view returns(uint) {
        return partnersInteractionNFTContract.getActiveInteractions(user);
    }

    function setProfitSharing(address _profitSharing) public {
        require (profitSharing == address(0), "profit sharing already set");
        require (_profitSharing != address(0), "profit sharing address is 0");

        profitSharing = _profitSharing;
    }

    function getUserRole(address _user) public view returns (uint256) {
        return uint256(partnersInteractionNFTContract.userRoles(_user));
    }
}
