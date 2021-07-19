const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { Contract } = require('ethers');
const { ZERO_ADDRESS } = constants;
const hre = require("hardhat");
const { ethers } = require("hardhat");

const network = hre.network.name;
const e18 = "000000000000000000";
const deadbeefAddress = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";
const MAX_UINT = "115792089237316195423570985008687907853269984665640564039457584007913129639935";

const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";
var BN = web3.utils.BN;

let supportedTokens;
let profitSharingFactory;
let profitSharing;
let partnersVault;
let tokenDistribution;
let supportedToken;
let unsupportedToken;

contract("ProfitSharing", (accounts) => {
    before(async () => {
        const DefaultSupportedTokens = await ethers.getContractFactory("DefaultSupportedTokens");
        const defaultSupportedTokens = await DefaultSupportedTokens.deploy();
        await defaultSupportedTokens.deployed();

        const SupportedTokens = await ethers.getContractFactory("SupportedTokens", {
            libraries: {
                DefaultSupportedTokens: defaultSupportedTokens.address
            }
        });
        supportedTokens = await SupportedTokens.deploy(false);

        const ProfitSharingFactory = await ethers.getContractFactory("ProfitSharingFactory");
        profitSharingFactory = await ProfitSharingFactory.deploy();
    });

    describe("Deployment", async () => {
        it("Should deploy Profit Sharing contract", async () => {
            const [deployer] = await ethers.getSigners();
            //address _partner, uint256 _sharedProfit, uint256 _rolesCount, address _supportedTokens
            const deployTx = await profitSharingFactory.depolyProfitSharing(deployer.address, 10, 3, supportedTokens.address);

            const events = (await deployTx.wait()).events?.filter((e) => {
                return e.event == "ProfitSharingDeployed"
            });
            
            profitSharing = await ethers.getContractAt("ProfitSharing", events[0].args._profitSharing);

            expect(profitSharing.address).not.to.equal(ZERO_ADDRESS);
        });

        it("Should have set proper parameters", async () => {
            const [deployer] = await ethers.getSigners();

            expect(await profitSharing.partner()).to.equal(deployer.address);
            expect(String(await profitSharing.sharedProfit())).to.equal("10");
            expect(await profitSharing.supportedTokens()).to.equal(supportedTokens.address);
        })

        it("Should have deployed Partners Vault", async() => {
            partnersVault = await ethers.getContractAt("PartnersVault", await profitSharing.partnersVault());

            expect(partnersVault.address).not.to.equal(ZERO_ADDRESS);
            expect(await partnersVault.profitSharingContract()).to.equal(profitSharing.address);
        });

        it("Should have deployed Token Distribution contract", async() => {
            tokenDistribution = await ethers.getContractAt("TokenDistribution", await profitSharing.tokenDistribution());

            expect(tokenDistribution.address).not.to.equal(ZERO_ADDRESS);
            expect(await tokenDistribution.rolesCount()).to.equal("3");
        })
    });

    describe("Profit Sharing", async () => {
        before(async () => {
            //deploy stuff
            const [deployer] = await ethers.getSigners();

            const deployTx = await profitSharingFactory.depolyProfitSharing(deployer.address, 10, 3, supportedTokens.address);

            const events = (await deployTx.wait()).events?.filter((e) => {
                return e.event == "ProfitSharingDeployed"
            });
            
            profitSharing = await ethers.getContractAt("ProfitSharing", events[0].args._profitSharing);
            partnersVault = await ethers.getContractAt("PartnersVault", await profitSharing.partnersVault());
            tokenDistribution = await ethers.getContractAt("TokenDistribution", await profitSharing.tokenDistribution());

            //deploy generic ERC20 and add it to supported
            const GenericERC20 = await ethers.getContractFactory("GenericERC20");
            supportedToken = await GenericERC20.deploy("1000".concat(e18),"Supported", "SPRT");
            //TODO: add second supported token
            unsupportedToken = await GenericERC20.deploy("1000".concat(e18),"Unsupported", "USPRT");
            await supportedTokens.addSupportedToken(supportedToken.address);

            //send some tokens to profit sharing
            await supportedToken.transfer(profitSharing.address,"100".concat(e18));
            await unsupportedToken.transfer(profitSharing.address,"100".concat(e18));
        });

        it("Should detect unshared profit", async () => {
            expect (await profitSharing.isUnsharedProfit()).to.equal(true); 
        });

        it("Should be possible to retrieve unsupported token from the contract", async () => {
            await profitSharing.retrieveUnsupportedToken(unsupportedToken.address, deadbeefAddress);

            expect(await unsupportedToken.balanceOf(deadbeefAddress)).to.equal("100".concat(e18));
        });

        it("Should not be possible to retrieve supported token before sharing profit", async () => {
            expect(profitSharing.retrieveUnsupportedToken(supportedToken.address, deadbeefAddress)).to.be.revertedWith("token is supported");
        });

        it("Should send unshared profit to vault and distibution contracts", async () => {
            await profitSharing.splitAllProfits();

            expect(await supportedToken.balanceOf(profitSharing.address)).to.equal("0");
            expect(await supportedToken.balanceOf(partnersVault.address)).to.equal("90".concat(e18));
            expect(await supportedToken.balanceOf(tokenDistribution.address)).to.equal("10".concat(e18));
        });

        it("Should retrieve partners shares for all tokens from vault", async () => {
            await profitSharing.retrieveAllPartnersShares(deadbeefAddress);

            expect(await supportedToken.balanceOf(partnersVault.address)).to.equal("0");
            expect(await supportedToken.balanceOf(deadbeefAddress)).to.equal("90".concat(e18));
        })
    });
});

