const partnersRegistryAddress = '0x85E0369BD3807b635aa197E6E98CE2EF2B0e6e20'
const distributedTownAddress = '0xB4E068Ea3f5086b76c3BC2Fbae4c5e59453207F8'
// const partnersRegistryAddress = '0x7a95A9f0A99fb21548e58821059502C85c193956';
// const distributedTownAddress = '0xf628bdee30627558aAe8c19d1522b08A2bfb6423';
const { assert } = require('chai')
const fs = require("fs");

var ethers = require('ethers')
var partnersRegistryAbi = require('../artifacts/contracts/PartnersRegistry.sol/PartnersRegistry.json')
  .abi

var partnersAgreementAbi = require('../artifacts/contracts/PartnersAgreement.sol/PartnersAgreement.json')
  .abi
var distributedTownAbi = require('../artifacts/contracts/IDistributedTown.sol/IDistributedTown.json')
  .abi

const userAddress = '0x2CEF62C91Dd92FC35f008D1d6Ed08EADF64306bc';
function mnemonic() {
  return ''
}

const provider = new ethers.providers.JsonRpcProvider(
  'https://rpc-mumbai.maticvigil.com/v1/9ca44fbe543c19857d4e47669aae2a9774e11c66'


  // 'https://kovan.infura.io/v3/779285194bd146b48538d269d1332f20'
)

// Wallet connected to a provider
const senderWalletMnemonic = ethers.Wallet.fromMnemonic(
  mnemonic(),
  "m/44'/60'/0'/0/0"
);

let signer = senderWalletMnemonic.connect(provider)

const partnersRegistryContract = new ethers.Contract(
  partnersRegistryAddress,
  partnersRegistryAbi,
  signer,
)

const ditoContract = new ethers.Contract(
  distributedTownAddress,
  distributedTownAbi,
  signer,
)

async function setPartnersRegistryAddress() {
  const createTx = await ditoContract.setPartnersRegistryAddress(
    partnersRegistryAddress
  )
  const res = await createTx.wait()
}
async function createPartnersAgreement() {
  const url =
    'https://hub.textile.io/ipfs/bafkreicezefuc6einewxdqhlpefelzjponwdqt4vmp2byosq5uwpn7hgoq'
  const createTx = await partnersRegistryContract.create(
    url,  
    1,
    3,
    100,
    '0x1d08c93724741eE0E43ac9D623A127F48B16c2a8',
    50

  )
  const createTxResult = await createTx.wait()
  const { events } = createTxResult
  console.log(events);
  const pa = events.logs[0].args[0];
  const partnersAgreementCreatedEventEmitted = events.find(
    (e) => e.event === 'PartnersAgreementCreated',
  )

  assert.isOk(
    partnersAgreementCreatedEventEmitted,
    'PartnersAgreementCreated event emitted',
  )

  return pa;
}

async function activatePA(partnersAgreementAddress) {


  const partnersAgreementContract = new ethers.Contract(
    partnersAgreementAddress,
    partnersAgreementAbi,
    signer,
  )

  const isActiveBefore = await partnersAgreementContract.isActive();

  assert.isFalse(
    isActiveBefore,
    'Not active before activation.',
  )
  const createTx = await partnersAgreementContract.activatePA();
  await createTx.wait()

  const isActiveAfter = await partnersAgreementContract.isActive();

  assert.isTrue(
    isActiveAfter,
    'Activated!',
  )
}


async function isActive(partnersAgreementAddress) {


  const partnersAgreementContract = new ethers.Contract(
    partnersAgreementAddress,
    partnersAgreementAbi,
    signer,
  )

  const isActive = await partnersAgreementContract.isActive();
    console.log('isActive', isActive)
}


async function test() {
  // await setPartnersRegistryAddress();
  // await createPartnersAgreement()
  // await activatePA('0xDB29E7D4598C164aE78a1a4075320Acb46d64D8d')
  await isActive('0xDB29E7D4598C164aE78a1a4075320Acb46d64D8d');
}

test()


// partnersAgreementAddress: '0xDB29E7D4598C164aE78a1a4075320Acb46d64D8d',
// communityAddress: '0xC77406a6fA434dBDF64dD6e18745240De50cfbe4'