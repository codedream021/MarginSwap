import "@nomiclabs/hardhat-waffle";
import {ethers} from "ethers";
import "solidity-coverage";
import "hardhat-spdx-license-identifier";
import "hardhat-abi-exporter";
import "hardhat-gas-reporter";
// input your privateKey here
// this private key will be used to deploy the contracts
// ***DO NOT ADD THIS TO GITHUB***
const privateKey = "";
const bscUrl = "https://bsc.getblock.io/mainnet/?api_key=a0585443-21fd-4da6-a347-373e9be47bb3";

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
      forking: {
        url: bscUrl,
      },
      timeout: 6000000
    },
    coverage: {
      url: 'http://localhost:8555'
    },
    mainnet: {
      url: 'https://bsc-dataseed1.binance.org:443',
    }
  },
  mocha: {
    timeout: 2000000
  }

};

