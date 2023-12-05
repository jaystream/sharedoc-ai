require("@nomicfoundation/hardhat-toolbox");

const INFURA_API_KEY = "17c98e2fc4b24a12962bf2e69d0bfad7";

// Replace this private key with your Sepolia account private key
// To export your private key from Coinbase Wallet, go to
// Settings > Developer Settings > Show private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const SEPOLIA_PRIVATE_KEY = "df041e67dff91e0aa7218708dd45e8eae675dc1ef007baf6b4e7771bcfe8c128";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.22",
  settings: {
    optimizer: {
      enabled: true,
      runs: 10000,
    },
  },
  networks: {
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
      accounts: [SEPOLIA_PRIVATE_KEY]
    },
    hardhat: {
      chainId: 1337,
    },
    localhost: {
      url: "http://localhost:8545"
    }
  },
  paths: {
    artifacts: './src/artifacts'
  }
};
