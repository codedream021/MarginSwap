// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

interface IVenus {
    function enterMarkets(address[] calldata _markets) external returns(uint[] memory);
    function claimVenus(address holder, address[] memory vTokens) external;
    function claimVenus(address _recipient) external;
    function venusAccrued(address holder) external view returns(uint256);
}
