//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

import "./QuadraticDistribution.sol";
import "./RoleUtils.sol";
import "./ISupportedTokens.sol";
import "./IPartnersAgreementInteractions.sol";
import "./RoleDistributor.sol";

contract TokenDistribution is ERC1155Burnable {
    using SafeMath for uint256;

    struct userRoleId {
        bool hasRole;
        uint256 id;
    }

    struct User {
        uint256 id;
        RoleUtils.Roles role;
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

    constructor(address _partnersAgreement, address _supportedTokens, uint256 _rolesCount, string memory _uri) ERC1155(_uri) {
        require (_rolesCount == 2 || _rolesCount == 3, "Roles count is not 2 or 3");
        
        partnersAgreement = _partnersAgreement;
        rolesCount = _rolesCount;
        supportedTokens = ISupportedTokens(_supportedTokens);        
    }

    function recordInteraction(uint256 _role, address _user) public {
        require(_role != 0, "role cannot be 0");
        User storage user = users[_user];

        if (user.role == RoleUtils.Roles.NONE) {
            user.role = RoleUtils.Roles(_role);
            user.id = rolesUsers[RoleUtils.Roles(_role)].length;
            rolesUsers[RoleUtils.Roles(_role)].push(_user);
            userInteractions[RoleUtils.Roles(_role)].push(1);
        } else {
            require(user.role == RoleUtils.Roles(_role), "role mismatch");
            uint256 id = user.id;
            userInteractions[RoleUtils.Roles(_role)][id] = userInteractions[RoleUtils.Roles(_role)][id].add(1);
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
        for (uint i = 0; i < rolesCount; i++) {
            unweigted[i] = QuadraticDistribution.calcUnweightedAlloc(userInteractions[RoleUtils.Roles(i + 1)]);
        }

        //get weights
        uint256[] memory weights = QuadraticDistribution.calcWeights(unweigted, rolesCount);

        //mint role ERC1155 and distribute funds
        bool mint1155 = true; //ERC1155 should be minted only once
        bool hasFunds = false; //to know if there were any funds

        for (uint i = 0; i < supportedTokens.getSupportedTokensCount(); i++) {
            uint256 balance = IERC20(supportedTokens.supportedTokens(i)).balanceOf(address(this));
            
            if (balance > 0) {
                hasFunds = true;

                //get weighted allocations
                uint256[] memory weighted = QuadraticDistribution.calcWeightedAlloc(balance, weights);
            
                for (uint j = 0; j < rolesCount; j++) {
                    //mint ERC1155
                    if (mint1155) {
                        _mint(roleDistributors[RoleUtils.Roles(j + 1)],j, weights[j], "");
                        mint1155 = false;
                    }

                    //send tokens                    
                    IERC20(supportedTokens.supportedTokens(i)).transfer(roleDistributors[RoleUtils.Roles(j + 1)], weighted[j]);
                }
            }
        }

        require(hasFunds, "no funds to distribute");

        lastDistributionTimestamp = block.timestamp;
    }

    function _getUsers() internal view {

    }

    function _getInteractions() internal view {

    }   
}