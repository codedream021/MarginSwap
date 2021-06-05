// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IMBNB is IERC20 {
    function mint(address _recipient, uint256 _amount) external;

    function burn(uint256 _amount) external;
}
