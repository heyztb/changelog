// SPDX-License-Identifier: MIT
pragma solidity ^0.8.30;

import {Ownable} from "@solady/auth/Ownable.sol";
import {IStreakTracker} from "./interfaces/IStreakTracker.sol";

/// @title StreakTracker
/// @notice Tracks daily shipping streaks for Changelog users
/// @dev Called by ShipResolver when attestations are created
/// @custom:security-contact security@changelog.build
contract StreakTracker is IStreakTracker, Ownable {
    /// @notice One day in seconds (24 hours)
    uint256 private constant ONE_DAY = 24 hours;

    /// @notice Struct to store ship data
    struct ShipData {
        uint256 timestamp;
        bytes32 attestationUID;
    }

    /// @notice Struct to store user streak information
    struct UserStreakData {
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 totalShips;
        uint256 lastShipTimestamp;
        bytes32[] shipUIDs;
    }

    /// @notice Mapping from FID to their streak data
    mapping(uint256 => UserStreakData) private userData;

    /// @notice Mapping of authorized resolvers that can record ships
    mapping(address => bool) public authorizedResolvers;

    /// @notice Emitted when a resolver is authorized or deauthorized
    event ResolverAuthorizationChanged(
        address indexed resolver,
        bool authorized
    );

    /// @notice Error thrown when caller is not an authorized resolver
    error UnauthorizedResolver();

    /// @notice Error thrown when trying to record a ship for today when one already exists
    error AlreadyShippedToday();

    /// @notice Error thrown when FID is invalid (zero)
    error InvalidFID();

    /// @notice Error thrown when attestation UID is invalid (zero)
    error InvalidAttestationUID();

    /// @dev Modifier to restrict function access to authorized resolvers only
    modifier onlyAuthorizedResolver() {
        if (!authorizedResolvers[msg.sender]) {
            revert UnauthorizedResolver();
        }
        _;
    }

    /// @notice Constructor sets the initial owner
    /// @param initialOwner The address that will own the contract
    constructor(address initialOwner) {
        _initializeOwner(initialOwner);
    }

    /// @notice Authorizes or deauthorizes a resolver
    /// @dev Only owner can call this function
    /// @param resolver The address of the resolver contract
    /// @param authorized True to authorize, false to deauthorize
    function setResolverAuthorization(
        address resolver,
        bool authorized
    ) external onlyOwner {
        authorizedResolvers[resolver] = authorized;
        emit ResolverAuthorizationChanged(resolver, authorized);
    }

    /// @notice Records a ship for a user
    /// @dev Only callable by authorized resolvers. Calculates streak based on time since last ship.
    /// @param fid The Farcaster ID of the user
    /// @param attestationUID The UID of the ship attestation from EAS
    function recordShip(
        uint256 fid,
        bytes32 attestationUID
    ) external onlyAuthorizedResolver {
        if (fid == 0) revert InvalidFID();
        if (attestationUID == bytes32(0)) revert InvalidAttestationUID();

        UserStreakData storage user = userData[fid];
        uint256 currentTime = block.timestamp;

        // Check if user has already shipped today
        if (
            user.lastShipTimestamp > 0 &&
            _isSameDay(user.lastShipTimestamp, currentTime)
        ) {
            revert AlreadyShippedToday();
        }

        // Calculate streak
        uint256 newStreak;
        if (user.lastShipTimestamp == 0) {
            // First ship ever
            newStreak = 1;
        } else if (_isConsecutiveDay(user.lastShipTimestamp, currentTime)) {
            // Shipped on consecutive day
            newStreak = user.currentStreak + 1;
        } else if (_isSameDay(user.lastShipTimestamp, currentTime)) {
            // Already shipped today (shouldn't reach here due to check above)
            revert AlreadyShippedToday();
        } else {
            // Streak broken, start over
            emit StreakBroken(fid, user.currentStreak, user.lastShipTimestamp);
            newStreak = 1;
        }

        // Update user data
        user.currentStreak = newStreak;
        user.totalShips += 1;
        user.lastShipTimestamp = currentTime;
        user.shipUIDs.push(attestationUID);

        // Update longest streak if current is higher
        if (newStreak > user.longestStreak) {
            user.longestStreak = newStreak;
        }

        emit ShipRecorded(fid, attestationUID, currentTime, newStreak);
    }

    /// @notice Gets the current streak for a user
    /// @param fid The Farcaster ID of the user
    /// @return currentStreak The number of consecutive days the user has shipped
    function getCurrentStreak(
        uint256 fid
    ) external view returns (uint256 currentStreak) {
        UserStreakData storage user = userData[fid];

        // If never shipped, return 0
        if (user.lastShipTimestamp == 0) {
            return 0;
        }

        // Check if streak is still active (shipped today or yesterday)
        uint256 daysSinceLastShip = (block.timestamp - user.lastShipTimestamp) /
            ONE_DAY;

        if (daysSinceLastShip > 1) {
            // Streak is broken
            return 0;
        }

        return user.currentStreak;
    }

    /// @notice Gets the timestamp of the last ship for a user
    /// @param fid The Farcaster ID of the user
    /// @return timestamp The Unix timestamp of the last ship
    function getLastShipTimestamp(
        uint256 fid
    ) external view returns (uint256 timestamp) {
        return userData[fid].lastShipTimestamp;
    }

    /// @notice Gets the total number of ships for a user
    /// @param fid The Farcaster ID of the user
    /// @return total The total number of ships recorded
    function getTotalShips(uint256 fid) external view returns (uint256 total) {
        return userData[fid].totalShips;
    }

    /// @notice Gets all ship attestation UIDs for a user
    /// @param fid The Farcaster ID of the user
    /// @return uids Array of attestation UIDs
    function getShipUIDs(
        uint256 fid
    ) external view returns (bytes32[] memory uids) {
        return userData[fid].shipUIDs;
    }

    /// @notice Checks if a user has shipped today
    /// @param fid The Farcaster ID of the user
    /// @return hasShipped True if the user has already shipped today
    function hasShippedToday(
        uint256 fid
    ) external view returns (bool hasShipped) {
        uint256 lastShip = userData[fid].lastShipTimestamp;
        if (lastShip == 0) return false;
        return _isSameDay(lastShip, block.timestamp);
    }

    /// @notice Gets comprehensive streak data for a user
    /// @param fid The Farcaster ID of the user
    /// @return currentStreak Current consecutive days shipped (0 if broken)
    /// @return totalShips Total number of ships all time
    /// @return lastShipTimestamp Timestamp of most recent ship
    /// @return longestStreak Longest streak ever achieved
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
        )
    {
        UserStreakData storage user = userData[fid];

        // Calculate current streak considering if it's still active
        uint256 activeCurrent = 0;
        if (user.lastShipTimestamp > 0) {
            uint256 daysSinceLastShip = (block.timestamp -
                user.lastShipTimestamp) / ONE_DAY;
            if (daysSinceLastShip <= 1) {
                activeCurrent = user.currentStreak;
            }
        }

        return (
            activeCurrent,
            user.totalShips,
            user.lastShipTimestamp,
            user.longestStreak
        );
    }

    /// @notice Checks if two timestamps are on the same calendar day (UTC)
    /// @param timestamp1 First timestamp
    /// @param timestamp2 Second timestamp
    /// @return True if both timestamps are on the same day
    function _isSameDay(
        uint256 timestamp1,
        uint256 timestamp2
    ) private pure returns (bool) {
        return (timestamp1 / ONE_DAY) == (timestamp2 / ONE_DAY);
    }

    /// @notice Checks if timestamp2 is exactly one day after timestamp1
    /// @param timestamp1 Earlier timestamp
    /// @param timestamp2 Later timestamp
    /// @return True if timestamps are consecutive days
    function _isConsecutiveDay(
        uint256 timestamp1,
        uint256 timestamp2
    ) private pure returns (bool) {
        uint256 day1 = timestamp1 / ONE_DAY;
        uint256 day2 = timestamp2 / ONE_DAY;
        return day2 == day1 + 1;
    }
}
