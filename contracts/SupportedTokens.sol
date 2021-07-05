//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "./DefaultSupportedTokens.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract SupportedTokens is Ownable {
    address public partnersAgreement;
    address[] public supportedTokens;
    mapping (address => bool) public isTokenSupported;
    mapping (address => uint256) private supportedTokenId;

    constructor(bool _addDefaults) public {    
        if(_addDefaults) {
            supportedTokens = DefaultSupportedTokens.getSupportedTokes();
        }

        partnersAgreement = msg.sender;
    }

    function addSupportedToken(address _token) public onlyOwner {
        require(!isTokenSupported[_token], "already supported");

        supportedTokenId[_token] = supportedTokens.length;
        supportedTokens.push(_token);
        isTokenSupported[_token] = true;
    }

    function removeSupportedToken(address _token) public onlyOwner {
        require(isTokenSupported[_token], "token not supported");

        uint256 tokenId = supportedTokenId[_token];

        //move last element to possition of deleted one
        if (tokenId != (supportedTokens.length - 1)) {
            address lastToken = supportedTokens[supportedTokens.length - 1];
            supportedTokens[tokenId] = lastToken;
            supportedTokenId[lastToken] = tokenId;
        }

        //delete last element
        supportedTokens.pop();
    }

    function getSupportedTokensCount() public view returns (uint256) {
        return supportedTokens.length;
    }
}