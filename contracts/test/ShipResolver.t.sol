// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ShipResolver} from "../src/ShipResolver.sol";
import {ShipResolverExposed} from "./mocks/ShipResolverExposed.sol";
import {StreakTracker} from "../src/StreakTracker.sol";
import {IEAS, Attestation, AttestationRequest, AttestationRequestData, RevocationRequest, RevocationRequestData, DelegatedAttestationRequest, DelegatedRevocationRequest, MultiAttestationRequest, MultiRevocationRequest, MultiDelegatedAttestationRequest, MultiDelegatedRevocationRequest} from "@eas/IEAS.sol";
import {ISchemaRegistry, SchemaRecord} from "@eas/ISchemaRegistry.sol";

/// @notice Mock EAS contract for testing
contract MockEAS is IEAS {
    mapping(bytes32 => Attestation) private attestations;
    uint256 private nonce;

    function attest(
        AttestationRequest calldata request
    ) external payable returns (bytes32) {
        bytes32 uid = keccak256(abi.encodePacked(nonce++, msg.sender));
        attestations[uid] = Attestation({
            uid: uid,
            schema: request.schema,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: request.data.recipient,
            attester: msg.sender,
            revocable: false,
            data: request.data.data
        });
        return uid;
    }

    function attestByDelegation(
        DelegatedAttestationRequest calldata /*delegatedRequest*/
    ) external payable returns (bytes32) {
        return bytes32(0);
    }

    function multiAttest(
        MultiAttestationRequest[] calldata /*multiRequests*/
    ) external payable returns (bytes32[] memory) {
        return new bytes32[](0);
    }

    function multiAttestByDelegation(
        MultiDelegatedAttestationRequest[] calldata /*multiDelegatedRequests*/
    ) external payable returns (bytes32[] memory) {
        return new bytes32[](0);
    }

    function revoke(RevocationRequest calldata /*request*/) external payable {
        // Mock implementation
    }

    function revokeByDelegation(
        DelegatedRevocationRequest calldata /*delegatedRequest*/
    ) external payable {
        // Mock implementation
    }

    function multiRevoke(
        MultiRevocationRequest[] calldata /*multiRequests*/
    ) external payable {
        // Mock implementation
    }

    function multiRevokeByDelegation(
        MultiDelegatedRevocationRequest[] calldata /*multiDelegatedRequests*/
    ) external payable {
        // Mock implementation
    }

    function timestamp(bytes32 /*data*/) external pure returns (uint64) {
        return 0;
    }

    function revokeOffchain(bytes32 /*data*/) external pure returns (uint64) {
        return 0;
    }

    function multiRevokeOffchain(
        bytes32[] calldata /*data*/
    ) external pure returns (uint64) {
        return 0;
    }

    function multiTimestamp(
        bytes32[] calldata /*data*/
    ) external pure returns (uint64) {
        return 0;
    }

    function getAttestation(
        bytes32 uid
    ) external view returns (Attestation memory) {
        return attestations[uid];
    }

    function isAttestationValid(bytes32 uid) external view returns (bool) {
        return attestations[uid].time > 0;
    }

    function getTimestamp(bytes32 /*uid*/) external view returns (uint64) {
        return uint64(block.timestamp);
    }

    function getRevokeOffchain(
        address /*revoker*/,
        bytes32 /*data*/
    ) external pure returns (uint64) {
        return 0;
    }

    function getSchemaRegistry()
        external
        pure
        returns (ISchemaRegistry registry)
    {
        return ISchemaRegistry(address(0));
    }

    function getAttestationCount() external pure returns (uint256 count) {
        return 0;
    }

    function version() external pure returns (string memory) {
        return "1.0.0";
    }

    // Helper function for tests
    function createAttestation(
        bytes32 uid,
        bytes32 schema,
        bytes memory data
    ) external {
        attestations[uid] = Attestation({
            uid: uid,
            schema: schema,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: msg.sender,
            revocable: false,
            data: data
        });
    }
}

/// @title ShipResolverTest
/// @notice Comprehensive test suite for ShipResolver contract
contract ShipResolverTest is Test {
    ShipResolverExposed public resolver;
    StreakTracker public tracker;
    MockEAS public eas;

    address public owner;
    address public user;

    bytes32 public constant PROJECT_SCHEMA_UID = bytes32(uint256(100));
    bytes32 public constant SHIP_SCHEMA_UID = bytes32(uint256(200));
    bytes32 public constant PROJECT_REF_UID = bytes32(uint256(1000));

    uint256 constant FID_ALICE = 1;
    uint256 constant FID_BOB = 2;

    event ShipCreated(
        uint256 indexed fid,
        bytes32 indexed attestationUID,
        bytes32 indexed projectRefUID,
        uint256 timestamp
    );

    function setUp() public {
        owner = makeAddr("owner");
        user = makeAddr("user");

        // Deploy mock EAS
        eas = new MockEAS();

        // Deploy StreakTracker
        vm.startPrank(owner);
        tracker = new StreakTracker(owner);

        // Deploy ShipResolverExposed for testing
        resolver = new ShipResolverExposed(
            IEAS(address(eas)),
            tracker,
            PROJECT_SCHEMA_UID,
            owner
        );

        // Authorize resolver in tracker
        tracker.setResolverAuthorization(address(resolver), true);
        vm.stopPrank();

        // Create a valid project attestation
        bytes memory projectData = abi.encode(
            "Test Project",
            "A test project",
            "https://test.com",
            owner,
            block.timestamp
        );
        eas.createAttestation(PROJECT_REF_UID, PROJECT_SCHEMA_UID, projectData);
    }

    /*//////////////////////////////////////////////////////////////
                        CONSTRUCTOR TESTS
    //////////////////////////////////////////////////////////////*/

    function test_Constructor() public view {
        assertEq(address(resolver.streakTracker()), address(tracker));
        assertEq(resolver.projectSchemaUID(), PROJECT_SCHEMA_UID);
        assertEq(resolver.owner(), owner);
    }

    /*//////////////////////////////////////////////////////////////
                        ON ATTEST TESTS
    //////////////////////////////////////////////////////////////*/

    function test_OnAttestValidShip() public {
        bytes memory shipData = abi.encode(
            PROJECT_REF_UID, // projectRefUID
            "Shipped feature X", // text
            "https://example.com", // link
            block.timestamp, // timestamp
            FID_ALICE // fid
        );

        Attestation memory attestation = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData
        });

        // Simulate EAS calling onAttest via the resolver's attest function
        vm.prank(address(eas));
        vm.expectEmit(true, true, true, true);
        emit ShipCreated(
            FID_ALICE,
            attestation.uid,
            PROJECT_REF_UID,
            block.timestamp
        );

        // Call the resolver directly (simulating EAS callback)
        bool result = resolver.exposed_onAttest(attestation, 0);
        assertTrue(result);

        // Verify streak was updated
        assertEq(tracker.getCurrentStreak(FID_ALICE), 1);
        assertEq(tracker.getTotalShips(FID_ALICE), 1);
        assertTrue(resolver.hasShippedToday(FID_ALICE));
    }

    function test_OnAttestConsecutiveDays() public {
        // Day 1
        bytes memory shipData1 = abi.encode(
            PROJECT_REF_UID,
            "Day 1 ship",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation1 = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData1
        });

        vm.prank(address(eas));
        resolver.exposed_onAttest(attestation1, 0);

        // Day 2
        vm.warp(block.timestamp + 1 days);

        bytes memory shipData2 = abi.encode(
            PROJECT_REF_UID,
            "Day 2 ship",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation2 = Attestation({
            uid: bytes32(uint256(2)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData2
        });

        vm.prank(address(eas));
        resolver.exposed_onAttest(attestation2, 0);

        assertEq(tracker.getCurrentStreak(FID_ALICE), 2);
    }

    function test_RevertWhen_InvalidProjectReference() public {
        bytes32 invalidProjectRef = bytes32(uint256(9999));

        bytes memory shipData = abi.encode(
            invalidProjectRef,
            "Test ship",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData
        });

        vm.prank(address(eas));
        vm.expectRevert(ShipResolver.InvalidProjectReference.selector);
        resolver.exposed_onAttest(attestation, 0);
    }

    function test_RevertWhen_InvalidFID() public {
        bytes memory shipData = abi.encode(
            PROJECT_REF_UID,
            "Test ship",
            "",
            block.timestamp,
            0 // Invalid FID
        );

        Attestation memory attestation = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData
        });

        vm.prank(address(eas));
        vm.expectRevert(ShipResolver.InvalidFID.selector);
        resolver.exposed_onAttest(attestation, 0);
    }

    function test_RevertWhen_EmptyShipText() public {
        bytes memory shipData = abi.encode(
            PROJECT_REF_UID,
            "", // Empty text
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData
        });

        vm.prank(address(eas));
        vm.expectRevert(ShipResolver.EmptyShipText.selector);
        resolver.exposed_onAttest(attestation, 0);
    }

    function test_RevertWhen_ShipTextTooLong() public {
        // Create text longer than MAX_TEXT_LENGTH (5000)
        bytes memory longText = new bytes(5001);
        for (uint256 i = 0; i < 5001; i++) {
            longText[i] = "a";
        }

        bytes memory shipData = abi.encode(
            PROJECT_REF_UID,
            string(longText),
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData
        });

        vm.prank(address(eas));
        vm.expectRevert(ShipResolver.ShipTextTooLong.selector);
        resolver.exposed_onAttest(attestation, 0);
    }

    function test_RevertWhen_AlreadyShippedToday() public {
        // First ship
        bytes memory shipData1 = abi.encode(
            PROJECT_REF_UID,
            "First ship",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation1 = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData1
        });

        vm.prank(address(eas));
        resolver.exposed_onAttest(attestation1, 0);

        // Try to ship again within 24 hours
        vm.warp(block.timestamp + 12 hours);

        bytes memory shipData2 = abi.encode(
            PROJECT_REF_UID,
            "Second ship",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation2 = Attestation({
            uid: bytes32(uint256(2)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData2
        });

        vm.prank(address(eas));
        vm.expectRevert(ShipResolver.AlreadyShippedToday.selector);
        resolver.exposed_onAttest(attestation2, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        ON REVOKE TESTS
    //////////////////////////////////////////////////////////////*/

    function test_RevertWhen_Revoke() public {
        bytes memory shipData = abi.encode(
            PROJECT_REF_UID,
            "Test ship",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData
        });

        vm.prank(address(eas));
        vm.expectRevert(ShipResolver.RevocationNotSupported.selector);
        resolver.exposed_onRevoke(attestation, 0);
    }

    /*//////////////////////////////////////////////////////////////
                        VIEW FUNCTION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_HasShippedToday() public {
        assertFalse(resolver.hasShippedToday(FID_ALICE));

        // Ship
        bytes memory shipData = abi.encode(
            PROJECT_REF_UID,
            "Test ship",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData
        });

        vm.prank(address(eas));
        resolver.exposed_onAttest(attestation, 0);

        assertTrue(resolver.hasShippedToday(FID_ALICE));

        // Next day
        vm.warp(block.timestamp + 24 hours);
        assertFalse(resolver.hasShippedToday(FID_ALICE));
    }

    function test_GetTimeUntilNextShip() public {
        assertEq(resolver.getTimeUntilNextShip(FID_ALICE), 0);

        // Ship
        bytes memory shipData = abi.encode(
            PROJECT_REF_UID,
            "Test ship",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData
        });

        vm.prank(address(eas));
        resolver.exposed_onAttest(attestation, 0);

        // Should be 24 hours initially
        assertEq(resolver.getTimeUntilNextShip(FID_ALICE), 24 hours);

        // After 12 hours, should be 12 hours remaining
        vm.warp(block.timestamp + 12 hours);
        assertEq(resolver.getTimeUntilNextShip(FID_ALICE), 12 hours);

        // After 24 hours, should be 0
        vm.warp(block.timestamp + 12 hours);
        assertEq(resolver.getTimeUntilNextShip(FID_ALICE), 0);
    }

    /*//////////////////////////////////////////////////////////////
                        MULTIPLE USERS TESTS
    //////////////////////////////////////////////////////////////*/

    function test_MultipleUsersCanShipSameDay() public {
        // Alice ships
        bytes memory shipDataAlice = abi.encode(
            PROJECT_REF_UID,
            "Alice ship",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestationAlice = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipDataAlice
        });

        vm.prank(address(eas));
        resolver.exposed_onAttest(attestationAlice, 0);

        // Bob ships same day
        bytes memory shipDataBob = abi.encode(
            PROJECT_REF_UID,
            "Bob ship",
            "",
            block.timestamp,
            FID_BOB
        );

        Attestation memory attestationBob = Attestation({
            uid: bytes32(uint256(2)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipDataBob
        });

        vm.prank(address(eas));
        resolver.exposed_onAttest(attestationBob, 0);

        assertTrue(resolver.hasShippedToday(FID_ALICE));
        assertTrue(resolver.hasShippedToday(FID_BOB));
        assertEq(tracker.getCurrentStreak(FID_ALICE), 1);
        assertEq(tracker.getCurrentStreak(FID_BOB), 1);
    }

    /*//////////////////////////////////////////////////////////////
                        FUZZ TESTS
    //////////////////////////////////////////////////////////////*/

    function testFuzz_OnAttestWithValidData(
        uint256 fid,
        string memory text,
        string memory link
    ) public {
        // Bound inputs
        fid = bound(fid, 1, type(uint128).max);
        vm.assume(bytes(text).length > 0 && bytes(text).length <= 5000);

        bytes memory shipData = abi.encode(
            PROJECT_REF_UID,
            text,
            link,
            block.timestamp,
            fid
        );

        Attestation memory attestation = Attestation({
            uid: keccak256(abi.encodePacked(fid, text)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData
        });

        vm.prank(address(eas));
        bool result = resolver.exposed_onAttest(attestation, 0);

        assertTrue(result);
        assertEq(tracker.getCurrentStreak(fid), 1);
    }

    /*//////////////////////////////////////////////////////////////
                        INTEGRATION TESTS
    //////////////////////////////////////////////////////////////*/

    function test_IntegrationFullShipFlow() public {
        // Day 1: Alice ships
        bytes memory shipData1 = abi.encode(
            PROJECT_REF_UID,
            "Built authentication system",
            "https://github.com/alice/auth",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation1 = Attestation({
            uid: bytes32(uint256(1)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData1
        });

        vm.prank(address(eas));
        resolver.exposed_onAttest(attestation1, 0);

        // Verify state
        assertEq(tracker.getCurrentStreak(FID_ALICE), 1);
        assertEq(tracker.getTotalShips(FID_ALICE), 1);
        assertTrue(resolver.hasShippedToday(FID_ALICE));

        // Day 2: Alice ships again
        vm.warp(block.timestamp + 1 days);

        bytes memory shipData2 = abi.encode(
            PROJECT_REF_UID,
            "Added OAuth providers",
            "",
            block.timestamp,
            FID_ALICE
        );

        Attestation memory attestation2 = Attestation({
            uid: bytes32(uint256(2)),
            schema: SHIP_SCHEMA_UID,
            time: uint64(block.timestamp),
            expirationTime: 0,
            revocationTime: 0,
            refUID: bytes32(0),
            recipient: address(0),
            attester: user,
            revocable: false,
            data: shipData2
        });

        vm.prank(address(eas));
        resolver.exposed_onAttest(attestation2, 0);

        // Verify streak increased
        assertEq(tracker.getCurrentStreak(FID_ALICE), 2);
        assertEq(tracker.getTotalShips(FID_ALICE), 2);

        // Get comprehensive data
        (
            uint256 currentStreak,
            uint256 totalShips,
            uint256 lastShipTimestamp,
            uint256 longestStreak
        ) = tracker.getStreakData(FID_ALICE);

        assertEq(currentStreak, 2);
        assertEq(totalShips, 2);
        assertGt(lastShipTimestamp, 0);
        assertEq(longestStreak, 2);
    }
}
