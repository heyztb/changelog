// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

interface ISVGRenderer {
    function render() external view returns (string memory);

    function render(uint256 tokenId) external view returns (string memory);
}
