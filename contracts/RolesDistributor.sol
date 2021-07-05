//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./CommonTypes.sol";
import "./TokenDistribution.sol";

contract RolesDistributor is ERC1155Holder {
    using SafeMath for uint256;
    
    uint256 constant PRECISION = 1e6;

    uint256 public role;
    uint256 public totalInteractions;
    address[] public users;
    mapping (address => uint256) userInteractions;
    address tokenDistribution;

    constructor(uint256 _role) {
        tokenDistribution = msg.sender;
        role = _role;
    }
    
    function distributeToUsers() public {
        require(msg.sender == tokenDistribution, "!Token Distribution contract");

        uint256 balance = TokenDistribution(tokenDistribution).balanceOf(address(this), role);
        require(balance > 0, "Nothing to distribute");

        for (uint256 i=0; i < users.length; i++) {
            if (userInteractions[users[i]] > 0) {
                uint256 weight = userInteractions[users[i]].mul(PRECISION).div(totalInteractions);
                uint256 amountToDistribute = weight.mul(balance).div(PRECISION);

                if (amountToDistribute > balance) {
                    amountToDistribute = balance;
                }

                //for testing: sending distribution ERC1155 instead of real partner tokens
                TokenDistribution(tokenDistribution).safeTransferFrom(address(this), users[i], role, amountToDistribute, "");

                delete userInteractions[users[i]];
            }
        }

        totalInteractions = 0;
    }


}