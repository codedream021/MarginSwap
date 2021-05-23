import "@nomiclabs/hardhat-waffle";
import "solidity-coverage";
import "hardhat-spdx-license-identifier";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
// input your privateKey here
// this private key will be used to deploy the contracts
// ***DO NOT ADD THIS TO GITHUB***
const privateKey = "";
export default {
  abiExporter: {
    path: './abi',
    clear: false,
    flat: true,
  },
  spdxLicenseIdentifier: {
    overwrite: true,
    runOnCompile: true,
  },
  solidity: {
    compilers :[
      {
        version: "0.8.4",
        settings: {
          optimizer : {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  networks: {
    hardhat: {
      gas: 10000000,
      accounts: {
        accountsBalance: "1000000000000000000000000"
      },
      allowUnlimitedContractSize: true,
      timeout: 1000000
    },
    coverage: {
      url: 'http://localhost:8555'
    },
    mainnet: {
      url: 'https://infura.io/v3/d3979c2248d34fa9a0ccf4c84ebb753d',
//      accounts: [
//        privateKey
//      ]
    },
    ropsten: {
      url: 'https://ropsten.infura.io/v3/d3979c2248d34fa9a0ccf4c84ebb753d',
      accounts: [
        '0xa14cfd86bcd9aac74f04aa4fefe5ed3cfb564a096b6766df04f492c688dbc456'
      ]
    }
  }
};

