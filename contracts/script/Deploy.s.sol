// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {StreakTracker} from "../src/StreakTracker.sol";
import {ShipResolver} from "../src/ShipResolver.sol";
import {IEAS} from "@eas/IEAS.sol";

/// @title Deploy
/// @notice Deployment script for Changelog contracts using CREATE2
/// @dev Deploys StreakTracker and ShipResolver with deterministic addresses
contract Deploy is Script {
    // Salt for CREATE2 - change this to get different addresses
    bytes32 public constant SALT = keccak256("CHANGELOG_V1");

    // EAS contract addresses
    address public constant BASE_SEPOLIA_EAS =
        0x4200000000000000000000000000000000000021;
    address public constant BASE_MAINNET_EAS =
        0x4200000000000000000000000000000000000021;

    // Schema UIDs - MUST be set after registering schemas on EAS
    // Update these after running RegisterSchemas.s.sol
    bytes32 public projectSchemaUID;

    function run() public {
        // Load environment variables
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address owner = vm.envOr("OWNER", deployer);

        // Determine which network we're on
        uint256 chainId = block.chainid;
        address easAddress;
        string memory network;

        if (chainId == 84532) {
            // Base Sepolia
            easAddress = BASE_SEPOLIA_EAS;
            network = "Base Sepolia";
            // Base Sepolia Project Schema UID (from CLAUDE.md)
            projectSchemaUID = 0x7ac71a5f2f9e8fa90bc9e8fce4f22640828d5a33d9ac6415030204d8b6acd7d6;
        } else if (chainId == 8453) {
            // Base Mainnet
            easAddress = BASE_MAINNET_EAS;
            network = "Base Mainnet";
            // TODO: Set mainnet project schema UID after registration
            projectSchemaUID = vm.envBytes32("PROJECT_SCHEMA_UID");
        } else {
            revert("Unsupported network");
        }

        console.log("=== Changelog Deployment ===");
        console.log("Network:", network);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Owner:", owner);
        console.log("EAS Address:", easAddress);
        console.log("Project Schema UID:", vm.toString(projectSchemaUID));
        console.log("");

        vm.startBroadcast(deployerPrivateKey);

        // Step 1: Deploy StreakTracker with CREATE2
        console.log("Deploying StreakTracker...");
        address streakTrackerAddr = _deployCreate2(
            type(StreakTracker).creationCode,
            abi.encode(owner),
            SALT
        );
        StreakTracker streakTracker = StreakTracker(streakTrackerAddr);
        console.log("StreakTracker deployed at:", address(streakTracker));

        // Step 2: Deploy ShipResolver with CREATE2
        console.log("Deploying ShipResolver...");
        address shipResolverAddr = _deployCreate2(
            type(ShipResolver).creationCode,
            abi.encode(
                IEAS(easAddress),
                streakTracker,
                projectSchemaUID,
                owner
            ),
            SALT
        );
        ShipResolver shipResolver = ShipResolver(payable(shipResolverAddr));
        console.log("ShipResolver deployed at:", address(shipResolver));

        // Step 3: Authorize ShipResolver in StreakTracker
        console.log("Authorizing ShipResolver in StreakTracker...");
        streakTracker.setResolverAuthorization(address(shipResolver), true);
        console.log("ShipResolver authorized");

        vm.stopBroadcast();

        // Verification
        console.log("");
        console.log("=== Deployment Complete ===");
        console.log("StreakTracker:", address(streakTracker));
        console.log("ShipResolver:", address(shipResolver));
        console.log("");
        console.log("=== Verification Commands ===");
        console.log("forge verify-contract");
        console.log(address(streakTracker));
        console.log("src/StreakTracker.sol:StreakTracker");
        console.log("--constructor-args");
        console.log(vm.toString(abi.encode(owner)));
        console.log("--chain-id");
        console.log(vm.toString(chainId));
        console.log("");
        console.log("forge verify-contract");
        console.log(address(shipResolver));
        console.log("src/ShipResolver.sol:ShipResolver");
        console.log("--constructor-args");
        console.log(
            vm.toString(
                abi.encode(
                    IEAS(easAddress),
                    streakTracker,
                    projectSchemaUID,
                    owner
                )
            )
        );
        console.log("--chain-id");
        console.log(vm.toString(chainId));
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Register Ship schema on EAS with resolver:");
        console.log(address(shipResolver));
        console.log(
            "2. Schema: bytes32 projectRefUID, string text, string link, uint256 timestamp, uint256 fid"
        );
        console.log("3. Set schema as irrevocable");
        console.log("4. Update frontend with contract addresses");
        console.log("");

        // Post-deployment assertions
        require(
            streakTracker.owner() == owner,
            "StreakTracker owner not set correctly"
        );
        require(
            shipResolver.owner() == owner,
            "ShipResolver owner not set correctly"
        );
        require(
            streakTracker.authorizedResolvers(address(shipResolver)),
            "ShipResolver not authorized"
        );
        require(
            address(shipResolver.streakTracker()) == address(streakTracker),
            "ShipResolver tracker not set correctly"
        );
        require(
            shipResolver.projectSchemaUID() == projectSchemaUID,
            "Project schema UID not set correctly"
        );

        console.log("All assertions passed!");
    }

    /// @notice Deploys a contract using CREATE2 for deterministic addresses
    /// @param creationCode The contract creation bytecode
    /// @param constructorArgs ABI-encoded constructor arguments
    /// @param salt The salt for CREATE2
    /// @return deployed The address of the deployed contract
    function _deployCreate2(
        bytes memory creationCode,
        bytes memory constructorArgs,
        bytes32 salt
    ) internal returns (address deployed) {
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);

        assembly {
            deployed := create2(0, add(bytecode, 32), mload(bytecode), salt)
            if iszero(deployed) {
                revert(0, 0)
            }
        }

        require(deployed != address(0), "CREATE2 deployment failed");
    }

    /// @notice Computes the CREATE2 address for a contract
    /// @param creationCode The contract creation bytecode
    /// @param constructorArgs ABI-encoded constructor arguments
    /// @param salt The salt for CREATE2
    /// @param deployer The address that will deploy the contract
    /// @return The predicted address
    function computeCreate2Address(
        bytes memory creationCode,
        bytes memory constructorArgs,
        bytes32 salt,
        address deployer
    ) public pure returns (address) {
        bytes memory bytecode = abi.encodePacked(creationCode, constructorArgs);
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), deployer, salt, keccak256(bytecode))
        );
        return address(uint160(uint256(hash)));
    }
}
