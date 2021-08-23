const { constants } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;
const { ethers } = require("hardhat");

const e18 = "000000000000000000";

let supportedTokens;
let profitSharingFactory;
let profitSharing;
let partnersVault;
let tokenDistribution;
let supportedToken;
let mockOracle;
let partnersAgreement;

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

let expectedResults = [
    [
        "65451600000000000000",
        "261817200000000000000",
        "589089600000000000000",
        "1047272400000000000000",
        "1636362000000000000000"
    ],
    [
        "284441600000000000000",
        "640000000000000000000",
        "1137772800000000000000",
        "1777772800000000000000",
        "2560000000000000000000"
    ]
];

contract("RoleDistributor", (accounts) => {
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

        const PartnersAgreement = await ethers.getContractFactory("PartnersAgreement", {
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

        const community = await MinimumCommunity.attach(await partnersAgreement.communityAddress());
        await community.joinNewMember(0, 0, 0, 0, 0, 0, '', 2000);
        await partnersAgreement.activatePA();

        await linkTokenMock.transfer(
            partnersAgreement.address,
            '2000000000000000000',
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
        supportedToken = await GenericERC20.deploy("1000000".concat(e18), "Supported", "SPRT");
        await supportedTokens.addSupportedToken(supportedToken.address);
        await supportedToken.transfer(profitSharing.address, "50000".concat(e18));
        await profitSharing.splitAllProfits();

        //simulate some interations
        const interactionNFTAddress = await partnersAgreement.getInteractionNFTContractAddress();
        const interactionNFTContract = await ethers.getContractAt("InteractionNFT", interactionNFTAddress);

        for (let i = 0; i < interactions.length; i++) {
            for (let j = 0; j < interactions[i].length; j++) {
                await interactionNFTContract.addUserToRole(rolesUsers[i][j], i + 1);

                const tx = await partnersAgreement.queryForNewInteractions(
                    rolesUsers[i][j]
                );

                const events = (await tx.wait()).events?.filter((e) => {
                    return e.event == "ChainlinkRequested"
                });

                await mockOracle.fulfillOracleRequest(
                    events[0].args.id,
                    interactions[i][j]
                );
            }
        }

        //Do distribution
        await tokenDistribution.distribute();

        for (let i = 0; i < rolesUsers.length; i++) {
            roleDistributors.push(await ethers.getContractAt("RoleDistributor", await tokenDistribution.roleDistributors(i + 1)));
        }
    });

    describe("Token Distibution", async () => {
        it("Should distribute distribute tokens to users", async () => {
            for (let i = 0; i < roleDistributors.length; i++) {
                await roleDistributors[i].distributeToUsers();

                expect(String(await supportedToken.balanceOf(roleDistributors[i].address)).length).to.be.lessThan(18);

                for (let j = 0; j < rolesUsers[i].length; j++) {
                    expect(await supportedToken.balanceOf(rolesUsers[i][j])).to.equal(expectedResults[i][j]);
                }
            }
        });
    });
});