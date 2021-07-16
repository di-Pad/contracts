const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const { artifacts } = require('hardhat');
const { ZERO_ADDRESS } = constants;
const truffleAssert = require('truffle-assertions');

const ProfitSharingFactory = artifacts.require('ProfitSharingFactory');
const MinimumCommunity = artifacts.require('MinimumCommunity');
const LinkToken = artifacts.require('LinkToken');
const MockOracle = artifacts.require('MockOracle');
const PartnersAgreement = artifacts.require('PartnersAgreement');
const DefaultSupportedTokens = artifacts.require('DefaultSupportedTokens');
const SkillWallet = artifacts.require('skill-wallet/contracts/main/SkillWallet');
const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";
var BN = web3.utils.BN;

contract('PartnersAgreement', function (accounts) {
    before(async function () {
        this.erc1820 = await singletons.ERC1820Registry(accounts[1]);
        
        this.linkTokenMock = await LinkToken.new()
        this.mockOracle = await MockOracle.new(this.linkTokenMock.address)
        
        this.skillWallet =  await SkillWallet.new(this.linkTokenMock.address, this.mockOracle.address);
        this.profitSharingFactory = await ProfitSharingFactory.new();

        this.minimumCommunity = await MinimumCommunity.new(this.skillWallet.address);
        this.defaultSupportedTokens = await DefaultSupportedTokens.new(true);

    });
    describe('Create partners agreement', async function () {
        
        it.only("should deploy partners agreement contract", async function () {

            PartnersAgreement.link(this.defaultSupportedTokens);

            const partnersAgreement = await PartnersAgreement.new(
                ZERO_ADDRESS, // partners contract
                accounts[0],
                this.minimumCommunity.address,
                3, 
                100,
                this.profitSharingFactory.address,
                this.mockOracle.address,
                this.linkTokenMock.address,
                { from: accounts[0] }
            );

            const allUsers = await partnersAgreement.getAllMembers();
            const interactionNFTAddress = await partnersAgreement.getInteractionNFTContractAddress();
            const profitSharing = await partnersAgreement.profitSharing();

            assert.notEqual(ZERO_ADDRESS, interactionNFTAddress);
            assert.notEqual(ZERO_ADDRESS, partnersAgreement.address);
            assert.equal(ZERO_ADDRESS, profitSharing);
            assert.equal(0, allUsers);
        });
    });
});
