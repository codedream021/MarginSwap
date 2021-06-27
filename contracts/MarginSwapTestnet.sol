// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

import "./MarginSwap.sol";

contract MarginSwapTestnet is MarginSwap {
    // busd =          0x8301F2213c0eeD49a7E28Ae4c3e91722919B8B47
    // venus =         0x94d1820b2d1c7c7452a163983dc888cec546b77d
    // xvs =           0xb9e0e753630434d7863528cc73cb7ac638a7c8ff 
    // vBNB =          0x2e7222e51c0f6e98610a1543aa3836e092cde62c
    // vBUSD =         0x08e0a5575de71037ae36abfafb516595fe68e5e4
    // venusOracle =   0x03cf8ff6262363010984b192dc654bd4825caffc
    // pancakeRouter = 0xd99d1c33f9fc3444f8101754abc46c52416550d1
    constructor() MarginSwap(
        0x8301F2213c0eeD49a7E28Ae4c3e91722919B8B47,
        0x94d1820b2D1c7c7452A163983Dc888CEC546b77D,
        0xB9e0E753630434d7863528cc73CB7AC638a7c8ff,
        0x2E7222e51c0f6e98610A1543Aa3836E092CDe62c,
        0x08e0A5575De71037aE36AbfAfb516595fE68e5e4,
        0x03cF8fF6262363010984B192dc654bd4825cAffc,
        0xD99D1c33F9fC3444f8101754aBC46c52416550D1
    ){
    }
}   
