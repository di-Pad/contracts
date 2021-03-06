//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./QuadraticDistribution.sol";
import "./RoleUtils.sol";
import "./ISupportedTokens.sol";
import "./IPartnersAgreementInteractions.sol";
import "./RoleDistributor.sol";

contract TokenDistribution {
    using SafeMath for uint256;

    struct userRoleId {
        bool hasRole;
        uint256 id;
    }

    struct User {
        uint256 id;
        RoleUtils.Roles role;
        uint256 lastCycle; // to check if user was already used and id updated in current cycle
    }

    address public partnersAgreement;
    address public distributedToken;
    ISupportedTokens public supportedTokens;
    uint256 public rolesCount;
    mapping (RoleUtils.Roles => address) public roleDistributors;
    mapping (RoleUtils.Roles => uint256[]) public userInteractions;
    mapping (RoleUtils.Roles => address[]) public rolesUsers;
    mapping (address => User) public users;
    uint256 unclaimedDistribution = 0;
    uint256 lastDistributionTimestamp = 0;
    uint256 distributionPeriod = 7 days; //TODO: populate with param
    uint256 cycle = 1;

    constructor(address _partnersAgreement, address _supportedTokens, uint256 _rolesCount) {
        require (_rolesCount == 2 || _rolesCount == 3, "Roles count is not 2 or 3");
        
        partnersAgreement = _partnersAgreement;
        rolesCount = _rolesCount;
        supportedTokens = ISupportedTokens(_supportedTokens);        
    }

    function recordInteraction(address _user, uint256 _amount) public {
        User memory user = users[_user];

        if (user.role == RoleUtils.Roles.NONE || user.lastCycle < cycle) {
            RoleUtils.Roles role = RoleUtils.Roles(IPartnersAgreementInteractions(partnersAgreement).getUserRole(_user));
            require(role != RoleUtils.Roles.NONE, "no role");
            
            user.role = role;
            user.id = rolesUsers[role].length;
            user.lastCycle = cycle;
            users[_user] = user;
            rolesUsers[role].push(_user);
            userInteractions[role].push(_amount);
        } else {
            uint256 id = user.id;
            RoleUtils.Roles role = user.role;
            userInteractions[role][id] = userInteractions[role][id].add(_amount);
        }
    }

    function distribute() public {
        require(block.timestamp >= lastDistributionTimestamp.add(distributionPeriod), "next period has not started yet");

        //get users
        //address[] memory users = IPartnersAgreementInteractions(partnersAgreement).getAllMembers();
        //uint256


        //deploy role distributors
        for (uint i = 1; i <= rolesCount; i++) {
            roleDistributors[RoleUtils.Roles(i)] = address(new RoleDistributor(
                i, 
                distributionPeriod,
                rolesUsers[RoleUtils.Roles(i)], 
                userInteractions[RoleUtils.Roles(i)], 
                supportedTokens
            ));
        }

        uint256[] memory unweigted = new uint256[](rolesCount);

        //get unweighted allocations
        for (uint i = 1; i <= rolesCount; i++) {
            unweigted[i - 1] = QuadraticDistribution.calcUnweightedAlloc(userInteractions[RoleUtils.Roles(i)]);
            
            //cleanup
            delete userInteractions[RoleUtils.Roles(i)];
            delete rolesUsers[RoleUtils.Roles(i)];
        }

        //get weights
        uint256[] memory weights = QuadraticDistribution.calcWeights(unweigted, rolesCount);

        bool hasFunds = false; //to know if there were any funds

        for (uint i = 0; i < supportedTokens.getSupportedTokensCount(); i++) {
            uint256 balance = IERC20(supportedTokens.supportedTokens(i)).balanceOf(address(this));
            
            if (balance > 0) {
                hasFunds = true;

                //get weighted allocations
                uint256[] memory weighted = QuadraticDistribution.calcWeightedAlloc(balance, weights);
            
                for (uint j = 0; j < rolesCount; j++) {
                    //send tokens                    
                    IERC20(supportedTokens.supportedTokens(i)).transfer(roleDistributors[RoleUtils.Roles(j + 1)], weighted[j]);
                }
            }
        }

        require(hasFunds, "no funds to distribute");

        lastDistributionTimestamp = block.timestamp;
        cycle++; //no risk of overflow here
    }

    function _getUsers() internal view {

    }

    function _getInteractions() internal view {

    }   
}