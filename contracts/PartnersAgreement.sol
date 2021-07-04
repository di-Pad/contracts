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
    address communityAddress;
    uint lastBlockQueried;

    // Chainlink params
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

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


    function getInteractions(
        address[] memory userAddresses
    ) public {
        require(
            userAddresses.length > 0,
            "UserAddresses list is empty!"
        );

        Chainlink.Request memory req =
            buildChainlinkRequest(
                jobId,
                address(this),
                this.transferInteractionNFTs.selector
            );
        req.addStringArray("userAddresses", getStringArray(userAddresses, userAddresses.length));
        req.add("contractAddress", string(abi.encodePacked(partnersContract)));
        req.add("chainId", "80001");
        req.addUint("startBlock", lastBlockQueried);
        req.add("covalentAPIKey", "ckey_aae01fa51e024af3a2634d9d030");

        sendChainlinkRequestTo(oracle, req, fee);

        lastBlockQueried = block.number;
    }

    function getStringArray(address[] memory arr, uint len) private pure returns(string[] memory) {
        string[] memory res = new string[](len);
        for(uint index = 0; index < len; index++) {
            res[index] = string(abi.encodePacked(arr[index]));
        }
        return res;
    }


    function transferInteractionNFTs(bytes32 _requestId, UserInteractions[] calldata _result)
        public
        recordChainlinkFulfillment(_requestId)
    {
        ICommunity community = ICommunity(communityAddress);
        ISkillWallet skillWallet = ISkillWallet(community.getSkillWalletAddress());
        for(uint index = 0; index < _result.length; index++) {
            uint skillWalletId = skillWallet.getSkillWalletIdByOwner(_result[index].userAddress);
            Types.SkillSet memory skillSet = skillWallet.getSkillSet(skillWalletId);
            partnersInteractionNFTContract.safeTransferFrom(address(this), _result[index].userAddress, skillSet.skill1.level, _result[index].transactionsCount, "");
        }
    }
}
