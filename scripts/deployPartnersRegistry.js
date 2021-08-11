/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const distributedTownAddress = "0x559Cc95dBcA574a684FE23AcCa3a9ae49d5cF4f3";
    let defaultSupportedTokensAddress = "0x19C1D1f6c04bEf9eE82e8a97Dd89d8d228e3472B";

    console.log("\n\n 📡 Deploying...\n");

    
    if (defaultSupportedTokensAddress == "") {
        const DefaultSupportedTokens = await ethers.getContractFactory("DefaultSupportedTokens");
        const defaultSupportedTokens = await DefaultSupportedTokens.deploy();
        await defaultSupportedTokens.deployed();
        defaultSupportedTokensAddress = defaultSupportedTokens.address;

        console.log("Default Supported Tokens library: ", defaultSupportedTokensAddress);
    }

    const partnersRegistry = await deploy("PartnersRegistry", [distributedTownAddress, ZERO_ADDRESS, ZERO_ADDRESS, ZERO_ADDRESS], {}, {});
    await partnersRegistry.deployed();

    console.log(
        " 💾  Artifacts (address, abi, and args) saved to: ",
        chalk.blue("packages/hardhat/artifacts/"),
        "\n\n"
    );
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
