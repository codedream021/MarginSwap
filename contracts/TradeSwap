pragma solidity ^0.8.0;

import "./mBNB.sol";
import "./interfaces/IVBep20.sol";
import "./interfaces/IPancakeRouter.sol";

contract MarginSwap {
    // POOLS
    uint public ATHmBNB = 1e18; // highest price of mBNB in BUSD value
    address public owner;

    IMBNB public immutable mbnb;
    IERC20 public immutable busd;

    IPancakeRouter public immutable pancakeRouter;

    // ADMIN adjustable
    uint public constant DENOMINATOR = 10000;
    uint public constant PRICE_DENOMINATOR = 1e18;
    uint public tradingFee = 100; // (tradingFee/DENOMINATOR)*100% each trade 1% (to Owner) each trade 1% (to Owner)
    uint public performanceFee = 500;// 5% of new ATH gain on mBNB (to Owner)
    uint public redemptionFee = 100; // when redeem mBNB to cover slippage (to mBNB holders) 
    uint public slippage = 100; // 100 is 1% slippage
   

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    } 

    // -----   Constructor ------------- //
    constructor(address _busd, address _pancakeRouter) {
        owner = msg.sender;
        mBNB _mbnb = new mBNB();
        mbnb = IMBNB(_mbnb);
        busd = IERC20(_busd);
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

    function updateRatio(uint256 _tradingFee, uint256 _performanceFee, uint256 _redemptionFee, uint256 _threshold) onlyOwner external {
        tradingFee = _tradingFee;           // maximum 5% (500)
        performanceFee = _performanceFee;  // maximum 50% (5000)
        redemptionFee = _redemptionFee;    // maximum 10% (1000)
        threshold = _threshold;            // maximum 50%? before rebalance/executeTrade 
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

    function mBNBtoBNB() public returns(uint) { // price of mBNB in BNB value
        int equityBNB = bnb.balanceOf(address(this);
        if (equityBNB <= 0) { // if negative equity 
            return 1e18; // mBNB worthless
        } else {
            return uint256(equityBNB) * 1e18 / mbnb.totalSupply();
        }
    }

    // ----- Deposits & Withdrawals   ------ //
    function depositBNB() public payable{
        uint priceAsBNB = mBNBtoBNB();
        uint mBNBamount = getValue(msg.value, priceAsBNB); // calculate amount of mBNB to mind and send
        mbnb.mint(msg.sender, mBNBamount);// mint mBNBamount
    }

    function redeemBNB(uint mBNBamount) public {
        uint priceAsBNB = mBNBtoBNB(); // get price of mBNB (in BNB/mBNB)
        mbnb.transferFrom(msg.sender, address(this), mBNBamount);
        mbnb.burn(mBNBamount);
        uint bnbAmount = getValue(mBNBamount, priceAsBNB);
        uint feeAmount = fraction(bnbAmount, redemptionFee);
        uint amountBNB = bnbAmount - feeAmount;// get amount of BNB to withdrawal 
        payable(msg.sender).transfer(amountBNB); // send amountBNB back to user
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
    
    function tradeWait() internal returns(uint256 time) {
        // unix + 6hrs 
    }
    
    
    function performanceFees() internal returns(uint256 fee){
        uint mBNBtoBNBNow = mBNBtoBNB();
        if (mBNBtoBNBNow > ATHmBNB) {
            fee = getAssetAmount((mBNBtoBNBNow - ATHmBNB)*borrowedBUSD() / ATHmBNB, priceBNB());
            // send feeBNB to owner from collateralBNB
            ATHmBNB = mBNBtoBNBNow; //update mBNB all time high price 
        }
    }
    
    function executeTrade(uint amountBUSD) onlyOwner() {
        uint256 balanceBNB = bnb.address(this); // this isnt correct
        uint256 fee = performanceFees(); // run performance fee calculation
        sendFee(fee); // transfer fee to Owner
        if unix >= tradeWait() { // enough time has passed 
            if executeTrade > balanceBNB*(threshold/DENOMINATOR) { // buy BNB
                buyBNB(amountBUSD);
            } else {
                buyBUSD(amountBUSD);
            }
        }
    }
