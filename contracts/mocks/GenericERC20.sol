//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract GenericERC20 is ERC20 {
    constructor (uint256 _mintAmount, string memory _name, string memory _symbol) ERC20 (_name, _symbol) {
        if (_mintAmount > 0) {
            _mint(msg.sender, _mintAmount);
        } 
    }

    function mint (address _to, uint256 _amount) public {
        _mint(_to, _amount);
    }

    function mintMe (uint256 _amount) public {
        _mint(msg.sender, _amount);
    }
}