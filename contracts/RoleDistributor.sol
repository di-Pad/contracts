//SPDX-License-Identifier: MIT
pragma solidity ^0.7.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
//import "./TokenDistribution.sol";
import "./ISupportedTokens.sol";

contract RoleDistributor {
    using SafeMath for uint256;
    
    uint256 constant PRECISION = 1e6;

    uint256 public role;
    //uint256 public totalInteractions;
    address[] public users;
    uint256[] public userInteractions;
    mapping (address => mapping (address => uint256)) public userShare;
    mapping (address => mapping (address => uint256)) public userClaimedShare;
    mapping (address => mapping (address => uint256)) public lastClaimed;
    //mapping (address => uint256) userInteractions;
    address public tokenDistribution;
    ISupportedTokens public supportedTokens;
    uint256 public distributionPeriod;
    uint256 public distributionStart;
    bool public isCalculated;

    constructor(
        uint256 _role,
        uint256 _distributionPeriod,
        address[] memory _users, 
        uint256[] memory _userInteractions,
        ISupportedTokens _supportedTokens
    ) {
        require (_distributionPeriod > 0, "distribution period is 0");

        tokenDistribution = msg.sender;
        role = _role;
        users = _users;
        supportedTokens = _supportedTokens;
        userInteractions = _userInteractions;
        isCalculated = false;
        distributionPeriod = _distributionPeriod;
        distributionStart = block.timestamp;
    }
   
    function calculateShares() public {
        require(!isCalculated, "already calculated");
        //require(msg.sender == tokenDistribution, "!Token Distribution contract");

        uint256 totalInteractions;

        for (uint256 i; i < userInteractions.length; i++) {
            totalInteractions = totalInteractions.add(userInteractions[i]);
        }

        //calculate weights
        uint256[] memory weights = new uint256[](users.length);
        for (uint256 i = 0; i < users.length; i++) {
            if (userInteractions[i] > 0) {
                weights[i] = userInteractions[i].mul(PRECISION).div(totalInteractions);
            }
        }

        for (uint256 i = 0; i < supportedTokens.getSupportedTokensCount(); i++) {
            uint256 balance = IERC20(supportedTokens.supportedTokens(i)).balanceOf(address(this));
            
            if (balance > 0) {
                for (uint256 j=0; j < users.length; j++) {
                    if (userInteractions[j] > 0 && weights[j] == 0) {
                        weights[i] = userInteractions[i].mul(PRECISION).div(totalInteractions);
                    }
                    if (weights[j] > 0) {
                        uint256 amountToDistribute = weights[j].mul(balance).div(PRECISION);
                        //for testing tokens are sent to users without creating a flow. To be removed after testing
                        //IERC20(supportedTokens.supportedTokens(i)).transfer(users[j], amountToDistribute);
                        userShare[users[j]][supportedTokens.supportedTokens(i)] = amountToDistribute;
                    }
                }
            }
        }

        isCalculated = true;
    }

    //claim all tokens claimable by msg.sender
    function claimAll() public {
        require(isCalculated, "shares not calculated");

        for (uint256 i = 0; i < supportedTokens.getSupportedTokensCount(); i++) {
            address token = supportedTokens.supportedTokens(i);
            _claim(msg.sender, token);
        }
    }

    //claim particular supported token claimable by msg.sender
    function claim(address _token) public {
        require(isCalculated, "shares not calculated");
        require(supportedTokens.isTokenSupported(_token), "token not supported");
        require(userShare[msg.sender][_token] > userClaimedShare[msg.sender][_token], "all claimed");
        require(userShare[msg.sender][_token] > 0, "nothing to claim");

        _claim(msg.sender, _token);      
    }

    //claim all claimable tokens on behalf of user
    function claimAllOnBehalf(address _user) public {
        require(isCalculated, "shares not calculated");

        for (uint256 i = 0; i < supportedTokens.getSupportedTokensCount(); i++) {
            address token = supportedTokens.supportedTokens(i);
            _claim(_user, token);
        }
    }

    //claim all claimable tokens on behalf of all users
    function claimForAll() public {
        require(isCalculated, "shares not calculated");

        for (uint256 i = 0; i < supportedTokens.getSupportedTokensCount(); i++) {
            address token = supportedTokens.supportedTokens(i);
            for (uint256 j = 0; j < users.length; j++)
                _claim(users[j], token);
        }

    }

    function _claim(address _user, address _token) internal {
        uint256 claimingPeriod;
        uint256 toTimestamp = block.timestamp;
        bool isPeriodOver = false;

        if (toTimestamp > distributionStart + distributionPeriod) {
            toTimestamp = distributionStart + distributionPeriod;
            isPeriodOver = true;
        }

        if (lastClaimed[_user][_token] == 0) {
            claimingPeriod = toTimestamp - distributionStart;
        } else {
            claimingPeriod = toTimestamp - lastClaimed[_user][_token];
        }

        if (userShare[_user][_token] > userClaimedShare[_user][_token]) {
            uint256 claimLeft = userShare[_user][_token] - userClaimedShare[_user][_token];
            uint256 claimable = userShare[_user][_token].mul(claimingPeriod) / distributionPeriod;

            if(claimLeft < claimable || isPeriodOver) {
                claimable = claimLeft;
            }

            //TODO: Should transfer all or not transfer at all?                
            if(IERC20(_token).balanceOf(address(this)) < claimable) {
                claimable = IERC20(_token).balanceOf(address(this));
            }

            if(claimable > 0) {
                userClaimedShare[_user][_token] = userClaimedShare[_user][_token] + claimable;
                lastClaimed[_user][_token] = toTimestamp;
                IERC20(_token).transfer(_user, claimable);
            }
        }
    }
}