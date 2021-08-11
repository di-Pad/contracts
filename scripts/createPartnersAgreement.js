/* eslint no-use-before-define: "warn" */
const chalk = require("chalk");
const { ethers } = require("hardhat");
const { deploy } = require("./utils");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";


const main = async () => {
    const deployerWallet = ethers.provider.getSigner();
    const deployerWalletAddress = await deployerWallet.getAddress();
    const partnersRegistryAddress = "0xb745EDB1fb993055fd4fd366A0c9791B2d3060b4";

    console.log("\n\n 📡 Creating new PartnersAgreement...\n");

    const partnersRegistry = await ethers.getContractAt("PartnersRegistry", partnersRegistryAddress);

    await partnersRegistry.create(
        metadataUrl,
        1,
        2,
        10,
        ZERO_ADDRESS,
        10
    );

    const agreements = await partnersRegistry.getPartnerAgreementAddresses();

    console.log("Agreements in registry (last is new): ");
    console.log(agreements);
};

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
