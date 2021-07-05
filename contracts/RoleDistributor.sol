//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./CommonTypes.sol";
import "./TokenDistribution.sol";
import "./ISupportedTokens.sol";

contract RoleDistributor is ERC1155Holder {
    using SafeMath for uint256;
    
    uint256 constant PRECISION = 1e6;

    uint256 public role;
    //uint256 public totalInteractions;
    address[] public users;
    uint256[] public userInteractions;
    //mapping (address => uint256) userInteractions;
    address tokenDistribution;
    ISupportedTokens supportedTokens;

    constructor(
        uint256 _role, 
        address[] memory _users, 
        uint256[] memory _userInteractions,
        ISupportedTokens _supportedTokens
    ) {
        tokenDistribution = msg.sender;
        role = _role;
        users = _users;
        supportedTokens = _supportedTokens;
        userInteractions = _userInteractions;
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
                        //TODO: add superflow part here
                        IERC20(supportedTokens.supportedTokens(i)).transfer(users[j], amountToDistribute);
                    }
                }
            }
        }
    }


}