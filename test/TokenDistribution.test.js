const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { Contract } = require('ethers');
const { ZERO_ADDRESS } = constants;
const hre = require("hardhat");
const { ethers } = require("hardhat");
const { F } = require('ramda');

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

const rolesUsers = [
    [
        "0xdeadbeefdeadbeefdeadbeefdeadbeef11111111",
        "0xdeadbeefdeadbeefdeadbeefdeadbeef11112222",
        "0xdeadbeefdeadbeefdeadbeefdeadbeef11113333",
        "0xdeadbeefdeadbeefdeadbeefdeadbeef11114444",
        "0xdeadbeefdeadbeefdeadbeefdeadbeef11115555"
    ],
    [
        "0xdeadbeefdeadbeefdeadbeefdeadbeef22221111",
        "0xdeadbeefdeadbeefdeadbeefdeadbeef22222222",
        "0xdeadbeefdeadbeefdeadbeefdeadbeef22223333",
        "0xdeadbeefdeadbeefdeadbeefdeadbeef22224444",
        "0xdeadbeefdeadbeefdeadbeefdeadbeef22225555"        
    ]
];

const interactions = [
    [
        1,
        4,
        9,
        16,
        25
    ],
    [
        4,
        9,
        16,
        25,
        36
    ]
];

let roleDistributors = [];

let expectedResult = [
    "3600000000000000000000",
    "6400000000000000000000"
];

contract("TokenDistribution", (accounts) => {
    before(async () => {
        //deploy stuff
        const [deployer] = await ethers.getSigners();

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

        const deployTx = await profitSharingFactory.depolyProfitSharing(deployer.address, 20, rolesUsers.length, supportedTokens.address);

        const events = (await deployTx.wait()).events?.filter((e) => {
            return e.event == "ProfitSharingDeployed"
        });
        
        profitSharing = await ethers.getContractAt("ProfitSharing", events[0].args._profitSharing);

        tokenDistribution = await ethers.getContractAt("TokenDistribution", await profitSharing.tokenDistribution());

        //send some tokens to profit sharing contract and share them
        const GenericERC20 = await ethers.getContractFactory("GenericERC20");
        supportedToken = await GenericERC20.deploy("100000".concat(e18),"Supported", "SPRT");
        await supportedTokens.addSupportedToken(supportedToken.address);
        await supportedToken.transfer(profitSharing.address,"50000".concat(e18));
        await profitSharing.splitAllProfits();

        //simulate some interations
        //TODO: replace with actual interactions once they are integrated
        for (let i = 0; i < interactions.length; i++) {
            for (let j = 0; j < interactions[i].length; j++) {
                for (let k = 0; k < interactions[i][j]; k++) {
                    await tokenDistribution.recordInteraction(i, rolesUsers[i][j]);
                }          
            }
        }
    });

    describe("Token Distibution", async () => {
        it("Should distribute distribute tokens to roles contract", async () => {
            await tokenDistribution.distribute();

            for (let i = 0; i < rolesUsers.length; i++) {
                roleDistributors.push(await tokenDistribution.roleDistributors(i));

                expect(await roleDistributors[i]).not.to.equal(ZERO_ADDRESS);

                //console.log(roleDistributors[i], String(await supportedToken.balanceOf(roleDistributors[i])));
                expect(await supportedToken.balanceOf(roleDistributors[i])).to.equal(expectedResult[i]);
            }            
        });
    });
});