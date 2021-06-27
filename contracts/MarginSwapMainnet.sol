// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

import "./MarginSwap.sol";

contract MarginSwapMainnet is MarginSwap {
    constructor() MarginSwap(
        0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56,
        0xfD36E2c2a6789Db23113685031d7F16329158384,
        0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63,
        0xA07c5b74C9B40447a954e1466938b865b6BBea36,
        0x95c78222B3D6e262426483D42CfA53685A67Ab9D,
        0xd8B6dA2bfEC71D684D3E2a2FC9492dDad5C3787F,
        0x10ED43C718714eb63d5aA57B78B54704E256024E
    ){
    }
}   
