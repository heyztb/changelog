// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ShipResolver} from "../../src/ShipResolver.sol";
import {IEAS, Attestation} from "@eas/IEAS.sol";
import {IStreakTracker} from "../../src/interfaces/IStreakTracker.sol";

/// @title ShipResolverExposed
/// @notice Test helper that exposes internal functions for testing
contract ShipResolverExposed is ShipResolver {
    constructor(
        IEAS _eas,
        IStreakTracker _streakTracker,
        bytes32 _projectSchemaUID,
        address initialOwner
    ) ShipResolver(_eas, _streakTracker, _projectSchemaUID, initialOwner) {}

    /// @notice Exposed version of onAttest for testing
    function exposed_onAttest(
        Attestation calldata attestation,
        uint256 value
    ) external returns (bool) {
        return onAttest(attestation, value);
    }

    /// @notice Exposed version of onRevoke for testing
    function exposed_onRevoke(
        Attestation calldata attestation,
        uint256 value
    ) external returns (bool) {
        return onRevoke(attestation, value);
    }
}
