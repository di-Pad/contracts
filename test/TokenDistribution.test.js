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
let supportedToken1;
let unsupportedToken;
let partnersAgreement;
let mockOracle;

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

//interactions[role][user][amounts]
const interactions = [
    [
        [1],
        [4],
        [4, 5],
        [16],
        [19, 6]
    ],
    [
        [4],
        [3, 3, 3],
        [16],
        [25],
        [36]
    ]
];

let roleDistributors = [];

let expectedResult = [
    "3600000000000000000000",
    "6400000000000000000000"
];
let expectedResult1 = [
    "720000000000000000000",
    "1280000000000000000000"
];

contract("TokenDistribution", (accounts) => {
    before(async () => {
        //deploy stuff
        const [deployer] = await ethers.getSigners();

        const DefaultSupportedTokens = await ethers.getContractFactory("DefaultSupportedTokens");
        const defaultSupportedTokens = await DefaultSupportedTokens.deploy();
        await defaultSupportedTokens.deployed();

        const RoleUtils = await ethers.getContractFactory("RoleUtils");
        const roleUtils = await RoleUtils.deploy();
        await roleUtils.deployed();

        const SupportedTokens = await ethers.getContractFactory("SupportedTokens", {
            libraries: {
                DefaultSupportedTokens: defaultSupportedTokens.address
            }
        });
        supportedTokens = await SupportedTokens.deploy(false);

        const ProfitSharingFactory = await ethers.getContractFactory("ProfitSharingFactory");
        profitSharingFactory = await ProfitSharingFactory.deploy();

        const LinkToken = await ethers.getContractFactory("LinkToken");
        const linkTokenMock = await LinkToken.deploy();

        const MockOracle = await ethers.getContractFactory("MockOracle");
        mockOracle = await MockOracle.deploy(linkTokenMock.address);
    
        const SkillWallet = await ethers.getContractFactory("SkillWallet");
        const skillWallet = await SkillWallet.deploy(linkTokenMock.address, mockOracle.address);
    
        const MinimumCommunity = await ethers.getContractFactory("MinimumCommunity");
        const minimumCommunity = await MinimumCommunity.deploy(skillWallet.address);

        const PartnersAgreement = await ethers.getContractFactory("PartnersAgreement",             {
            libraries: {
                RoleUtils: roleUtils.address
            }
        });
        partnersAgreement = await PartnersAgreement.deploy(
            ZERO_ADDRESS, // partners contract
            accounts[0],
            minimumCommunity.address,
            2,
            1000,
            mockOracle.address,
            linkTokenMock.address
        );
        await partnersAgreement.deployed();

        await linkTokenMock.transfer(
            partnersAgreement.address,
            '200000000000000000000',
        );

        const deployTx = await profitSharingFactory.deployProfitSharing(partnersAgreement.address, 20, supportedTokens.address);
        const events = (await deployTx.wait()).events?.filter((e) => {
            return e.event == "ProfitSharingDeployed"
        });

        await partnersAgreement.setProfitSharing(events[0].args._profitSharing);

        const profitSharingAddress = await partnersAgreement.profitSharing();
        
        profitSharing = await ethers.getContractAt("ProfitSharing", profitSharingAddress);

        tokenDistribution = await ethers.getContractAt("TokenDistribution", await profitSharing.tokenDistribution());

        //send some tokens to profit sharing contract and share them
        const GenericERC20 = await ethers.getContractFactory("GenericERC20");
        supportedToken = await GenericERC20.deploy("1000000".concat(e18),"Supported", "SPRT");
        supportedToken1 = await GenericERC20.deploy("1000000".concat(e18),"Supported1", "SPRT1");
        await supportedTokens.addSupportedToken(supportedToken.address);
        await supportedToken.transfer(profitSharing.address,"50000".concat(e18));
        await supportedTokens.addSupportedToken(supportedToken1.address);
        await supportedToken1.transfer(profitSharing.address,"10000".concat(e18));
        await profitSharing.splitAllProfits();

        //simulate some interations
        const interactionNFTAddress = await partnersAgreement.getInteractionNFTContractAddress();
        const interactionNFTContract = await ethers.getContractAt("InteractionNFT", interactionNFTAddress);

        for (let i = 0; i < interactions.length; i++) {
            for (let j = 0; j < interactions[i].length; j++) {
                await interactionNFTContract.addUserToRole(rolesUsers[i][j], i + 1);

                for (let k = 0; k < interactions[i][j].length; k++) {
                    //await tokenDistribution.recordInteraction(i + 1, rolesUsers[i][j]);
                    const tx = await partnersAgreement.queryForNewInteractions(
                        rolesUsers[i][j]
                    );
    
                    const events = (await tx.wait()).events?.filter((e) => {
                        return e.event == "ChainlinkRequested"
                    });
    
                    await mockOracle.fulfillOracleRequest(
                        events[0].args.id,
                        interactions[i][j][k]
                    );
                }
                /*console.log(await partnersAgreement.getInteractionNFT(rolesUsers[i][j]));
                console.log(String(await interactionNFTContract.balanceOf(rolesUsers[i][j], i + 1)));
                console.log(String(await tokenDistribution.userInteractions(i + 1, j)));*/                
            }
        }
    });

    describe("Token Distibution", async () => {
        it("Should distribute tokens to roles contract", async () => {
            await tokenDistribution.distribute();

            for (let i = 0; i < rolesUsers.length; i++) {
                roleDistributors.push(await tokenDistribution.roleDistributors(i + 1));

                expect(await roleDistributors[i]).not.to.equal(ZERO_ADDRESS);

                //console.log(roleDistributors[i], String(await supportedToken.balanceOf(roleDistributors[i])));
                expect(await supportedToken.balanceOf(roleDistributors[i])).to.equal(expectedResult[i]);
                expect(await supportedToken1.balanceOf(roleDistributors[i])).to.equal(expectedResult1[i]);
            }
            
            expect(await supportedToken.balanceOf(tokenDistribution.address)).to.equal("0");
            expect(await supportedToken1.balanceOf(tokenDistribution.address)).to.equal("0");
        });

        it("Should not allow another distribution before end of the cycle", async () => {
            await supportedToken.transfer(profitSharing.address,"50000".concat(e18));
            await profitSharing.splitAllProfits();

            for (let i = 0; i < interactions.length; i++) {
                for (let j = 0; j < interactions[i].length; j++) {   
                    for (let k = 0; k < interactions[i][j].length; k++) {
                        //await tokenDistribution.recordInteraction(i + 1, rolesUsers[i][j]);

                        const tx = await partnersAgreement.queryForNewInteractions(
                            rolesUsers[i][j]
                        );
        
                        const events = (await tx.wait()).events?.filter((e) => {
                            return e.event == "ChainlinkRequested"
                        });
        
                        await mockOracle.fulfillOracleRequest(
                            events[0].args.id,
                            interactions[i][j][k]
                        );
                    }             
                }
            }

            expect(tokenDistribution.distribute()).to.be.revertedWith("next period has not started yet");
        });

        it("Should allow to deploy new role contracts and distribute to them once new period started", async () => {
            await hre.network.provider.send("evm_increaseTime", [3600 * 24 * 7]);
            await hre.network.provider.send("evm_mine");

            await tokenDistribution.distribute();

            let newRoleDistributors = [];

            for (let i = 0; i < rolesUsers.length; i++) {
                newRoleDistributors.push(await tokenDistribution.roleDistributors(i + 1));

                expect(await newRoleDistributors[i]).not.to.equal(ZERO_ADDRESS);
                expect(await newRoleDistributors[i]).not.to.equal(roleDistributors[i]);

                //console.log(roleDistributors[i], String(await supportedToken.balanceOf(roleDistributors[i])));
                //console.log(newRoleDistributors[i], String(await supportedToken.balanceOf(newRoleDistributors[i])));
                expect(await supportedToken.balanceOf(newRoleDistributors[i])).to.equal(expectedResult[i]);
            }
            
            expect(await supportedToken.balanceOf(tokenDistribution.address)).to.equal("0");
        });
    });
});