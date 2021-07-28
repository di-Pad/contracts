//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

interface IProfitSharingInteractions {
    function recordInteraction(address _user) external;
}