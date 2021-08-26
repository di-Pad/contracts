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

let expectedResults1 = [
    [
        "13090320000000000000",
        "52363440000000000000",
        "117817920000000000000",
        "209454480000000000000",
        "327272400000000000000"
    ],
    [
        "56888320000000000000",
        "128000000000000000000",
        "227554560000000000000",
        "355554560000000000000",
        "512000000000000000000"
    ]
]

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
        supportedToken = await GenericERC20.deploy("1000000".concat(e18),"Supported", "SPRT");
        await supportedTokens.addSupportedToken(supportedToken.address);
        await supportedToken.transfer(profitSharing.address,"50000".concat(e18));
        supportedToken1 = await GenericERC20.deploy("1000000".concat(e18),"Supported1", "SPRT1");
        await supportedTokens.addSupportedToken(supportedToken1.address);
        await supportedToken1.transfer(profitSharing.address,"10000".concat(e18));
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
        it("Should calculate user shares", async () => {
            for (let i = 0; i < roleDistributors.length; i++) {
                await roleDistributors[i].calculateShares();

                //expect(String(await supportedToken.balanceOf(roleDistributors[i].address)).length).to.be.lessThan(18);

                for (let j = 0; j < rolesUsers[i].length; j++) {
                    expect(await roleDistributors[i].userShare(rolesUsers[i][j], supportedToken.address)).to.equal(expectedResults[i][j]);
                    expect(await roleDistributors[i].userShare(rolesUsers[i][j], supportedToken1.address)).to.equal(expectedResults1[i][j]);
                    //expect(await supportedToken.balanceOf(rolesUsers[i][j])).to.equal(expectedResults[i][j]);
                }
            }            
        });

        it("Should allow to claim part of allocated tokens according to time passed from ditribution start", async () => {
            await hre.network.provider.send("evm_increaseTime", [3600 * 24]);
            await hre.network.provider.send("evm_mine");

            const userId = 0
            const user = rolesUsers[0][userId];

            //send user some funds for gas
            const [deployer] = await ethers.getSigners();
            await deployer.sendTransaction({
                to: user,
                value: ethers.utils.parseEther("1") 
            });

            //impersonate
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [user]
            });
    
            const signer = ethers.provider.getSigner(user);
            const roleDistributorImp = await ethers.getContractAt("RoleDistributor", roleDistributors[0].address, signer);

            await roleDistributorImp.claimAll();

            expect(String(await supportedToken.balanceOf(user)).substr(0,4)).to.equal(
                String(ethers.BigNumber.from(expectedResults[0][userId]).div(7)).substr(0,4)
            );
            expect(String(await supportedToken1.balanceOf(user)).substr(0,4)).to.equal(
                String(ethers.BigNumber.from(expectedResults1[0][userId]).div(7)).substr(0,4)
            );
        });

        it("Should allow to claim another part of allocated tokens according to time passed from previous claim", async () => {
            await hre.network.provider.send("evm_increaseTime", [3600 * 24]);
            await hre.network.provider.send("evm_mine");

            const userId = 0
            const user = rolesUsers[0][userId];

            //send user some funds for gas
            const [deployer] = await ethers.getSigners();
            await deployer.sendTransaction({
                to: user,
                value: ethers.utils.parseEther("1") 
            });

            //impersonate
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [user]
            });
    
            const signer = ethers.provider.getSigner(user);
            const roleDistributorImp = await ethers.getContractAt("RoleDistributor", roleDistributors[0].address, signer);

            const balanceBefore = await supportedToken.balanceOf(user);
            const balanceBefore1 = await supportedToken1.balanceOf(user);

            await roleDistributorImp.claimAll();

            const claimedAmount = (await supportedToken.balanceOf(user)).sub(balanceBefore);
            const claimedAmount1 = (await supportedToken1.balanceOf(user)).sub(balanceBefore1);

            expect(String(claimedAmount).substr(0,4)).to.equal(
                String(ethers.BigNumber.from(expectedResults[0][userId]).div(7)).substr(0,4)
            );
            expect(String(claimedAmount1).substr(0,4)).to.equal(
                String(ethers.BigNumber.from(expectedResults1[0][userId]).div(7)).substr(0,4)
            );
        });

        it("Should allow to claim on behalf of ther user", async () => {
            const userId = 1
            const user = rolesUsers[0][userId];

            const balanceBefore = await supportedToken.balanceOf(user);
            const balanceBefore1 = await supportedToken1.balanceOf(user);

            await roleDistributors[0].claimAllOnBehalf(user);

            const claimedAmount = (await supportedToken.balanceOf(user)).sub(balanceBefore);
            const claimedAmount1 = (await supportedToken1.balanceOf(user)).sub(balanceBefore1);

            expect(String(claimedAmount).substr(0,4)).to.equal(
                String(ethers.BigNumber.from(expectedResults[0][userId]).div(7).mul(2)).substr(0,4)
            );
            expect(String(claimedAmount1).substr(0,4)).to.equal(
                String(ethers.BigNumber.from(expectedResults1[0][userId]).div(7).mul(2)).substr(0,4)
            );
        });

        it("Should allow to claim on behalf of all users", async () => {
            await roleDistributors[1].claimForAll();

            for(let i = 0; i < rolesUsers[1].length; i++){
                expect(String(await supportedToken.balanceOf(rolesUsers[1][i])).substr(0,3)).to.equal(
                    String(ethers.BigNumber.from(expectedResults[1][i]).div(7).mul(2)).substr(0,3)
                );
                expect(String(await supportedToken1.balanceOf(rolesUsers[1][i])).substr(0,3)).to.equal(
                    String(ethers.BigNumber.from(expectedResults1[1][i]).div(7).mul(2)).substr(0,3)
                );
            }
        });

        it("Should not send any tokens if claiming user is not in distribution", async () => {
            const user = deadbeefAddress;

            //send user some funds for gas
            const [deployer] = await ethers.getSigners();
            await deployer.sendTransaction({
                to: user,
                value: ethers.utils.parseEther("1") 
            });

            //impersonate
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [user]
            });
    
            const signer = ethers.provider.getSigner(user);
            const roleDistributorImp = await ethers.getContractAt("RoleDistributor", roleDistributors[0].address, signer);

            const balanceBefore = await supportedToken.balanceOf(roleDistributors[0].address);
            const balanceBefore1 = await supportedToken1.balanceOf(roleDistributors[0].address);

            await roleDistributorImp.claimAll();

            expect(await supportedToken.balanceOf(user)).to.equal("0");
            expect(await supportedToken.balanceOf(roleDistributors[0].address)).to.equal(balanceBefore);

            expect(await supportedToken1.balanceOf(user)).to.equal("0");
            expect(await supportedToken1.balanceOf(roleDistributors[0].address)).to.equal(balanceBefore1);
        });

        it("Should not send any tokens if claiming on behalf of user who is not in distribution", async () => {
            const user = deadbeefAddress;

            const balanceBefore = await supportedToken.balanceOf(roleDistributors[0].address);
            const balanceBefore1 = await supportedToken1.balanceOf(roleDistributors[0].address);

            await roleDistributors[0].claimAllOnBehalf(user);

            expect(await supportedToken.balanceOf(user)).to.equal("0");
            expect(await supportedToken.balanceOf(roleDistributors[0].address)).to.equal(balanceBefore);

            expect(await supportedToken1.balanceOf(user)).to.equal("0");
            expect(await supportedToken1.balanceOf(roleDistributors[0].address)).to.equal(balanceBefore1);
        });


        it("Should allow to claim the rest of allocated tokens when distribution period has passed", async () => {
            await hre.network.provider.send("evm_increaseTime", [3600 * 24 * 5]);
            await hre.network.provider.send("evm_mine");

            const userId = 0
            const user = rolesUsers[0][userId];

            //send user some funds for gas
            const [deployer] = await ethers.getSigners();
            await deployer.sendTransaction({
                to: user,
                value: ethers.utils.parseEther("1") 
            });

            //impersonate
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [user]
            });
    
            const signer = ethers.provider.getSigner(user);
            const roleDistributorImp = await ethers.getContractAt("RoleDistributor", roleDistributors[0].address, signer);

            await roleDistributorImp.claimAll();

            expect(await supportedToken.balanceOf(user)).to.equal(expectedResults[0][userId]);
            expect(await roleDistributors[0].userShare(user, supportedToken.address)).to.equal(
                await roleDistributors[0].userClaimedShare(user, supportedToken.address)
            );

            expect(await supportedToken1.balanceOf(user)).to.equal(expectedResults1[0][userId]);
            expect(await roleDistributors[0].userShare(user, supportedToken1.address)).to.equal(
                await roleDistributors[0].userClaimedShare(user, supportedToken1.address)
            );
        });

        it("Should allow to claim all allocated to user who never claimed tokens when distribution period has passed", async () => {
            const userId = 4
            const user = rolesUsers[0][userId];

            //send user some funds for gas
            const [deployer] = await ethers.getSigners();
            await deployer.sendTransaction({
                to: user,
                value: ethers.utils.parseEther("1") 
            });

            //impersonate
            await hre.network.provider.request({
                method: "hardhat_impersonateAccount",
                params: [user]
            });
    
            const signer = ethers.provider.getSigner(user);
            const roleDistributorImp = await ethers.getContractAt("RoleDistributor", roleDistributors[0].address, signer);

            await roleDistributorImp.claimAll();

            expect(await supportedToken.balanceOf(user)).to.equal(expectedResults[0][userId]);
            expect(await roleDistributors[0].userShare(user, supportedToken.address)).to.equal(
                await roleDistributors[0].userClaimedShare(user, supportedToken.address)
            );

            expect(await supportedToken1.balanceOf(user)).to.equal(expectedResults1[0][userId]);
            expect(await roleDistributors[0].userShare(user, supportedToken1.address)).to.equal(
                await roleDistributors[0].userClaimedShare(user, supportedToken1.address)
            );
        });

        it("Should allow to claim allocated tokens to all other users", async () => {
            for (let i = 0; i < roleDistributors.length; i++) {
                for (let j = 0; j < rolesUsers[i].length; j++) {
                    const user = rolesUsers[i][j];

                    //send user some funds for gas
                    const [deployer] = await ethers.getSigners();
                    await deployer.sendTransaction({
                        to: user,
                        value: ethers.utils.parseEther("1") 
                    });

                    //impersonate
                    await hre.network.provider.request({
                        method: "hardhat_impersonateAccount",
                        params: [user]
                    });

                    const signer = ethers.provider.getSigner(user);
                    const roleDistributorImp = await ethers.getContractAt("RoleDistributor", roleDistributors[i].address, signer);

                    if ((await roleDistributors[i].userShare(user, supportedToken.address)).gt(
                            await roleDistributors[i].userClaimedShare(user, supportedToken.address) 
                        ) ||
                        (await roleDistributors[i].userShare(user, supportedToken1.address)).gt(
                            await roleDistributors[i].userClaimedShare(user, supportedToken1.address)          
                    )) {
                        await roleDistributorImp.claimAll();

                        expect(await supportedToken.balanceOf(user)).to.equal(expectedResults[i][j]);
                        expect(await roleDistributors[i].userShare(user, supportedToken.address)).to.equal(
                            await roleDistributors[i].userClaimedShare(user, supportedToken.address)
                        );

                        expect(await supportedToken1.balanceOf(user)).to.equal(expectedResults1[i][j]);
                        expect(await roleDistributors[i].userShare(user, supportedToken1.address)).to.equal(
                            await roleDistributors[i].userClaimedShare(user, supportedToken1.address)
                        );
                    } else {
                        expect(roleDistributorImp.claim(supportedToken.address)).to.be.revertedWith("all claimed");
                        expect(await supportedToken.balanceOf(user)).to.equal(expectedResults[i][j]);

                        expect(roleDistributorImp.claim(supportedToken1.address)).to.be.revertedWith("all claimed");
                        expect(await supportedToken1.balanceOf(user)).to.equal(expectedResults1[i][j]);
                    }
                }
            }
        });

        it("Should have distributed all tokens", async () => {
            for (let i = 0; i < roleDistributors.length; i++) {
                expect(String(await supportedToken.balanceOf(roleDistributors[i].address)).length).to.be.lessThan(18);
                expect(String(await supportedToken1.balanceOf(roleDistributors[i].address)).length).to.be.lessThan(18);
            }
        });
    });
});