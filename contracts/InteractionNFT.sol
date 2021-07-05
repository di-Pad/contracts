
//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract InteractionNFT is ERC1155Burnable {
    using Counters for Counters.Counter;
    Counters.Counter interactionId;

    event MarkedAsInactive();
    event UserRoleAssigned();

    uint public constant ROLE1 = 0;
    uint public constant ROLE2 = 1;
    uint public constant ROLE3 = 2;

    mapping(address => uint) userRoles;

    mapping(address => uint) inactiveInteractions;

    constructor(uint rolesCount, uint totalSupply) public ERC1155('') {
        if(rolesCount == 2) {
            uint role2Tokens = totalSupply * 43/100;
            uint role1Tokens = totalSupply - role2Tokens;
            _mint(msg.sender, ROLE1, role1Tokens, "");
            _mint(msg.sender, ROLE2, role2Tokens, "");
        } else {
            uint role2Tokens = totalSupply * 29/100;
            uint role3Tokens = totalSupply * 14/100;
            uint role1Tokens = totalSupply - role2Tokens - role3Tokens;
            _mint(msg.sender, ROLE1, role1Tokens, "");
            _mint(msg.sender, ROLE2, role2Tokens, "");
            _mint(msg.sender, ROLE3, role3Tokens, "");
        }
    }

    function addUserToRole(address user, uint role) public {
        require(user != address(0), "No user passed");
        require(role >= 0 && role <= 2, "Invalid role!");

        userRoles[user] = role;

        emit UserRoleAssigned();

    }

    function markAsInactive(address owner, uint amount) public {
        require(owner != address(0), "no owner passed");
        require(amount >= balanceOf(owner, userRoles[owner]));

        inactiveInteractions[owner] += amount;

        emit MarkedAsInactive();
    }

    function getActiveInteractions(address user) public view returns(uint)  {
        uint balance = balanceOf(user, userRoles[user]);
        uint inactive = inactiveInteractions[user];
        return balance - inactive;
    }

    function getRoleIds() pure public returns(uint[] memory) {
        uint[] memory roles;
        roles[0] = 0;
        roles[1] = 1;
        roles[2] = 2;
        return roles;
    }
}