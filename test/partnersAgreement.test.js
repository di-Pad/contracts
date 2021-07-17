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
const InteractionNFT = artifacts.require('InteractionNFT');
const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";
var BN = web3.utils.BN;

contract('PartnersAgreement', function (accounts) {
  before(async function () {
    this.erc1820 = await singletons.ERC1820Registry(accounts[1]);

    this.linkTokenMock = await LinkToken.new()
    this.mockOracle = await MockOracle.new(this.linkTokenMock.address)

    this.skillWallet = await SkillWallet.new(this.linkTokenMock.address, this.mockOracle.address);
    this.profitSharingFactory = await ProfitSharingFactory.new();

    this.minimumCommunity = await MinimumCommunity.new(this.skillWallet.address);
    this.defaultSupportedTokens = await DefaultSupportedTokens.new(true);

    PartnersAgreement.link(this.defaultSupportedTokens);

    this.partnersAgreement = await PartnersAgreement.new(
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

    const interactionNFTAddress = await this.partnersAgreement.getInteractionNFTContractAddress();
    this.interactionNFT = await InteractionNFT.at(interactionNFTAddress);

    await this.linkTokenMock.transfer(
      this.partnersAgreement.address,
      '2000000000000000000',
    )

  });
  describe('Create partners agreement', async function () {

    it("should deploy partners agreement contract", async function () {

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

    it('transferInteractionNFTs should transfer the corrent amount of NFTs depending on the chainlink fulfilled request', async function () {

      const initialInteractions = await this.partnersAgreement.getInteractionNFT(accounts[1]);
      assert.equal(initialInteractions.toString(), '0');

      let tx = await this.partnersAgreement.queryForNewInteractions(
        accounts[1]
      )
      let chainlinkRequestedEventEmitted =
        tx.logs[0].event === 'ChainlinkRequested'
      assert.isTrue(chainlinkRequestedEventEmitted)

      const requestId = tx.logs[0].args[0]
      const fulfilTx = await this.mockOracle.fulfillOracleRequest(
        requestId,
        10
      )

      const fulfilTxEventEmitted = fulfilTx.logs[0].event === 'CallbackCalled'
      assert.isTrue(fulfilTxEventEmitted)

      const interactions = await this.partnersAgreement.getInteractionNFT(accounts[1]);

      assert.equal(interactions.toString(), '10');
    })
  });
});
