/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const distributedTownAddress = "0x064C1E789B9a3FfCe8112630cCf6e2de082Dd7A7";

    console.log("\n\n 📡 Deploying...\n");
    const defaultSupportedTokens = await deploy('DefaultSupportedTokens', []);
    await defaultSupportedTokens.deployed();

    const partnersRegistry = await deploy("PartnersRegistry", [distributedTownAddress, distributedTownAddress, distributedTownAddress, distributedTownAddress], {}, {
        DefaultSupportedTokens: defaultSupportedTokens.address
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
