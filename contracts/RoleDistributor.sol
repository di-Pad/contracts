//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./TokenDistribution.sol";
import "./ISupportedTokens.sol";

import {
    ISuperfluid,
    ISuperToken,
    ISuperAgreement
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/superfluid/ISuperfluid.sol"; 

import {
    IConstantFlowAgreementV1
} from "@superfluid-finance/ethereum-contracts/contracts/interfaces/agreements/IConstantFlowAgreementV1.sol";

contract RoleDistributor is ERC1155Holder {
    using SafeMath for uint256;
    
    uint256 constant PRECISION = 1e6;
    //TODO: parametrize this:
    ISuperfluid constant HOST = ISuperfluid(0xEB796bdb90fFA0f28255275e16936D25d3418603);
    IConstantFlowAgreementV1 constant CFA = IConstantFlowAgreementV1(0x49e565Ed1bdc17F3d220f72DF0857C26FA83F873);

    uint256 public role;
    //uint256 public totalInteractions;
    address[] public users;
    uint256[] public userInteractions;
    //mapping (address => uint256) userInteractions;
    address tokenDistribution;
    ISupportedTokens supportedTokens;
    uint256 divider;

    constructor(
        uint256 _role,
        uint256 _distributionPeriod,
        address[] memory _users, 
        uint256[] memory _userInteractions,
        ISupportedTokens _supportedTokens
    ) {
        tokenDistribution = msg.sender;
        role = _role;
        users = _users;
        supportedTokens = _supportedTokens;
        userInteractions = _userInteractions;
        divider = (_distributionPeriod / 24 / 3600); //replace 7 with param (weekly/monthly)
    }

    //TODO: to add superflow integration to distribution    
    function distributeToUsers() public {
        //require(msg.sender == tokenDistribution, "!Token Distribution contract");

        uint256 totalInteractions;

        for (uint256 i; i < userInteractions.length; i++) {
            totalInteractions = totalInteractions.add(userInteractions[i]);
        }

        //calculate weights
        uint256[] memory weights = new uint256[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            if (userInteractions[i] > 0) {
                weights[i] = userInteractions[i].mul(PRECISION).div(totalInteractions);
            }
        }

        for (uint256 i = 0; i < supportedTokens.getSupportedTokensCount(); i++) {
            uint256 balance = IERC20(supportedTokens.supportedTokens(i)).balanceOf(address(this));
            
            if (balance > 0) {
                for (uint256 j=0; j < users.length; j++) {
                    if (userInteractions[j] > 0 && weights[j] == 0) {
                        weights[i] = userInteractions[i].mul(PRECISION).div(totalInteractions);
                    }
                    if (weights[j] > 0) {
                        uint256 amountToDistribute = weights[j].mul(balance).div(PRECISION);
                        //for testing tokens are sent to users without creating a flow. To be removed after testing
                        IERC20(supportedTokens.supportedTokens(i)).transfer(users[j], amountToDistribute);
                        //_createStream(users[j], supportedTokens.supportedTokens(i), amountToDistribute);
                    }
                }
            }
        }
    }

    function _createStream(address _receiver, address _token, uint256 _amount) internal {
        HOST.callAgreement(
            CFA,
            abi.encodeWithSelector(
                CFA.createFlow.selector,
                ISuperToken(_token),
                _receiver,
                uint256((_amount) / divider), 
                //uint256((25 * 1e18) / (15 / 24 / 3600)),
                new bytes(0)
            ),
            "0x"
        );
    }


}