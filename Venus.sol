pragma solidity ^0.5.16;


// ------- Addresses -------- // 
//"BUSD": "0x8301F2213c0eeD49a7E28Ae4c3e91722919B8B47",
//"vBUSD": "0x08e0A5575De71037aE36AbfAfb516595fE68e5e4",
//"vBNB": "0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c",
//"VenusPriceOracle": "0xd61c7Fa07dF7241812eA6D21744a61f1257D1818",
//WBNB 0x094616F0BdFB0b526bD735Bf66Eca0Ad254ca81F

import 'github.com/VenusProtocol/venus-protocol/blob/master/contracts/VBep20.sol';
import 'github.com/VenusProtocol/venus-protocol/blob/master/contracts/VBNB.sol';
import 'github.com/VenusProtocol/venus-protocol/blob/master/contracts/BEP20Interface.sol';
import 'github.com/VenusProtocol/venus-protocol/blob/master/contracts/PriceOracle.sol';

contract VenusContract is VBep20,VBNB,BEP20Interface,PriceOracle {
    
    VBep20 vBUSD =  VBep20(0x08e0A5575De71037aE36AbfAfb516595fE68e5e4);
    VBNB   vBNB  =  VBNB(0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c);
    BEP20Interface 
    
    constructor() public {
    }

    
    // ----- Venus Functions ------ // 
    
    function collateralBNB() public returns(uint) { 
        return vBNB.balanceOfUnderlying(address(this)); // get collateral BNB qty from Venus
    }
    
    function borrowBUSD() public returns(uint) { 
        return vBUSD.borrowBalanceCurrent(address(this)); // get borrow BUSD qty from Venus 
    }
    
    function enableCollateral() public onlyOwner { // can create the onlyOwner function as well 
        // must turn collateral 
    }
    
    function collateralSupply(uint amountBNB) public {
        assert(vBNB.mint(amountBNB) == 0); // add more BNB as collateral 
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
    
    function getPriceBNB_BUSD() public returns(uint) {
        return PriceOracle.getUnderlyingPrice(vBNB,vBUSD)
    }
   
    
}


