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
    IERC20 public immutable busd;

    IVenus public immutable venus;
    IERC20 public immutable xvs;
    IVBNB public immutable vBNB;
    IVBep20 public immutable vBusd;
    IVenusOracle public immutable venusOracle;

    IPancakeRouter public immutable pancakeRouter;

    // ADMIN adjustable
    uint public constant DENOMINATOR = 10000;
    uint public constant PRICE_DENOMINATOR = 1e18;
    uint public leverageTarget = 20000; // equals 2x leverage(200%). 1.5x would be 150. 
    uint public tradingFee = 100; // (tradingFee/DENOMINATOR)*100% each trade 1% (to Owner) each trade 1% (to Owner)
    uint public performanceFee = 500;// 5% of new ATH gain on mBNB (to Owner)
    uint public redemptionFee = 100; // when redeem mBNB to cover slippage (to mBNB holders) 
    uint public ownerFeeXVS = 5000; // 50% is 5000. 50% of XVS redemption goes to owner at rebalance
    uint public slippage = 100; // 100 is 1% slippage

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    } 

    // -----   Constructor ------------- //
    constructor(address _busd, address _venus, address _xvs, address _vBNB, address _vBusd, address _venusOracle, address _pancakeRouter) {
        owner = msg.sender;
        mBNB _mbnb = new mBNB();
        mbnb = IMBNB(_mbnb);

        busd = IERC20(_busd);
        venus = IVenus(_venus);
        xvs = IERC20(_xvs);
        vBNB = IVBNB(_vBNB);
        vBusd = IVBep20(_vBusd);
        venusOracle = IVenusOracle(_venusOracle);
        pancakeRouter = IPancakeRouter(_pancakeRouter);
    }

    receive() external payable {
    }

    // -----   Admin Functions ------------- //
    function transferOwnership(address _newOwner) onlyOwner external {
        owner = _newOwner;
    }

    function setSlippage(uint256 _slippage) onlyOwner external {
        slippage = _slippage;
    }

    function updateRatio(uint256 _leverageTarget, uint256 _tradingFee, uint256 _performanceFee, uint256 _redemptionFee, uint256 _ownerFeeXVS) onlyOwner external {
        leverageTarget = _leverageTarget;   // maximum 4x (40000)
        tradingFee = _tradingFee;           // maximum 5% (500)
        performanceFee = _performanceFee;  // maximum 50% (5000)
        redemptionFee = _redemptionFee;    // maximum 10% (1000)
        ownerFeeXVS = _ownerFeeXVS;        // maximum 100% (10000)
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
        payable(owner).transfer(_fee);
    }

    function mBNBtoBNB() public returns(uint) { // in BNB value
        int equityBNB = int256(collateralBNB()) - int256(getAssetAmount(borrowedBUSD(), priceBNB()));
        if (equityBNB < 0) { // if negative equity 
            return 0; // mBNB worthless
        } else if (equityBNB == 0) { // starting conditions 
            return 1e18; // 1 BNB for 1 mBNB
        } else {
            return uint256(equityBNB) * 1e18 / mbnb.totalSupply();
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
        collateralWithdrawal(amountBNB); // withdrawal collateral from Venus
        payable(msg.sender).transfer(amountBNB); // send amountBNB back to user
        rebalance();
    }


    // ----- Venus Functions ------ // 
    function collateralBNB() public returns(uint) { // amount of BNB collateral on Venus
        return vBNB.balanceOfUnderlying(address(this));
    }

    function borrowedBUSD() public returns(uint) { // amount of BUSD borrowed from Venus
        return vBusd.borrowBalanceCurrent(address(this));
    }

    function enableCollateral() public onlyOwner { // True, to accumulate XVS for collateral 
        address[] memory market = new address[](2);
        market[0] = address(vBNB);
        market[1] = address(vBusd);
        venus.enterMarkets(market);
    }

    function collateralSupply(uint amountBNB) internal {  //supply BNB as collateral 
        vBNB.mint{value:amountBNB}();
    }

    function collateralWithdrawal(uint amountBNB) internal { // withdrawal BNB collateral 
        borrowRepay(busd.balanceOf(address(this))); // first repay BUSD with collateralBNB
        uint256 res = vBNB.redeemUnderlying(amountBNB);
        require(res == 0, "!withdraw");
    }

    function borrow(uint amountBUSD) internal { // borrow BUSD from Venus
        // make sure within Borrow Limit
        // borrow amountBUSD from Venus
        require(vBusd.borrow(amountBUSD) == 0, "!borrow");
    }

    function borrowRepay(uint amountBUSD) internal { // repay BUSD to Venus
        // make sure smart contract has enough BUSD to repay
        // repay borrowed BUSD by amountBUSD
        busd.approve(address(vBusd), amountBUSD);
        require(vBusd.repayBorrow(amountBUSD) == 0, "!repay");
    }

    function redeemXVS() internal {
        // redeem all XVS that has been earned
        address[] memory market = new address[](2);
        market[0] = address(vBNB);
        market[1] = address(vBusd);
        venus.claimVenus(address(this), market);
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
        uint256 inputBNB = getAssetAmount(amountBUSD, price) * (DENOMINATOR + slippage) / DENOMINATOR; // 1% slippages
        address wbnb = pancakeRouter.WETH();
        address[] memory path = new address[](2);
        path[0] = wbnb;
        path[1] = address(busd);
        pancakeRouter.swapETHForExactTokens{value:inputBNB}(amountBUSD, path, address(this), block.timestamp);
        // send tradingFeeAmount from collateralBNB to owner
        sendFee(fee);
    }

    function buyBNB(uint amountBUSD) internal returns(uint256 bought) {
        // sell BUSD for BNB on PancakeSwap 
        uint256 price = priceBNB();
        uint256 minBNB = getAssetAmount(amountBUSD, price) * (DENOMINATOR - slippage) / DENOMINATOR; // 1% slippage
        address wbnb = pancakeRouter.WETH();
        address[] memory path = new address[](2);
        path[0] = address(busd);
        path[1] = wbnb;
        uint256 before = address(this).balance;
        busd.approve(address(pancakeRouter), amountBUSD);
        pancakeRouter.swapExactTokensForETH(amountBUSD,  minBNB, path, address(this), block.timestamp);
        bought = address(this).balance - before;
        uint fee = fraction(bought, tradingFee);
        bought = bought - fee;
        // send tradingFeeAmount from collateralBNB to owner
        sendFee(fee);
    }

    // ---- Rebalance Mechanism ----- // 
    function performanceFees() internal returns(uint256 fee){
        uint mBNBtoBNBNow = mBNBtoBNB();
        if (mBNBtoBNBNow > ATHmBNB) {
            fee = getAssetAmount((mBNBtoBNBNow - ATHmBNB)*borrowedBUSD() / ATHmBNB, priceBNB());
            // send feeBNB to owner from collateralBNB
            ATHmBNB = mBNBtoBNBNow; //update mBNB all time high price 
        }
    }

    function borrowBNB(uint amountBUSD) internal { // purchases BNB with borrowed BUSD
        borrow(amountBUSD); // first borrow BUSD
        uint256 bought = buyBNB(amountBUSD); // then trade for BNB 
        collateralSupply(bought); // then post as collateral 
    }

    function repayBNB(uint amountBUSD) internal { // repays BUSD with collateral BNB 
        uint256 withdrawAmount = getValue(amountBUSD, priceBNB());
        collateralWithdrawal(withdrawAmount); // first withdrawal collateral 
        buyBUSD(amountBUSD); // then sell BNB for BUSD 
        borrowRepay(amountBUSD); // then repay BUSD 
    }

    function rebalance() public {
        uint256 fee = performanceFees(); // run performance fee calculation
        borrowRepay(busd.balanceOf(address(this))); // repay all BUSD held by contract
        if(address(this).balance < fee) { //check if fee greater than balance
            collateralWithdrawal(fee); // if so, withdrawal BNB of amount fee
        }
        sendFee(fee); // transfer fee to Owner
        int256 amount = rebalanceAmount(); // compute the rebalance amount 
        if (amount > 0) { // could have it as a threshold
            borrowBNB(uint256(amount)); // borrow DAI to buy BNB
        } else {
            // require();
            repayBNB(uint256(-amount)); // use BNB to repay BUSD loan
        }
        redeemXVS();
        uint256 xvsBalance = xvs.balanceOf(address(this));
        // send 50% of redeemed XVS to owner and other 50% to rebalancer (msg.sender)
        xvs.transfer(msg.sender, xvsBalance*(1 - ownerFeeXVS/DENOMINATOR));
        xvs.transfer(owner, xvsBalance*(ownerFeeXVS/DENOMINATOR));
    }

    function rebalanceAmount() public returns(int256) {
        uint targetLoan = getValue(collateralBNB(), priceBNB())*(leverageTarget-DENOMINATOR)/leverageTarget;
        return int(targetLoan) - int(borrowedBUSD()); // positive if need more loan
    }
}   
