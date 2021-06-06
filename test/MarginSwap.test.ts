import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { Contract, Signer, BigNumber, constants } from "ethers";

describe("MarginSwap", function(){
  let accounts: Signer[];
  let marginSwap: Contract;
  let vBNB: Contract;
  let mBNB: Contract;
  let owner: Signer;
  let user: Signer;
  const resetFork = async () => {
    const url = hre.config.networks.hardhat.forking.url;
    const temp = new ethers.providers.JsonRpcProvider(url);
    const latest = await temp.send(
      "eth_blockNumber",[]
    );
    const forkBlock = BigNumber.from(latest).toNumber() - 32;
    console.log("Fork : " + forkBlock);
    await ethers.provider.send(
      "hardhat_reset",
      [{
        forking: {
          jsonRpcUrl: url,
          blockNumber: forkBlock
        }
      }]
    );
  };
  beforeEach(async function(){
    await resetFork();
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user = accounts[1];

    const MarginSwapFactory = await ethers.getContractFactory("MarginSwap");
    marginSwap = await MarginSwapFactory.deploy();
    vBNB = await ethers.getContractAt("IVBNB", await marginSwap.vBNB());
    mBNB = await ethers.getContractAt("mBNB", await marginSwap.mbnb());
  });

  it("should be able to enter market", async function(){
    await marginSwap.enableCollateral();
  });

  describe("deposit & withdraw", function(){
    const amount = BigNumber.from("1000000000000000000");
    beforeEach(async function(){
      await marginSwap.enableCollateral();
    });

    it("should be able to deposit bnb", async function(){
      await marginSwap.connect(user).depositBNB({value: amount});
      const vbnbBal = await vBNB.balanceOf(marginSwap.address);
      const rate = await vBNB.exchangeRateStored();
      console.log(vbnbBal.mul(rate).div(amount).toString());
      console.log((await mBNB.callStatic.balanceOf(user.getAddress())).toString());
      console.log((await marginSwap.callStatic.mBNBtoBNB()).toString());
      await mBNB.connect(user).approve(marginSwap.address, amount);
      await marginSwap.connect(user).redeemBNB(amount);
    });
  });
});
