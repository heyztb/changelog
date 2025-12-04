// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

/// @title IStreakTracker
/// @notice Interface for tracking user shipping streaks
/// @dev Used by ShipResolver to record ships and calculate streaks
interface IStreakTracker {
    /// @notice Emitted when a ship is recorded for a user
    /// @param fid The Farcaster ID of the user
    /// @param attestationUID The UID of the ship attestation
    /// @param timestamp The timestamp of the ship
    /// @param currentStreak The user's current streak after this ship
    event ShipRecorded(
        uint256 indexed fid,
        bytes32 indexed attestationUID,
        uint256 timestamp,
        uint256 currentStreak
    );

    /// @notice Emitted when a user's streak breaks
    /// @param fid The Farcaster ID of the user
    /// @param previousStreak The streak count before breaking
    /// @param lastShipTimestamp The timestamp of the last ship before break
    event StreakBroken(
        uint256 indexed fid,
        uint256 previousStreak,
        uint256 lastShipTimestamp
    );

    /// @notice Records a ship for a user
    /// @dev Only callable by authorized resolvers
    /// @param fid The Farcaster ID of the user
    /// @param attestationUID The UID of the ship attestation from EAS
    function recordShip(uint256 fid, bytes32 attestationUID) external;

    /// @notice Gets the current streak for a user
    /// @param fid The Farcaster ID of the user
    /// @return currentStreak The number of consecutive days the user has shipped
    function getCurrentStreak(
        uint256 fid
    ) external view returns (uint256 currentStreak);

    /// @notice Gets the timestamp of the last ship for a user
    /// @param fid The Farcaster ID of the user
    /// @return timestamp The Unix timestamp of the last ship
    function getLastShipTimestamp(
        uint256 fid
    ) external view returns (uint256 timestamp);

    /// @notice Gets the total number of ships for a user
    /// @param fid The Farcaster ID of the user
    /// @return total The total number of ships recorded
    function getTotalShips(uint256 fid) external view returns (uint256 total);

    /// @notice Gets all ship attestation UIDs for a user
    /// @param fid The Farcaster ID of the user
    /// @return uids Array of attestation UIDs
    function getShipUIDs(
        uint256 fid
    ) external view returns (bytes32[] memory uids);

    /// @notice Checks if a user has shipped today
    /// @param fid The Farcaster ID of the user
    /// @return hasShipped True if the user has already shipped today
    function hasShippedToday(
        uint256 fid
    ) external view returns (bool hasShipped);

    /// @notice Gets comprehensive streak data for a user
    /// @param fid The Farcaster ID of the user
    /// @return currentStreak Current consecutive days shipped
    /// @return totalShips Total number of ships all time
    /// @return lastShipTimestamp Timestamp of most recent ship
    /// @return longestStreak Longest streak ever achieved (future enhancement)
    function getStreakData(
        uint256 fid
    )
        external
        view
        returns (
            uint256 currentStreak,
            uint256 totalShips,
            uint256 lastShipTimestamp,
            uint256 longestStreak
        );
}
