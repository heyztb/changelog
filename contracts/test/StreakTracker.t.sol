// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {StreakTracker} from "../src/StreakTracker.sol";
import {IStreakTracker} from "../src/interfaces/IStreakTracker.sol";

/// @title StreakTrackerTest
/// @notice Comprehensive test suite for StreakTracker contract
contract StreakTrackerTest is Test {
    StreakTracker public tracker;
    address public owner;
    address public resolver;
    address public unauthorizedUser;

    uint256 constant FID_ALICE = 1;
    uint256 constant FID_BOB = 2;
    bytes32 constant ATTESTATION_UID_1 = bytes32(uint256(1));
    bytes32 constant ATTESTATION_UID_2 = bytes32(uint256(2));
    bytes32 constant ATTESTATION_UID_3 = bytes32(uint256(3));

    event ShipRecorded(
        uint256 indexed fid,
        bytes32 indexed attestationUID,
        uint256 timestamp,
        uint256 currentStreak
    );

    event StreakBroken(
        uint256 indexed fid,
        uint256 previousStreak,
        uint256 lastShipTimestamp
    );

    event ResolverAuthorizationChanged(
        address indexed resolver,
        bool authorized
    );

    function setUp() public {
        owner = makeAddr("owner");
        resolver = makeAddr("resolver");
        unauthorizedUser = makeAddr("unauthorized");

        vm.startPrank(owner);
        tracker = new StreakTracker(owner);
        tracker.setResolverAuthorization(resolver, true);
        vm.stopPrank();
    }

    /*//////////////////////////////////////////////////////////////
                        AUTHORIZATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Constructor() public view {
        assertEq(tracker.owner(), owner);
        assertTrue(tracker.authorizedResolvers(resolver));
    }

    function test_SetResolverAuthorization() public {
        address newResolver = makeAddr("newResolver");

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit ResolverAuthorizationChanged(newResolver, true);
        tracker.setResolverAuthorization(newResolver, true);

        assertTrue(tracker.authorizedResolvers(newResolver));
    }

    function test_RevertWhen_UnauthorizedSetResolver() public {
        address newResolver = makeAddr("newResolver");

        vm.prank(unauthorizedUser);
        vm.expectRevert();
        tracker.setResolverAuthorization(newResolver, true);
    }

    function test_DeauthorizeResolver() public {
        vm.prank(owner);
        tracker.setResolverAuthorization(resolver, false);

        assertFalse(tracker.authorizedResolvers(resolver));
    }

    /*//////////////////////////////////////////////////////////////
                        RECORD SHIP TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RecordFirstShip() public {
        vm.prank(resolver);
        vm.expectEmit(true, true, false, true);
        emit ShipRecorded(FID_ALICE, ATTESTATION_UID_1, block.timestamp, 1);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        assertEq(tracker.getCurrentStreak(FID_ALICE), 1);
        assertEq(tracker.getTotalShips(FID_ALICE), 1);
        assertEq(tracker.getLastShipTimestamp(FID_ALICE), block.timestamp);
    }

    function test_RecordConsecutiveDayShips() public {
        // Day 1
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);
        assertEq(tracker.getCurrentStreak(FID_ALICE), 1);

        // Day 2
        vm.warp(block.timestamp + 1 days);
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);
        assertEq(tracker.getCurrentStreak(FID_ALICE), 2);

        // Day 3
        vm.warp(block.timestamp + 1 days);
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_3);
        assertEq(tracker.getCurrentStreak(FID_ALICE), 3);

        assertEq(tracker.getTotalShips(FID_ALICE), 3);
    }

    function test_StreakBreaksAfterMissedDay() public {
        // Day 1
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);
        assertEq(tracker.getCurrentStreak(FID_ALICE), 1);

        // Day 2
        vm.warp(block.timestamp + 1 days);
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);
        assertEq(tracker.getCurrentStreak(FID_ALICE), 2);

        // Skip Day 3, ship on Day 4 (streak breaks)
        uint256 lastShipTimestamp = block.timestamp;
        vm.warp(block.timestamp + 2 days);
        vm.prank(resolver);
        vm.expectEmit(true, false, false, true);
        emit StreakBroken(FID_ALICE, 2, lastShipTimestamp);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_3);

        assertEq(tracker.getCurrentStreak(FID_ALICE), 1); // Streak resets to 1
        assertEq(tracker.getTotalShips(FID_ALICE), 3); // Total ships still 3
    }

    function test_RevertWhen_AlreadyShippedToday() public {
        vm.startPrank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        // Try to ship again on same day
        vm.expectRevert(StreakTracker.AlreadyShippedToday.selector);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);
        vm.stopPrank();
    }

    function test_RevertWhen_UnauthorizedResolver() public {
        vm.prank(unauthorizedUser);
        vm.expectRevert(StreakTracker.UnauthorizedResolver.selector);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);
    }

    function test_RevertWhen_InvalidFID() public {
        vm.prank(resolver);
        vm.expectRevert(StreakTracker.InvalidFID.selector);
        tracker.recordShip(0, ATTESTATION_UID_1);
    }

    function test_RevertWhen_InvalidAttestationUID() public {
        vm.prank(resolver);
        vm.expectRevert(StreakTracker.InvalidAttestationUID.selector);
        tracker.recordShip(FID_ALICE, bytes32(0));
    }

    /*//////////////////////////////////////////////////////////////
                        STREAK CALCULATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetCurrentStreakWhenNeverShipped() public view {
        assertEq(tracker.getCurrentStreak(FID_ALICE), 0);
    }

    function test_GetCurrentStreakWhenBroken() public {
        // Ship on day 1
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        // Fast forward 3 days (streak is broken)
        vm.warp(block.timestamp + 3 days);

        // getCurrentStreak should return 0 because streak is broken
        assertEq(tracker.getCurrentStreak(FID_ALICE), 0);
    }

    function test_GetCurrentStreakWhenActive() public {
        // Ship on day 1
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        // Ship on day 2
        vm.warp(block.timestamp + 1 days);
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);

        // Check same day - should be 2
        assertEq(tracker.getCurrentStreak(FID_ALICE), 2);

        // Check next day before shipping - should still be 2 (grace period)
        vm.warp(block.timestamp + 12 hours);
        assertEq(tracker.getCurrentStreak(FID_ALICE), 2);
    }

    function test_HasShippedToday() public {
        assertFalse(tracker.hasShippedToday(FID_ALICE));

        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        assertTrue(tracker.hasShippedToday(FID_ALICE));

        // Next day
        vm.warp(block.timestamp + 1 days);
        assertFalse(tracker.hasShippedToday(FID_ALICE));
    }

    /*//////////////////////////////////////////////////////////////
                        GETTER TESTS
    //////////////////////////////////////////////////////////////*/

    function test_GetShipUIDs() public {
        vm.startPrank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);

        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_3);
        vm.stopPrank();

        bytes32[] memory uids = tracker.getShipUIDs(FID_ALICE);
        assertEq(uids.length, 3);
        assertEq(uids[0], ATTESTATION_UID_1);
        assertEq(uids[1], ATTESTATION_UID_2);
        assertEq(uids[2], ATTESTATION_UID_3);
    }

    function test_GetStreakData() public {
        // Ship 3 days in a row
        vm.startPrank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);

        vm.warp(block.timestamp + 1 days);
        uint256 lastShipTime = block.timestamp;
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_3);
        vm.stopPrank();

        (
            uint256 currentStreak,
            uint256 totalShips,
            uint256 lastShipTimestamp,
            uint256 longestStreak
        ) = tracker.getStreakData(FID_ALICE);

        assertEq(currentStreak, 3);
        assertEq(totalShips, 3);
        assertEq(lastShipTimestamp, lastShipTime);
        assertEq(longestStreak, 3);
    }

    function test_GetStreakDataAfterStreakBreaks() public {
        // Build a 3-day streak
        vm.startPrank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);
        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);
        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_3);
        vm.stopPrank();

        // Fast forward to break streak
        vm.warp(block.timestamp + 3 days);

        (
            uint256 currentStreak,
            uint256 totalShips,
            ,
            uint256 longestStreak
        ) = tracker.getStreakData(FID_ALICE);

        assertEq(currentStreak, 0); // Streak broken
        assertEq(totalShips, 3); // Total ships unchanged
        assertEq(longestStreak, 3); // Longest streak preserved
    }

    function test_LongestStreakTracking() public {
        // Build a 5-day streak
        vm.startPrank(resolver);
        for (uint256 i = 1; i <= 5; i++) {
            tracker.recordShip(FID_ALICE, bytes32(i));
            if (i < 5) vm.warp(block.timestamp + 1 days);
        }

        // Break streak and start new 3-day streak
        vm.warp(block.timestamp + 3 days);
        tracker.recordShip(FID_ALICE, bytes32(uint256(6)));
        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, bytes32(uint256(7)));
        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, bytes32(uint256(8)));
        vm.stopPrank();

        (
            uint256 currentStreak,
            uint256 totalShips,
            ,
            uint256 longestStreak
        ) = tracker.getStreakData(FID_ALICE);

        assertEq(currentStreak, 3);
        assertEq(totalShips, 8);
        assertEq(longestStreak, 5); // Longest streak should still be 5
    }

    /*//////////////////////////////////////////////////////////////
                        MULTIPLE USERS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_MultipleUsersIndependentStreaks() public {
        vm.startPrank(resolver);

        // Alice ships
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);
        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);

        // Bob ships (starting from different time)
        tracker.recordShip(FID_BOB, bytes32(uint256(100)));

        vm.stopPrank();

        assertEq(tracker.getCurrentStreak(FID_ALICE), 2);
        assertEq(tracker.getCurrentStreak(FID_BOB), 1);
        assertEq(tracker.getTotalShips(FID_ALICE), 2);
        assertEq(tracker.getTotalShips(FID_BOB), 1);
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_RecordShipWithValidInputs(
        uint256 fid,
        bytes32 attestationUID
    ) public {
        // Bound inputs to valid ranges
        fid = bound(fid, 1, type(uint128).max);
        vm.assume(attestationUID != bytes32(0));

        vm.prank(resolver);
        tracker.recordShip(fid, attestationUID);

        assertEq(tracker.getCurrentStreak(fid), 1);
        assertEq(tracker.getTotalShips(fid), 1);
    }

    function testFuzz_ConsecutiveShips(uint8 numDays) public {
        // Bound to reasonable number of days
        numDays = uint8(bound(numDays, 1, 100));

        vm.startPrank(resolver);
        for (uint256 i = 0; i < numDays; i++) {
            tracker.recordShip(FID_ALICE, bytes32(i + 1));
            if (i < numDays - 1) {
                vm.warp(block.timestamp + 1 days);
            }
        }
        vm.stopPrank();

        assertEq(tracker.getCurrentStreak(FID_ALICE), numDays);
        assertEq(tracker.getTotalShips(FID_ALICE), numDays);
    }

    function testFuzz_TimeUntilStreakBreaks(uint256 daysToSkip) public {
        // Ship once
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        // Bound days to reasonable range
        daysToSkip = bound(daysToSkip, 2, 365);

        // Fast forward
        vm.warp(block.timestamp + (daysToSkip * 1 days));

        // Streak should be broken (0) if we skipped more than 1 day
        assertEq(tracker.getCurrentStreak(FID_ALICE), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        EDGE CASE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_ShipAtMidnight() public {
        // Set time to 23:59:59 of a day
        uint256 dayEnd = (block.timestamp / 1 days + 1) * 1 days - 1;
        vm.warp(dayEnd);

        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        // Move to 00:00:01 next day
        vm.warp(dayEnd + 2);

        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);

        assertEq(tracker.getCurrentStreak(FID_ALICE), 2);
    }

    function test_StreakWithinSameCalendarDay() public {
        vm.prank(resolver);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_1);

        // Move forward 12 hours (same day)
        vm.warp(block.timestamp + 12 hours);

        // Should revert as already shipped today
        vm.prank(resolver);
        vm.expectRevert(StreakTracker.AlreadyShippedToday.selector);
        tracker.recordShip(FID_ALICE, ATTESTATION_UID_2);
    }

    function test_RecoverFromBrokenStreak() public {
        // Build initial streak
        vm.startPrank(resolver);
        tracker.recordShip(FID_ALICE, bytes32(uint256(1)));
        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, bytes32(uint256(2)));

        // Break streak
        vm.warp(block.timestamp + 3 days);
        tracker.recordShip(FID_ALICE, bytes32(uint256(3)));

        // Build new streak
        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, bytes32(uint256(4)));
        vm.warp(block.timestamp + 1 days);
        tracker.recordShip(FID_ALICE, bytes32(uint256(5)));
        vm.stopPrank();

        assertEq(tracker.getCurrentStreak(FID_ALICE), 3);
        assertEq(tracker.getTotalShips(FID_ALICE), 5);
    }
}
