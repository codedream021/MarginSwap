// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

import "./mBNB.sol";
import "./interfaces/IVBNB.sol";
import "./interfaces/IVBep20.sol";
import "./interfaces/IVenus.sol";
import "./interfaces/IVenusOracle.sol";
import "./interfaces/IPancakeRouter.sol";

contract MarginSwap {
    // POOLS
    //uint public collateralBNB; // BNB collateral in Venus
    //uint public borrowDAI; // amount of DAI borrowed from Venus 
    //uint public borrowBNB = 0; // BNB equivilent of borrowDAI
    //uint public equityBNB = 0; // BNB in collateral that is equity (collateralBNB - borrowBNB)
    uint public ATHmBNB = 1e18; // highest price of mBNB in BUSD value
    address public owner;

    IMBNB public immutable mbnb;
    IERC20 public constant busd = IERC20(0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56);

    IVenus public constant venus = IVenus(0xfD36E2c2a6789Db23113685031d7F16329158384);
    IERC20 public constant xvs = IERC20(0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63);
    IVBNB public constant vBNB = IVBNB(0xA07c5b74C9B40447a954e1466938b865b6BBea36);
    IVBep20 public constant vBusd = IVBep20(0x95c78222B3D6e262426483D42CfA53685A67Ab9D);
    IVenusOracle public constant venusOracle = IVenusOracle(0xd8B6dA2bfEC71D684D3E2a2FC9492dDad5C3787F);

    IPancakeRouter public constant pancakeRouter = IPancakeRouter(0x10ED43C718714eb63d5aA57B78B54704E256024E);
    
    // ADMIN adjustable
    uint public constant DENOMINATOR = 10000;
    uint public constant PRICE_DENOMINATOR = 1e18;
    uint public leverageTarget = 20000; // equals 2x leverage(200%). 1.5x would be 150
    uint public tradingFee = 100; // (tradingFee/DENOMINATOR)*100% each trade 1% (to Owner) each trade 1% (to Owner)
    uint public performanceFee = 500;// 5% of new ATH gain on mBNB (to Owner)
    uint public redemptionFee = 100; // when redeem mBNB to cover slippage (to mBNB holders)  
   
    modifier onlyOwner() {
       require(msg.sender == owner, "!owner");
      _;
    } 
    
    // -----   Constructor ------------- //
    constructor() {
        owner = msg.sender;
        mBNB _mbnb = new mBNB();
        mbnb = IMBNB(_mbnb);
    }

    receive() external payable {
    }
    
    // -----   Admin Functions ------------- //
    function transferOwnership(address _newOwner) onlyOwner external {
        owner = _newOwner;
    }
    
    function updateRatio(uint256 _leverageTarget, uint256 _tradingFee, uint256 _performanceFee, uint256 _redemptionFee) onlyOwner external {
        leverageTarget = _leverageTarget;
        tradingFee = _tradingFee;
        performanceFee = _performanceFee;
        redemptionFee = _redemptionFee;
    }

    // -----   Utility Functions ----------- //

    function getValue(uint256 _amount, uint256 _price) internal pure returns(uint256) {
        return _amount * _price / PRICE_DENOMINATOR;
    }

    function getAssetAmount(uint256 _usdAmount, uint256 _price) internal pure returns(uint256) {
        return _usdAmount * PRICE_DENOMINATOR / _price;
    }

    function fraction(uint256 _amount, uint256 _ratio) internal pure returns(uint256) {
        return _amount * _ratio / DENOMINATOR;
    }

    function sendFee(uint256 _fee) internal {
        collateralWithdrawal(_fee);
        payable(owner).transfer(_fee);
    }
    
    function mBNBtoBNB() public returns(uint) { // in BNB value
        uint equityBNB = collateralBNB() - getAssetAmount(borrowedBUSD(), priceBNB());
        if (equityBNB <= 0) {
            return 1e18; // 1 BNB for 1 mBNB
        } else {
            return equityBNB * 1e18 / mbnb.totalSupply();
        }
    }
 
    // ----- Deposits & Withdrawals   ------ //
    function depositBNB() public payable{
        uint priceAsBNB = mBNBtoBNB();
        uint mBNBamount = getValue(msg.value, priceAsBNB); // calculate amount of mBNB to mind and send
        collateralSupply(msg.value); // send deposited BNB to Venus collateral 
        mbnb.mint(msg.sender, mBNBamount);// mint mBNBamount
    }
    
    function redeemBNB(uint mBNBamount) public {
        uint priceAsBNB = mBNBtoBNB(); // get price of mBNB (in BNB/mBNB)
        mbnb.transferFrom(msg.sender, address(this), mBNBamount);
        mbnb.burn(mBNBamount);
        uint bnbAmount = getValue(mBNBamount, priceAsBNB);
        uint feeAmount = fraction(bnbAmount, redemptionFee);
        uint amountBNB = bnbAmount - feeAmount;// get amount of BNB to withdrawal 
        if(address(this).balance < amountBNB){
            if(collateralBNB() < amountBNB){
                borrowRepay(getValue(amountBNB, priceBNB())); // first repay BUSD with collateralBNB
            }
            collateralWithdrawal(amountBNB); // withdrawal collateral from Venus
        }
        // send amountBNB back to user
        payable(msg.sender).transfer(amountBNB);
    }
    
    // ----- Venus Functions ------ // 
    function collateralBNB() public returns(uint) { 
        // fetch collateral BNB quantity from Venus 
        // return that value
        return vBNB.balanceOfUnderlying(address(this));
    }
    
    function borrowedBUSD() public returns(uint) { 
        // fetch borrow BUSD quantity from Venus 
        // return that value 
        return vBusd.borrowBalanceCurrent(address(this));
    }
    
    function enableCollateral() public onlyOwner {
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
        // withdrawal BNB collateral
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
    
    function priceBNB() public view returns(uint256) { //have it exact BUSD
        // from PancakeSwap, or the Venus Price Oracle (preferred)
        // https://github.com/VenusProtocol/venus-protocol/blob/master/contracts/VenusPriceOracle.sol
        return venusOracle.getUnderlyingPrice(address(vBNB));
    }
    
    // ----- PancakeSwap Functions 
    function buyBUSD(uint amountBUSD) internal { //have it exact BUSD
        // sell BNB for BUSD on PancakeSwap 
        uint fee = getValue(fraction(amountBUSD,tradingFee), priceBNB());
        uint256 price = priceBNB();
        uint256 inputBNB = getAssetAmount(amountBUSD, price) * 101 / 100; // 1% slippage
        address wbnb = pancakeRouter.WETH();
        address[] memory path = new address[](2);
        path[0] = wbnb;
        path[1] = address(busd);
        pancakeRouter.swapETHForExactTokens{value:inputBNB}(amountBUSD, path, address(this), block.timestamp);
        // send tradingFeeAmount from collateralBNB to owner
        sendFee(fee);
    }
    
    function buyBNB(uint amountBUSD) internal {
        // sell BUSD for BNB on PancakeSwap 
        uint fee = getValue(fraction(amountBUSD, tradingFee), priceBNB());
        uint256 price = priceBNB();
        uint256 minBNB = getAssetAmount(amountBUSD, price) * 99 / 100; // 1% slippage
        address wbnb = pancakeRouter.WETH();
        address[] memory path = new address[](2);
        path[0] = address(busd);
        path[1] = wbnb;
        pancakeRouter.swapExactTokensForETH(amountBUSD,  minBNB, path, address(this), block.timestamp);
        // send tradingFeeAmount from collateralBNB to owner
        sendFee(fee);
    }

    // ---- Rebalance Mechanism ----- // 
    function performanceFees() internal {
        uint mBNBtoBNBNow = mBNBtoBNB(); // 3.5 means 3.5 mBNB per BNB
        if (mBNBtoBNBNow > ATHmBNB) {
            uint fee = (mBNBtoBNBNow - ATHmBNB)*borrowedBUSD() / ATHmBNB;
            // send feeBNB to owner from collateralBNB
            sendFee(fee); 
            ATHmBNB = mBNBtoBNBNow; //update mBNB all time high price 
        }
    }
    
    function borrowBNB(uint amountBUSD) internal { // purchases BNB with borrowed BUSD
        borrow(amountBUSD); // first borrow BUSD
        buyBNB(amountBUSD); // then trade for BNB 
        collateralSupply(getValue(amountBUSD, priceBNB())); // then post as collateral 
    }
    
    function repayBNB(uint amountBUSD) internal { // repays BUSD with collateral BNB 
        collateralWithdrawal(getValue(amountBUSD, priceBNB())); // first withdrawal collateral 
        buyBUSD(amountBUSD); // then sell BNB for BUSD 
        borrowRepay(amountBUSD); // then repay BUSD 
    }
    
    function rebalance() public {
        uint leverageFactor = leverageTarget/DENOMINATOR; // value of 2 will be 2x leverage position of BNB 
        uint targetLoan = getValue(collateralBNB(), priceBNB())*(leverageFactor - 1)/leverageFactor; // target BUSD loan
        int rebalanceAmount = int(targetLoan) - int(borrowedBUSD()); // positive if need more loan
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
