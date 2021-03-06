//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@chainlink/contracts/src/v0.6/ChainlinkClient.sol";
import "skill-wallet/contracts/main/ISkillWallet.sol";
import "skill-wallet/contracts/main/SkillWallet.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

import "./InteractionNFT.sol";
//import "./SupportedTokens.sol";
import "./ICommunity.sol";
import "./IProfitSharingInteractions.sol";

contract PartnersAgreement is ChainlinkClient {
    address public owner;
    address public communityAddress;
    address[] public partnersContracts;
    //address supportedTokens;
    uint256 public rolesCount;
    address public profitSharing;
    bool public isActive;

    mapping(address => uint256) lastBlockPerUserAddress;
    mapping(bytes32 => address) userRequests;

    //TokenDistribution treasury;
    InteractionNFT partnersInteractionNFTContract;

    // Chainlink params
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    /**
     * @dev Throws PA not yet activated.
     */
    modifier onlyActive() {
        require(isActive, "PA: not yet activated");
        _;
    }

    constructor(
        address _partnersContract,
        address _owner,
        address _communityAddress,
        uint256 _rolesCount,
        uint256 _numberOfActions,
        address _oracle,
        address _chainlinkToken
    ) public {
        require(
            _rolesCount == 2 || _rolesCount == 3,
            "Only 2 or 3 roles accepted"
        );
        rolesCount = _rolesCount;
        partnersContracts.push(_partnersContract);
        partnersInteractionNFTContract = new InteractionNFT(
            _rolesCount,
            _numberOfActions
        );
        owner = _owner;
        communityAddress = _communityAddress;

        setChainlinkToken(_chainlinkToken);
        oracle = _oracle;
        jobId = "e1e26fa27aa7436c95a78a40c21f5404";
        fee = 0.1 * 10**18; // 0.1 LINK
        isActive = false;
    }

    function activatePA() public {
        require(!isActive, 'PA already activated');
        bool isMember = ICommunity(communityAddress).isMember(owner);
        require(isMember, 'Owner not yet a member of the community.');
        isActive = true;
    }

    function getInteractionNFTContractAddress() public view onlyActive returns (address) {
        return address(partnersInteractionNFTContract);
    }

    function getAllMembers() public view onlyActive returns (address[] memory) {
        ICommunity community = ICommunity(communityAddress);
        return community.getMemberAddresses();
    }

    function queryForNewInteractions(address userAddress) public onlyActive {
        require(userAddress != address(0), "No user address passed!");

        for (uint256 i = 0; i < partnersContracts.length; i++) {
            Chainlink.Request memory req = buildChainlinkRequest(
                jobId,
                address(this),
                this.transferInteractionNFTs.selector
            );
            req.add("userAddress", string(abi.encodePacked(userAddress)));
            req.add(
                "contractAddress",
                string(abi.encodePacked(partnersContracts[i]))
            );
            req.add("chainId", "80001");
            req.addUint("startBlock", lastBlockPerUserAddress[userAddress]);
            req.add("covalentAPIKey", "ckey_aae01fa51e024af3a2634d9d030");

            bytes32 reqId = sendChainlinkRequestTo(oracle, req, fee);

            lastBlockPerUserAddress[userAddress] = block.number;
            userRequests[reqId] = userAddress;
        }
    }

    function transferInteractionNFTs(bytes32 _requestId, uint256 _result)
        public
        onlyActive
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
            IProfitSharingInteractions(profitSharing).recordInteraction(
                user,
                _result
            );
        }
    }

    function getInteractionNFT(address user) public view onlyActive returns (uint256) {
        return partnersInteractionNFTContract.getActiveInteractions(user);
    }

    function setProfitSharing(address _profitSharing) public onlyActive {
        require(profitSharing == address(0), "profit sharing already set");
        require(_profitSharing != address(0), "profit sharing address is 0");

        profitSharing = _profitSharing;
    }

    function getUserRole(address _user) public view onlyActive returns (uint256) {
        return uint256(partnersInteractionNFTContract.userRoles(_user));
    }

    function addNewContractAddressToAgreement(address contractAddress) onlyActive public {
        Ownable con = Ownable(contractAddress);
        require(con.owner() == msg.sender, 'Only the owner of the contract can import it!');
        partnersContracts.push(contractAddress);
    }

    function getImportedAddresses() public view onlyActive returns (address[] memory) {
        return partnersContracts;
    }
}
