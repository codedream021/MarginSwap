// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

interface IVBep20 {
    function borrowBalanceCurrent(address _owner) external returns(uint256);
    function borrow(uint256 _amount) external returns(uint256);
    function repayBorrow(uint256 _amount) external returns(uint256);
    function balanceOf(address _user) external view returns(uint256);
}
