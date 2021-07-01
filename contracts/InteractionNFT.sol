
//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC1155/ERC1155Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract InteractionNFT is ERC1155Burnable {
    using Counters for Counters.Counter;
    Counters.Counter interactionId;

    uint public constant ROLE1 = 0;
    uint public constant ROLE2 = 1;
    uint public constant ROLE3 = 2;

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
}