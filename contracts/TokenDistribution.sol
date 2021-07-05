//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./QuadraticDistribution.sol";
import "./CommonTypes.sol";
import "./ISupportedTokens.sol";
import "./RoleDistributor.sol";

contract TokenDistribution is ERC1155Burnable {
    using SafeMath for uint256;

    struct userRoleId {
        bool hasRole;
        uint256 id;
    }

    address public partnersAgreement;
    address public distributedToken;
    ISupportedTokens public supportedTokens;
    uint256 public rolesCount;
    mapping (Types.Roles => address) public roleDistributors;
    mapping (Types.Roles => uint256[]) public userInteractions;
    mapping (Types.Roles => address[]) public rolesUsers;
    mapping (address => mapping(Types.Roles => userRoleId)) public userRoles;
    uint256 unclaimedDistribution = 0;
    uint256 lastDistributionTimestamp = 0;
    uint256 distributionPeriod;

    constructor(address _supportedTokens, uint256 _rolesCount, string memory _uri) public ERC1155(_uri) {
        partnersAgreement = msg.sender;
        rolesCount = _rolesCount;
        supportedTokens = ISupportedTokens(_supportedTokens);        
    }

    function recordInteraction(uint256 _role, address _user) public {
        userRoleId storage userRole = userRoles[_user][Types.Roles(_role)];

        if (!userRole.hasRole) {
            userRole.hasRole = true;
            userRole.id = rolesUsers[Types.Roles(_role)].length;
            rolesUsers[Types.Roles(_role)].push(_user);
            userInteractions[Types.Roles(_role)].push(1);
        } else {
            uint256 id = userRole.id;
            userInteractions[Types.Roles(_role)][id] = userInteractions[Types.Roles(_role)][id].add(1);
        }
    }

    function distribute() public {
        require(block.timestamp >= lastDistributionTimestamp.add(distributionPeriod), "next period has not started yet");

        //deploy role distributors
        for (uint i = 0; i < rolesCount; i++) {
            roleDistributors[Types.Roles(i)] = address(new RoleDistributor(
                i, 
                rolesUsers[Types.Roles(i)], 
                userInteractions[Types.Roles(i)], 
                supportedTokens
            ));
        }

        uint256[] memory unweigted = new uint256[](rolesCount);

        //get unweighted allocations
        for (uint i = 0; i < rolesCount; i++) {
            unweigted[i] = QuadraticDistribution.calcUnweightedAlloc(userInteractions[Types.Roles(i)]);
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
                        _mint(roleDistributors[Types.Roles(j)],j, weights[j], "");
                        mint1155 = false;
                    }

                    //send tokens                    
                    IERC20(supportedTokens.supportedTokens(i)).transfer(roleDistributors[Types.Roles(j)], weighted[j]);
                }
            }
        }

        require(hasFunds, "no funds to distribute");

        lastDistributionTimestamp = block.timestamp;
    }    
}