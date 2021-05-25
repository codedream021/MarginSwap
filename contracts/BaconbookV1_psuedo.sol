// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

import "./interfaces/IMBNB.sol";
import "./interfaces/IVBNB.sol";
import "./interfaces/IVBep20.sol";
import "./interfaces/IVenus.sol";

contract Baconbook {
    
    // POOLS
    //uint public collateralBNB; // BNB collateral in Venus
    //uint public borrowDAI; // amount of DAI borrowed from Venus 
    //uint public borrowBNB = 0; // BNB equivilent of borrowDAI
    //uint public equityBNB = 0; // BNB in collateral that is equity (collateralBNB - borrowBNB)
    uint public ATHmBNB = 0; // highest price of mBNB in BUSD value
    address public owner;
    IMBNB public mBNB;
    IVenus public venus;
    IERC20 public xvs;
    IVBNB public vBNB;
    IERC20 public busd;
    IVBep20 public vBusd;

    
    // ADMIN adjustable
    uint public constant DENOMINATOR = 10000;
    uint public leverageTarget = 20000; // equals 2x leverage(200%). 1.5x would be 150
    uint public tradingFee = 100; // each trade 1% (to Owner)
    uint public performanceFee = 500;// 5% of new ATH gain on mBNB (to Owner)
    uint public redemptionFee = 100; // when redeem mBNB to cover slippage (to mBNB holders)  
   
    modifier onlyOwner() {
       require(msg.sender == owner, "!owner");
      _;
    } 
    
    // -----   Constructor ------------- //
    
    constructor(address _mBNB) public {
        owner = msg.sender;
        mBNB = IMBNB(_mBNB);
    }
    
    // -----   Admin Functions ------------- //
    
    function adminUpdate() onlyOwner external {
        // ability to update leverageTarget, tradingFee, performanceFee, redemptionFee
    }
    
 
    // ----- Deposits & Withdrawals   ------ //
    
    function mBNBprice() public returns(uint) { // in BNB value 
        uint equityBNB = collateralBNB() - (borrowBUSD()/priceBNB());
        if (equityBNB <= 0) {
            return 100;
        } else {
            return equityBNB / mBNB.totalSupply;
        }
    }
    
    function depositBNB() public payable{
        uint price = mBNBprice();
        uint mBNBamount = msg.value / price; // calculate amount of mBNB to mind and send
        collateralSupply(msg.value); // send deposited BNB to Venus collateral 
        mBNB.mint(msg.sender, mBNBamount);// mint mBNBamount
    }
    
    function redeemBNB(uint mBNBamount) public {
        uint price = mBNBprice(); // get price of mBNB
        uint amountBNB = mBNBamount * price * (1 - redemptionFee/DENOMINATOR); // get amount of BNB to withdrawal 
        borrowRepay(amountBNB*priceBNB()); // first repay BUSD with collateralBNB
        collateralWithdrawal(amountBNB); // withdrawal collateral from Venus
        // send amountBNB back to user
        payable(msg.sender).transfer(mBNBamount);
    }
    

    
    // ----- Venus Functions ------ // 
    
    function collateralBNB() public returns(uint) { 
        // fetch collateral BNB quantity from Venus 
        // return that value
        return vBNB.balanceOfUnderlying(address(this));
    }
    
    function borrowBUSD() public returns(uint) { 
        // fetch borrow BUSD quantity from Venus 
        // return that value 
        return vBusd.borrowBalanceCurrent(address(this));
    }
    
    function enableCollateral() public onlyOwner { // can create the onlyOwner function as well 
        // must turn collateral
        address[] memory market = new address[](2);
        market[0] = address(vBNB);
        market[1] = address(vBusd);
        venus.enterMarkets(market);
    }
    
    function collateralSupply(uint amountBNB) internal {
        // add more BNB as collateral
        // it is ok to not "require" on this since vBNB handles error on mint
        vBNB.mint{value:amountBNB}();
    }
    
    function collateralWithdrawal(uint amountBNB) internal {
        // withdrawal BNB collaterall
        require(vBNB.redeemUnderlying(amountBNB) == 0, "!withdraw");
    }
    
    function borrow(uint amountBUSD) internal {
        // make sure within Borrow Limit
        // borrow amountBUSD from Venus
        require(vBusd.borrow(amountBUSD) == 0, "!borrow");
    }
    
    function borrowRepay(uint amountBUSD) internal {
        // make sure smart contract has enough BUSD to repay
        // repay borrowed BUSD by amountBUSD
        busd.approve(address(vBusd), amountBUSD);
        require(vBusd.repayBorrow(amountBUSD) == 0, "!repay");
    }
    
    function redeemXVS() internal {
        // redeem all XVS that has been earned
        venus.claimVenus(address(this));
    }
    
    // ----- PancakeSwap Functions 
    
    function priceBNB() public returns(uint256) { //have it exact BUSD
        // returns midprice at depth "uint" after slippage 
        // from PancakeSwap, BNB = 800
    }
    
    function buyBUSD(uint amountBUSD) internal { //have it exact BUSD
        // sell BNB for BUSD on PancakeSwap 
        uint tradingFeeAmount = amountBUSD * (tradingFee/10000) * priceBNB();
        // send tradingFeeAmount from collateralBNB to  owner
    }
    
    function buyBNB(uint amountBUSD) internal {
        // sell BUSD for BNB on PancakeSwap 
        uint tradingFeeAmount = amountBUSD * (tradingFee/10000) * priceBNB();
        // send tradingFeeAmount from collateralBNB to  owner
    }

    
    // ---- Rebalance Mechanism ----- // 
    
    function performanceFees() internal {
        uint mBNBpriceNow = mBNBprice();
        if (mBNBpriceNow > ATHmBNB) {
            uint feeBNB = (mBNBpriceNow/ATHmBNB - 1)*borrowBUSD();
            // send feeBNB to owner from collateralBNB  
            ATHmBNB = mBNBpriceNow; //update mBNB all time high price 
        }
    }
    
    function borrowBNB(uint amountBUSD) internal { // purchases BNB with borrowed BUSD
        borrow(amountBUSD); // first borrow BUSD
        buyBNB(amountBUSD); // then trade for BNB 
        collateralSupply(amountBUSD/priceBNB()); // then post as collateral 
    }
    
    function repayBNB(uint amountBUSD) internal { // repays BUSD with collateral BNB 
        collateralWithdrawal(amountBUSD/priceBNB()); // first withdrawal collateral 
        buyBUSD(amountBUSD); // then sell BNB for BUSD 
        borrowRepay(amountBUSD); // then repay BUSD 
    }
    
    
    function rebalance() public {
        uint targetLoan = collateralBNB()*priceBNB()*(leverageTarget-1/leverageTarget);
        int rebalanceAmount = int(targetLoan) - int(borrowBUSD()); // positive if need more loan
        performanceFees(); // run performance fee calculation
        if (rebalanceAmount > 0) { // could have it as a threshold
            borrowBNB(uint256(rebalanceAmount)); // borrow DAI to buy BNB 
        } else {
            // require(); 
            repayBNB(uint256(-rebalanceAmount)); // use BNB to repay loan 
        }
        redeemXVS();
        uint256 xvsBalance = xvs.balanceOf(address(this));
        // send 50% of redeemed XVS to owner and other 50% to rebalancer (msg.sender)
        xvs.transfer(msg.sender, xvsBalance/2);
        xvs.transfer(owner, xvsBalance/2);
    }
}   

