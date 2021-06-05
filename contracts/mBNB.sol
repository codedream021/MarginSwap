// SPDX-License-Identifier: ISC

pragma solidity ^0.8.0;

import "./interfaces/IMBNB.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract mBNB is ERC20, IMBNB {
    address public immutable minter;
    constructor() ERC20("mBNB", "MBNB"){
        minter = msg.sender;
    }

    function mint(address _recipient, uint256 _amount) external override {
        _mint(_recipient, _amount);
    }

    function burn(uint256 _amount) external override {
        _burn(msg.sender, _amount);
    }
}
