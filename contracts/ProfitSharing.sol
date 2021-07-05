//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PartnersVault.sol";

contract ProfitSharing {
    using SafeMath for uint256;

    address public partner;
    PartnersVault public partnersVault;
    address public tokenDistribution;
    uint256 public sharedProfit; //in percent
    address[] public supportedTokens;
    mapping (address => bool) isTokenSupported;

    constructor(address _partner, uint256 _sharedProfit, address _tokenDistribution, address[] memory _supportedTokens) {
        require(sharedProfit < 100, "Shared profit > 100");
        require(_partner != address(0), "no partner address");
        require(_tokenDistribution != address(0), "no distribution contract");
        require(_supportedTokens.length > 0, "no supported tokens");

        partnersVault = new PartnersVault();
        partner = _partner;
        tokenDistribution = _tokenDistribution;
        sharedProfit = _sharedProfit;
        
        for (uint256 i = 0; i < _supportedTokens.length; i++) {
            supportedTokens.push(_supportedTokens[i]);
            isTokenSupported[_supportedTokens[i]] = true;
        }
    }

    function splitAllProfits() public {
        for (uint256 i; i < supportedTokens.length; i++) {
            IERC20 token = IERC20(supportedTokens[i]);
            uint256 balance = token.balanceOf(address(this));
            if (balance > 0) {
                uint256 distributionShare = balance.mul(sharedProfit).div(100);
                uint256 partnersShare = balance.sub(distributionShare);

                token.transfer(address(partnersVault), partnersShare);
                token.transfer(tokenDistribution, distributionShare);          
            }
        }
    }

    function retrievePartnersShare(address _token, address _to) public {
        require(msg.sender == partner, "not partner");
        require(isTokenSupported[_token], "not supported token");

        partnersVault.retreivePartnersShare(_token, _to);
    }

    function retrieveAllPartnersShares(address _to) public {
        require(msg.sender == partner, "not partner");

        for (uint256 i; i < supportedTokens.length; i++) {
            if(IERC20(supportedTokens[i]).balanceOf(address(partnersVault)) > 0) {
                partnersVault.retreivePartnersShare(supportedTokens[i], _to);
            }
        }
    }

    function retreiveUnsupportedToken(address _token, address _to) public {
        require(msg.sender == partner, "not partner");
        require(!isTokenSupported[_token], "token is supported");

        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(_to, balance);
    }

    function isUnsharedProfit() public view returns (bool) {
        for (uint256 i; i < supportedTokens.length; i++) {
            if (IERC20(supportedTokens[i]).balanceOf(address(this)) > 0) {
                return true;
            }
        }

        return false;
    }
}