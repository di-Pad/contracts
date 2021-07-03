/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils")

const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const distributedTownAddress = "0xf628bdee30627558aAe8c19d1522b08A2bfb6423";

    console.log("\n\n 📡 Deploying...\n");

    const partnersRegistry = await deploy("PartnersRegistry", [distributedTownAddress]);
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
