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

    const MarginSwapFactory = await ethers.getContractFactory("MarginSwapTestnet");
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
      await marginSwap.connect(owner).setSlippage(9900);
      const vbnbBal = await vBNB.balanceOf(marginSwap.address);
      const rate = await vBNB.exchangeRateStored();
      console.log(vbnbBal.mul(rate).div(amount).toString());
      console.log((await mBNB.callStatic.balanceOf(user.getAddress())).toString());
      console.log((await marginSwap.callStatic.mBNBtoBNB()).toString());
      await mBNB.connect(user).approve(marginSwap.address, amount);
      await marginSwap.connect(user).redeemBNB(amount);
    });
  });
  describe("deposit -> rebalance ->  withdraw", function(){
    const amount = BigNumber.from("1000000000000000000");
    beforeEach(async function(){
      await marginSwap.enableCollateral();
    });

    it("should be able to deposit bnb", async function(){
      await marginSwap.connect(user).depositBNB({value: amount});
      await marginSwap.connect(owner).setSlippage(9900);
      await marginSwap.connect(user).rebalance();
      await marginSwap.connect(user).depositBNB({value: amount});
      console.log("rebalance done");
      const vbnbBal = await vBNB.balanceOf(marginSwap.address);
      const rate = await vBNB.exchangeRateStored();
      await mBNB.connect(user).approve(marginSwap.address, amount);
      await marginSwap.connect(user).redeemBNB(amount);
    });
  });
  describe.only("deposit 0.1  -> rebalance -> rebalance  -> failed withdraw 0.05 mbnb -> withdraw 0.01 mbnb", function(){
    const amount = BigNumber.from("100000000000000000");
    beforeEach(async function(){
      await marginSwap.enableCollateral();
    });

    it("should be able to deposit bnb", async function(){
      await marginSwap.connect(user).depositBNB({value: amount});
      await marginSwap.connect(owner).setSlippage(9900);
      await marginSwap.connect(user).rebalance();
      await marginSwap.connect(user).rebalance();
      console.log("rebalance done");
      const vbnbBal = await vBNB.balanceOf(marginSwap.address);
      const rate = await vBNB.exchangeRateStored();
      await mBNB.connect(user).approve(marginSwap.address, amount);
      await expect(marginSwap.connect(user).redeemBNB(amount.div(2))).to.be.reverted;
      await marginSwap.connect(user).redeemBNB(amount.div(10));
    });
  });
});
