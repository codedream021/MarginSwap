// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

interface IVenusOracle {
    function getUnderlyingPrice(address vtoken) external view returns(uint256);
}
