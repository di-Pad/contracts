//SPDX-License-Identifier: MIT
pragma solidity ^0.6.10;

library DefaultSupportedTokens {
    uint256 constant public SUPPORTED_TOKENS_COUNT = 5;
    function getSupportedTokes() public pure returns (address[SUPPORTED_TOKENS_COUNT] memory) {
        address[SUPPORTED_TOKENS_COUNT] memory supportedTokens = [
            //MATICx  
            address(0x3aD736904E9e65189c3000c7DD2c8AC8bB7cD4e3),
            //WETH    
            //address(0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619),
            //ETHx    
            address(0x27e1e4E6BC79D93032abef01025811B7E4727e85),
            //USDC    
            //address(0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174),
            //USDCx   
            address(0xCAa7349CEA390F89641fe306D93591f87595dc1F),
            //DAI     
            //address(0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063),
            //DAIx    
            address(0x1305F6B6Df9Dc47159D12Eb7aC2804d4A33173c2),
            //WBTC    
            //address(0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6),
            //WBTCx   
            address(0x4086eBf75233e8492F1BCDa41C7f2A8288c2fB92)
        ];

        return supportedTokens;
    }
}