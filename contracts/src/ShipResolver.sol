// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {SchemaResolver} from "@eas/resolver/SchemaResolver.sol";
import {IEAS, Attestation} from "@eas/IEAS.sol";
import {IStreakTracker} from "./interfaces/IStreakTracker.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title ShipResolver
/// @notice Resolver contract for Ship attestations on EAS
/// @dev Validates ship attestations and automatically updates streak tracking
/// @custom:security-contact security@changelog.build
contract ShipResolver is SchemaResolver, Ownable {
    /// @notice The StreakTracker contract instance
    IStreakTracker public immutable streakTracker;

    /// @notice The Project schema UID that ships must reference
    bytes32 public immutable projectSchemaUID;

    /// @notice Mapping to track last ship timestamp per FID (for rate limiting)
    mapping(uint256 => uint256) public lastShipTimestamp;

    /// @notice Minimum time between ships (24 hours)
    uint256 public constant MIN_SHIP_INTERVAL = 24 hours;

    /// @notice Minimum text length for ships (aimed at low effort posts)
    uint256 public constant MIN_TEXT_LENGTH = 30;

    /// @notice Maximum text length for ships (casts are better for longer posts -- share it all there!)
    uint256 public constant MAX_TEXT_LENGTH = 240;

    /// @notice Maximum number of links per ship
    uint256 public constant MAX_LINKS = 10;

    /// @notice Emitted when a ship is successfully created
    /// @param fid The Farcaster ID of the shipper
    /// @param attestationUID The UID of the ship attestation
    /// @param projectRefUID The referenced project attestation UID (from refUID)
    /// @param timestamp The timestamp of the ship
    event ShipCreated(
        uint256 indexed fid,
        bytes32 indexed attestationUID,
        bytes32 indexed projectRefUID,
        uint256 timestamp
    );

    /// @notice Error thrown when the referenced project attestation is invalid
    error InvalidProjectReference();

    /// @notice Error thrown when user tries to ship more than once per day
    error AlreadyShippedToday();

    /// @notice Error thrown when the ship text is empty
    error EmptyShipText();

    /// @notice Error thrown when the ship text does not meet minimum length
    error ShipTextTooShort();

    /// @notice Error thrown when the ship text exceeds maximum length
    error ShipTextTooLong();

    /// @notice Error thrown when FID is invalid (zero)
    error InvalidFID();

    /// @notice Error thrown when attempting to revoke (not allowed)
    error RevocationNotSupported();

    /// @notice Error thrown when no project reference is provided
    error MissingProjectReference();

    /// @notice Error thrown when too many links are provided
    error TooManyLinks();

    /// @notice Constructor initializes the resolver with dependencies
    /// @param _eas The EAS contract address
    /// @param _streakTracker The StreakTracker contract address
    /// @param _projectSchemaUID The UID of the Project schema
    /// @param initialOwner The address that will own the contract
    constructor(
        IEAS _eas,
        IStreakTracker _streakTracker,
        bytes32 _projectSchemaUID,
        address initialOwner
    ) SchemaResolver(_eas) Ownable(initialOwner) {
        streakTracker = _streakTracker;
        projectSchemaUID = _projectSchemaUID;
    }

    /// @notice Validates and processes ship attestations
    /// @dev Called automatically by EAS when attestations are created
    /// @param attestation The attestation data from EAS
    /// @return bool True if attestation is valid, false otherwise
    function onAttest(
        Attestation calldata attestation,
        uint256 /*value*/
    ) internal override returns (bool) {
        // Validate that a project reference exists (using native EAS refUID)
        if (attestation.refUID == bytes32(0)) {
            revert MissingProjectReference();
        }

        // Validate project reference exists and is valid
        if (!_isValidProjectAttestation(attestation.refUID)) {
            revert InvalidProjectReference();
        }

        // Decode ship data
        // Schema: string text, string[] links, uint256 timestamp, uint256 fid
        (string memory text, string[] memory links, , uint256 fid) = abi.decode(
            attestation.data,
            (string, string[], uint256, uint256)
        );

        // Validate FID
        if (fid == 0) revert InvalidFID();

        // Validate text
        if (bytes(text).length == 0) revert EmptyShipText();
        if (bytes(text).length < MIN_TEXT_LENGTH) revert ShipTextTooShort();
        if (bytes(text).length > MAX_TEXT_LENGTH) revert ShipTextTooLong();

        // Validate links array
        if (links.length > MAX_LINKS) revert TooManyLinks();

        // Rate limiting: ensure user hasn't shipped today already
        uint256 lastShip = lastShipTimestamp[fid];
        if (lastShip > 0 && block.timestamp - lastShip < MIN_SHIP_INTERVAL) {
            revert AlreadyShippedToday();
        }

        // Update last ship timestamp
        lastShipTimestamp[fid] = block.timestamp;

        // Record ship in StreakTracker
        // This will handle streak calculation automatically
        streakTracker.recordShip(fid, attestation.uid);

        // Emit event for indexers (using refUID from attestation)
        emit ShipCreated(
            fid,
            attestation.uid,
            attestation.refUID,
            block.timestamp
        );

        return true;
    }

    /// @notice Handles attestation revocations (not supported for ships)
    /// @dev Ships are immutable - revocation is disabled
    /// @return bool Always reverts
    function onRevoke(
        Attestation calldata /*attestation*/,
        uint256 /*value*/
    ) internal pure override returns (bool) {
        revert RevocationNotSupported();
    }

    /// @notice Checks if a project attestation UID exists and is valid in EAS
    /// @param uid The attestation UID to check
    /// @return bool True if attestation exists, is valid, and uses Project schema
    function _isValidProjectAttestation(
        bytes32 uid
    ) private view returns (bool) {
        // Check if the attestation exists in EAS
        Attestation memory attestation = _eas.getAttestation(uid);

        // Attestation is valid if:
        // 1. It has been created (time > 0)
        // 2. It hasn't been revoked (revocationTime == 0)
        // 3. It uses the correct Project schema
        return
            attestation.time > 0 &&
            attestation.revocationTime == 0 &&
            attestation.schema == projectSchemaUID;
    }

    /// @notice Checks if a user has already shipped today
    /// @param fid The Farcaster ID to check
    /// @return bool True if user has shipped within the last 24 hours
    function hasShippedToday(uint256 fid) external view returns (bool) {
        uint256 lastShip = lastShipTimestamp[fid];
        if (lastShip == 0) return false;
        return block.timestamp - lastShip < MIN_SHIP_INTERVAL;
    }

    /// @notice Gets the time remaining until a user can ship again
    /// @param fid The Farcaster ID to check
    /// @return uint256 Seconds remaining until next ship is allowed (0 if can ship now)
    function getTimeUntilNextShip(uint256 fid) external view returns (uint256) {
        uint256 lastShip = lastShipTimestamp[fid];
        if (lastShip == 0) return 0;

        uint256 timeSinceLastShip = block.timestamp - lastShip;
        if (timeSinceLastShip >= MIN_SHIP_INTERVAL) return 0;

        return MIN_SHIP_INTERVAL - timeSinceLastShip;
    }
}
