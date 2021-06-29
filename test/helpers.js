var eccryptoJS = require('eccrypto-js');
var axios = require('axios');

const generateKeyPair = () => {
    const key = eccryptoJS.generateKeyPair();
    const hex = key.publicKey.toString('hex');
    console.log("PUBLIC KEY HEX", hex);

    const hashed = eccryptoJS.keccak256(Buffer.from(hex));
    const pubKey = eccryptoJS.bufferToHex(hashed);
    console.log("PUBLIC KEY HASHED", pubKey);

    return { pubKey, privKey: key.privateKey }
}

const getNonce = async (skillWalletId, action) => {
    const res = await axios.post(`https://api.skillwallet.id/api/skillwallet/${skillWalletId}/nonces?action=${action}`);
    const nonce = res.data.nonce.toString();
    return nonce;
}

const signAction = () => {
    const signed = eccryptoJS.sign(key.privateKey, hash, true);
    console.log("SIGNED STRING", eccryptoJS.bufferToHex(signed));
    const signature = eccryptoJS.bufferToHex(signed);
    return signature;
}