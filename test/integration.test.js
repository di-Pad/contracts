// const partnersRegistryAddress = '0x6994Ca125793ABD5BDD0d912e4283ED1c542ceb7'
// const distributedTownAddress = '0x1d08c93724741eE0E43ac9D623A127F48B16c2a8'
const partnersRegistryAddress = '0x7a95A9f0A99fb21548e58821059502C85c193956';
const distributedTownAddress = '0xf628bdee30627558aAe8c19d1522b08A2bfb6423';
const { assert } = require('chai')
var ethers = require('ethers')
var partnersRegistryAbi = require('../artifacts/contracts/PartnersRegistry.sol/PartnersRegistry.json')
  .abi

var partnersAgreementAbi = require('../artifacts/contracts/PartnersAgreement.sol/PartnersAgreement.json')
  .abi
var distributedTownAbi = require('../artifacts/contracts/IDistributedTown.sol/IDistributedTown.json')
  .abi

// const userAddress = '0x2CEF62C91Dd92FC35f008D1d6Ed08EADF64306bc';
function mnemonic() {
  return 'close gesture fatal vacant time toy general horror payment visit case you'
}

const provider = new ethers.providers.JsonRpcProvider(
  // 'https://rpc-mumbai.maticvigil.com',

  'https://kovan.infura.io/v3/779285194bd146b48538d269d1332f20'
)

// Wallet connected to a provider
const senderWalletMnemonic = ethers.Wallet.fromMnemonic(
  mnemonic(),
  "m/44'/60'/0'/0/0",
)

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
    partnersRegistryAddress,
  )
  const res = await createTx.wait()
  console.log(res)
}
async function createPartnersAgreement() {
  const url =
    'https://hub.textile.io/ipfs/bafkreicezefuc6einewxdqhlpefelzjponwdqt4vmp2byosq5uwpn7hgoq'
  const createTx = await partnersRegistryContract.create(
    url,
    0,
    3,
    100,
    '0x1d08c93724741eE0E43ac9D623A127F48B16c2a8',
    50,
    // { gasPrice: 10000000, gasLimit: 85000 }

  )
  const createTxResult = await createTx.wait()
  const { events } = createTxResult
  const partnersAgreementCreatedEventEmitted = events.find(
    (e) => e.event === 'PartnersAgreementCreated',
  )

  assert.isOk(
    partnersAgreementCreatedEventEmitted,
    'PartnersAgreementCreated event emitted',
  )
}

async function test() {
//   await setPartnersRegistryAddress();
  await createPartnersAgreement()
}

test()
