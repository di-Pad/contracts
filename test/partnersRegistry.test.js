const { expectEvent, singletons, constants } = require('@openzeppelin/test-helpers');
const { assert } = require('chai');
const { ZERO_ADDRESS } = constants;
const truffleAssert = require('truffle-assertions');

const GigStatuses = artifacts.require('GigStatuses');
const DistributedTown = artifacts.require('DistributedTown');
const PartnersRegistry = artifacts.require('PartnersRegistry');
const AddressProvider = artifacts.require('AddressProvider');
const metadataUrl = "https://hub.textile.io/thread/bafkwfcy3l745x57c7vy3z2ss6ndokatjllz5iftciq4kpr4ez2pqg3i/buckets/bafzbeiaorr5jomvdpeqnqwfbmn72kdu7vgigxvseenjgwshoij22vopice";
var BN = web3.utils.BN;

contract('PartnersRegistry', function (accounts) {

    before(async function () {
        this.erc1820 = await singletons.ERC1820Registry(accounts[1]);
        this.gigStatuses = await GigStatuses.new();
        AddressProvider.link(this.gigStatuses);
        this.addressProvder = await AddressProvider.new();

        this.skillWallet = await SkillWallet.new({ from: accounts[2] });
        this.distirbutedTown = await DistributedTown.new('http://someurl.co', this.skillWallet.address, this.addressProvder.address, { from: accounts[2] });
        await this.distirbutedTown.deployGenesisCommunities(0, { from: accounts[2] });
        await this.distirbutedTown.deployGenesisCommunities(1, { from: accounts[2] });
        this.partnersRegistry = await PartnersRegistry.new(this.distributedTown.address, { from: accounts[2] });
        

    });
    describe('Create partners agreement', async function () {

       
        it("should succeed", async function () {

            const createPA = await this.partnersRegistry.create(
                metadataUrl, 
                0, 
                3, 
                100,
                '0x2CEF62C91Dd92FC35f008D1d6Ed08EADF64306bc',
                1000
            )
            const createPAEvent = createPA.logs[0].event === 'MemberAdded';
            assert.equal(createPAEvent, true);

        });
    });
});
