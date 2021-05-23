// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

interface IVBNB {
    function balanceOfUnderlying(address _owner) external returns(uint256);
    function mint() external payable;
    function redeemUnderlying(uint256 _amount) external returns(uint256);
}
