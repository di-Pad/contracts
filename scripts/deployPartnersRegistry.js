/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const distributedTownAddress = "0x3AF9ba336effE591bfC0BF0ADe8Ec5e069589075";
    let defaultSupportedTokensAddress = "0x19C1D1f6c04bEf9eE82e8a97Dd89d8d228e3472B";

    console.log("\n\n 📡 Deploying...\n");


    if (defaultSupportedTokensAddress == "") {
        const DefaultSupportedTokens = await ethers.getContractFactory("DefaultSupportedTokens");
        const defaultSupportedTokens = await DefaultSupportedTokens.deploy();
        await defaultSupportedTokens.deployed();
        defaultSupportedTokensAddress = defaultSupportedTokens.address;

        console.log("Default Supported Tokens library: ", defaultSupportedTokensAddress);
    }

    const RoleUtils = await ethers.getContractFactory('RoleUtils');
    const roleUtils = await RoleUtils.deploy();
    await roleUtils.deployed();

    const oracleMumbai = '0xc8D925525CA8759812d0c299B90247917d4d4b7C';
    const linkTokenMumbai = '0x326C977E6efc84E512bB9C30f76E30c160eD06FB';
    const partnersRegistry = await deploy("PartnersRegistry", [distributedTownAddress, oracleMumbai, linkTokenMumbai], {}, {
        RoleUtils: roleUtils.address
    });
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
