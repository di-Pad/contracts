const partnersRegistryAddress = '0xAa4bd2A6C5e757FB39B7D01384823377Dfc58e4d'
const distributedTownAddress = '0x3AF9ba336effE591bfC0BF0ADe8Ec5e069589075'
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
    50,
    { gasPrice: 1000000000, gasLimit: 850000 }

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
  await setPartnersRegistryAddress();
  // await createPartnersAgreement()
}

test()
