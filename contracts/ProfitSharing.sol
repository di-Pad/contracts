//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./PartnersVault.sol";
import "./ISupportedTokens.sol";
import "./TokenDistribution.sol";

contract ProfitSharing {
    using SafeMath for uint256;

    address public partner;
    PartnersVault public partnersVault;
    address public tokenDistribution;
    uint256 public sharedProfit; //in percent
    ISupportedTokens public supportedTokens;

    constructor(address _partner, uint256 _sharedProfit, uint256 _rolesCount, address _supportedTokens) public {
        require(sharedProfit < 100, "Shared profit > 100");
        require(_partner != address(0), "no partner address");

        partnersVault = new PartnersVault();
        partner = _partner;
        tokenDistribution = address(new TokenDistribution(_supportedTokens, _rolesCount, ""));
        sharedProfit = _sharedProfit;
        supportedTokens = ISupportedTokens(_supportedTokens);
    }

    function splitAllProfits() public {
        for (uint256 i; i < supportedTokens.getSupportedTokensCount(); i++) {
            IERC20 token = IERC20(supportedTokens.supportedTokens(i));
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
        require(supportedTokens.isTokenSupported(_token), "not supported token");

        partnersVault.retreivePartnersShare(_token, _to);
    }

    function retrieveAllPartnersShares(address _to) public {
        require(msg.sender == partner, "not partner");

        for (uint256 i; i < supportedTokens.getSupportedTokensCount(); i++) {
            address token = supportedTokens.supportedTokens(i);
            if(IERC20(token).balanceOf(address(partnersVault)) > 0) {
                partnersVault.retreivePartnersShare(token, _to);
            }
        }
    }

    function retreiveUnsupportedToken(address _token, address _to) public {
        require(msg.sender == partner, "not partner");
        require(!supportedTokens.isTokenSupported(_token), "token is supported");

        uint256 balance = IERC20(_token).balanceOf(address(this));
        IERC20(_token).transfer(_to, balance);
    }

    function isUnsharedProfit() public view returns (bool) {
        for (uint256 i; i < supportedTokens.getSupportedTokensCount(); i++) {
            if (IERC20(supportedTokens.supportedTokens(i)).balanceOf(address(this)) > 0) {
                return true;
            }
        }

        return false;
    }
}