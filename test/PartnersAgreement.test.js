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
const RoleUtils = artifacts.require('RoleUtils');
const InteractionNFT = artifacts.require('InteractionNFT');
const OwnableTestContract = artifacts.require('OwnableTestContract');
const SkillWallet = artifacts.require('skill-wallet/contracts/main/SkillWallet');
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
    this.roleUtils = await RoleUtils.new();

    PartnersAgreement.link(this.roleUtils);

    this.partnersAgreement = await PartnersAgreement.new(
      ZERO_ADDRESS, // partners contract
      accounts[0],
      this.minimumCommunity.address,
      3,
      100,
      this.mockOracle.address,
      this.linkTokenMock.address,
      { from: accounts[0] }
    );

    const community = await MinimumCommunity.at(await this.partnersAgreement.communityAddress());
    await community.joinNewMember(0, 0, 0, 0, 0, 0, '', 2000);
    await this.partnersAgreement.activatePA();

    const isActive = await this.partnersAgreement.isActive();
    assert.isTrue(isActive);

    await this.linkTokenMock.transfer(
      this.partnersAgreement.address,
      '2000000000000000000',
    )

  });
  describe('Create partners agreement', async function () {

    it("should deploy inactive partners agreement contract", async function () {

      const partnersAgreement = await PartnersAgreement.new(
        ZERO_ADDRESS, // partners contract
        accounts[0],
        this.minimumCommunity.address,
        3,
        100,
        this.mockOracle.address,
        this.linkTokenMock.address,
        { from: accounts[0] }
      );

      const isActive = await partnersAgreement.isActive();

      assert.notEqual(ZERO_ADDRESS, partnersAgreement.address);
      assert.isFalse(isActive);
    });


    it("should deploy and activate partners agreement contract", async function () {

      const partnersAgreement = await PartnersAgreement.new(
        ZERO_ADDRESS, // partners contract
        accounts[0],
        this.minimumCommunity.address,
        3,
        100,
        this.mockOracle.address,
        this.linkTokenMock.address,
        { from: accounts[0] }
      );

      let isActive = await partnersAgreement.isActive();

      assert.notEqual(ZERO_ADDRESS, partnersAgreement.address);
      assert.isFalse(isActive);


      const community = await MinimumCommunity.at(await partnersAgreement.communityAddress());
      await community.joinNewMember(0, 0, 0, 0, 0, 0, '', 2000);
      await partnersAgreement.activatePA();

      isActive = await partnersAgreement.isActive();
      assert.isTrue(isActive);

      const allUsers = await partnersAgreement.getAllMembers();
      const interactionNFTAddress = await partnersAgreement.getInteractionNFTContractAddress();
      const profitSharing = await partnersAgreement.profitSharing();

      assert.notEqual(ZERO_ADDRESS, interactionNFTAddress);
      assert.equal(ZERO_ADDRESS, profitSharing);
      assert.equal(0, allUsers);


    });

    it('transferInteractionNFTs should transfer the corrent amount of NFTs depending on the chainlink fulfilled request', async function () {
      const interactionNFTAddress = await this.partnersAgreement.getInteractionNFTContractAddress();
      const interactionNFTContract = await InteractionNFT.at(interactionNFTAddress);
      await interactionNFTContract.addUserToRole(accounts[0], 1);

      const initialInteractions = await this.partnersAgreement.getInteractionNFT(accounts[0]);
      assert.equal(initialInteractions.toString(), '0');

      let tx = await this.partnersAgreement.queryForNewInteractions(
        accounts[0]
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

      const interactions = await this.partnersAgreement.getInteractionNFT(accounts[0]);
      assert.equal(interactions.toString(), '10');
    })

    it('should add new contract address if owner is the signer', async function () {

      const ownable = await OwnableTestContract.new({ from: accounts[0] });

      await truffleAssert.reverts(
        this.partnersAgreement.addNewContractAddressToAgreement(this.partnersAgreement.address, { from: accounts[2] }),
        'Only the owner of the contract can import it!'
      );

      await truffleAssert.reverts(
        this.partnersAgreement.addNewContractAddressToAgreement(this.minimumCommunity.address),
        "Transaction reverted: function selector was not recognized and there's no fallback function"
      );

      await this.partnersAgreement.addNewContractAddressToAgreement(ownable.address, { from: accounts[0] });
      const importedContracts = await this.partnersAgreement.getImportedAddresses();
      assert.equal(importedContracts[0], ZERO_ADDRESS)
      assert.equal(importedContracts[1], ownable.address)
    })
  });
});
