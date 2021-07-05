//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

contract PartnersVault {
    address public profitSharingContract;

    constructor() {
        profitSharingContract = msg.sender;
    }

    function retreivePartnersShare(address _token, address _partner) public {
        require(msg.sender == profitSharingContract, "not the owner");

        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(_partner, balance);
    }
} 