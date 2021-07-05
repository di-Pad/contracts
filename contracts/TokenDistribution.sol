//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./QuadraticDistribution.sol";
import "./CommonTypes.sol";

contract TokenDistribution is ERC1155Burnable {
    using SafeMath for uint256;

    struct userRoleId {
        bool hasRole;
        uint256 id;
    }

    address public partnersAgreement;
    address public distributedToken;
    uint256 public rolesCount;
    mapping (Types.Roles => address) public rolesContracts;
    mapping (Types.Roles => uint256[]) public userInteractions;
    mapping (Types.Roles => address[]) public rolesUsers;
    mapping (address => mapping(Types.Roles => userRoleId)) public userRoles;
    uint256 unclaimedDistribution = 0;

    constructor(address _distributedToken, uint256 _rolesCount, string memory _uri) ERC1155(_uri) {
        partnersAgreement = msg.sender;
        rolesCount = _rolesCount;
        distributedToken = _distributedToken;        
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
        uint256 balance = IERC20(distributedToken).balanceOf(address(this));
        uint256 fund = balance.sub(unclaimedDistribution);
        unclaimedDistribution = balance;
        uint256[] memory unweigted = new uint256[](rolesCount);

        //get unweighted allocations
        for (uint i = 0; i < rolesCount; i++) {
            unweigted[i] = QuadraticDistribution.calcUnweightedAlloc(userInteractions[Types.Roles(i)]);
        }

        //get weights
        uint256[] memory weights = QuadraticDistribution.calcWeights(unweigted, rolesCount);

        //get weighted allocations
        uint256[] memory weighted = QuadraticDistribution.calcWeightedAlloc(fund, weights);

        //mint role NFTs
        for (uint i = 0; i < rolesCount; i++) {
            _mint(address(this),i, weighted[i], "");
        }
    }    
}