contract Baconbook {
    
    
    // POOLS
    uint public collateralBNB; // BNB collateral in Venus
    uint public borrowDAI; // amount of DAI borrowed from Venus 
    //uint public borrowBNB = 0; // BNB equivilent of borrowDAI
    //uint public equityBNB = 0; // BNB in collateral that is equity (collateralBNB - borrowBNB)
    uint public ATHmBNB = 0; // highest price of mBNB in BUSD value
    uint public mBNBprice = 100;
    address public OwnerAddress;
    address public mBNBaddress;

    
    // ADMIN adjustable 
    uint public leverageTarget = 200; // equals 2x leverage. 1.5x would be 150
    uint public tradingFee = 100; // each trade 1% (to Owner)
    uint public performanceFee = 500;// 5% of new ATH gain on mBNB (to Owner)
    uint public redemptionFee = 100; // when redeem mBNB to cover slippage (to mBNB holders)  
    
    
    // -----   Constructor ------------- //
    
    constructor(address _mBNBaddress) public {
        OwnerAddress = msg.sender;
        mBNBaddress = _mBNBaddress;
    }
    
    // -----   Admin Functions ------------- //
    
    function adminUpdate() onlyOwner() {
        // ability to update leverageTarget, tradingFee, performanceFee, redemptionFee
    }
    
 
    // ----- Deposits & Withdrawals   ------ //
    
    function mBNBprice() public returns(uint) { // in BNB value 
        uint equityBNB = collateralBNB() - (borrowBUSD()/priceBNB())
        if (equityBNB <= 0) {
            mBNBprice = 100;
        } else {
            mBNBprice = mBNBaddress.supply() / (equityBNB/priceBNB())
        }
        return mBNBprice
    }
    
    function depositBNB(uint amountBNB) public {
        uint mBNBprice = mBNBprice();
        uint mBNBamount = amountBNB * mBNBprice; // calculate amount of mBNB to mind and send
        collateralSupply(amountBNB); // send deposited BNB to Venus collateral 
        mBNBaddress.mint(mBNBamount);// mint mBNBamount
        // send mBNBamount to depositor
    }
    
    function redeemBNB(uint mBNBamount) public {
        uint mBNBprice = mBNBprice(); // get price of mBNB
        uint amountBNB = mBNBamount * mBNBprice * (1 - redemptionFee/1000); // get amount of BNB to withdrawal 
        repayBNB(amountBNB*priceBNB()); // first repay BUSD with collateralBNB
        collateralWithdrawal(amountBNB); // withdrawal collateral from Venus
        // send amountBNB back to user 
    }
    

    
    // ----- Venus Functions ------ // 
    
    function collateralBNB() public returns(uint) { 
        // fetch collateral BNB quantity from Venus 
        // return that value 
    }
    
    function borrowBUSD() public returns(uint) { 
        // fetch borrow BUSD quantity from Venus 
        // return that value 
    }
    
    function enableCollateral() public onlyOwner { // can create the onlyOwner function as well 
        // must turn collateral 
    }
    
    function collateralSupply(uint amountBNB) public {
        // add more BNB as collateral 
    }
    
    function collateralWithdrawal(uint amountBNB) public {
        // withdrawal BNB collaterall
    }
    
    function borrow(uint amountBUSD) public {
        // make sure within Borrow Limit
        // borrow amountBUSD from Venus
    }
    
    function borrowRepay(uint amountBUSD) public {
        // make sure smart contract has enough BUSD to repay
        // repay borrowed BUSD by amountBUSD 
    }
    
    function redeemXVS() public {
        // redeem all XVS that has been earned
    }
    
    
    
    // ----- PancakeSwap Functions 
    
    function priceBNB(uint amountBUSD) public { //have it exact BUSD
        // returns midprice at depth "uint" after slippage 
        // from PancakeSwap, BNB = 800
    }
    
    function buyBUSD(uint amountBUSD) internal { //have it exact BUSD
        // sell BNB for BUSD on PancakeSwap 
        uint tradingFeeAmount = amountBUSD * (tradingFee/10000) * priceBNB()
        // send tradingFeeAmount from collateralBNB to  OwnerAddress
    }
    
    function buyBNB(uint amountBUSD) internal {
        // sell BUSD for BNB on PancakeSwap 
        uint tradingFeeAmount = amountBUSD * (tradingFee/10000) * priceBNB()
        // send tradingFeeAmount from collateralBNB to  OwnerAddress
    }

    
    // ---- Rebalance Mechanism ----- // 
    
    function performanceFees() internal {
        uint mBNBpriceNow = mBNBprice()
        if (mBNBpriceNow > ATHmBNB) {
            uint feeBNB = (mBNBpriceNow/ATHmBNB - 1)*borrowBNB 
            // send feeBNB to OwnerAddress from collateralBNB  
            ATHmBNB = mBNBpriceNow; //update mBNB all time high price 
        }
    }
    
    function borrowBNB(uint amountBUSD) internal { // purchases BNB with borrowed BUSD
        borrow(amountBUSD) // first borrow BUSD
        buyBNB(amountBUSD) // then trade for BNB 
        collateralSupply(amountBUSD/priceBNB()) // then post as collateral 
    }
    
    function repayBNB(uint amountBUSD) internal { // repays BUSD with collateral BNB 
        collateralWithdrawal(amountBUSD/priceBNB()) // first withdrawal collateral 
        buyBUSD(amountBUSD) // then sell BNB for BUSD 
        borrowRepay(amountBUSD) // then repay BUSD 
    }
    
    
    function rebalance() public {
        uint targetLoan = collateralBNB*priceBNB()*(leverageTarget-1/leverageTarget);
        uint rebalanceAmount = targetLoan - borrowDAI; // positive if need more loan
        performanceFees(); // run performance fee calculation
        if (rebalanceAmount > 0) { // could have it as a threshold
            borrowBNB(rebalanceAmount) // borrow DAI to buy BNB 
        } else {
            // require(); 
            repayBNB(-rebalanceAmount) // use BNB to repay loan 
        }
        redeemXVS()
        // send 50% of redeemed XVS to OwnerAddress and other 50% to rebalancer (msg.sender)
        
    }
    

