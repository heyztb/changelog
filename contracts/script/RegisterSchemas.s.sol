// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ISchemaRegistry, SchemaRecord} from "@eas/ISchemaRegistry.sol";
import {ISchemaResolver} from "@eas/resolver/ISchemaResolver.sol";

/// @title RegisterSchemas
/// @notice Script to register Project and Ship schemas on EAS
/// @dev Run this BEFORE deploying contracts to get schema UIDs
contract RegisterSchemas is Script {
    // Schema Registry addresses
    address public constant BASE_SEPOLIA_SCHEMA_REGISTRY =
        0x4200000000000000000000000000000000000020;
    address public constant BASE_MAINNET_SCHEMA_REGISTRY =
        0x4200000000000000000000000000000000000020;

    // Schema definitions
    string public constant PROJECT_SCHEMA =
        "string name,string description,string website,address creator,uint256 createdAt";

    string public constant SHIP_SCHEMA =
        "string text,string[] links,uint256 timestamp,uint256 fid";

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        // Determine network
        uint256 chainId = block.chainid;
        address schemaRegistryAddress;
        string memory network;

        if (chainId == 84532) {
            // Base Sepolia
            schemaRegistryAddress = BASE_SEPOLIA_SCHEMA_REGISTRY;
            network = "Base Sepolia";
        } else if (chainId == 8453) {
            // Base Mainnet
            schemaRegistryAddress = BASE_MAINNET_SCHEMA_REGISTRY;
            network = "Base Mainnet";
        } else {
            revert("Unsupported network");
        }

        console.log("=== EAS Schema Registration ===");
        console.log("Network:", network);
        console.log("Chain ID:", chainId);
        console.log("Deployer:", deployer);
        console.log("Schema Registry:", schemaRegistryAddress);
        console.log("");

        ISchemaRegistry schemaRegistry = ISchemaRegistry(schemaRegistryAddress);

        vm.startBroadcast(deployerPrivateKey);

        // Register Project Schema (no resolver, irrevocable)
        console.log("Registering Project Schema...");
        console.log("Schema:", PROJECT_SCHEMA);
        bytes32 projectSchemaUID = schemaRegistry.register(
            PROJECT_SCHEMA,
            ISchemaResolver(address(0)), // No resolver
            false // Irrevocable
        );
        console.log("Project Schema UID:", vm.toString(projectSchemaUID));
        console.log("");

        // Note: Ship schema must be registered AFTER deploying ShipResolver
        // Ships reference Projects using EAS native refUID field
        console.log("Ship Schema (register AFTER deploying ShipResolver):");
        console.log("Schema:", SHIP_SCHEMA);
        console.log("Resolver: <ShipResolver address from Deploy.s.sol>");
        console.log("Revocable: false");
        console.log("Note: Use refUID field to reference Project attestations");
        console.log("");

        vm.stopBroadcast();

        // Verify Project Schema
        SchemaRecord memory projectRecord = schemaRegistry.getSchema(
            projectSchemaUID
        );
        require(
            keccak256(bytes(projectRecord.schema)) ==
                keccak256(bytes(PROJECT_SCHEMA)),
            "Project schema mismatch"
        );
        require(
            address(projectRecord.resolver) == address(0),
            "Project resolver should be zero"
        );
        require(
            !projectRecord.revocable,
            "Project schema should be irrevocable"
        );

        console.log("=== Registration Complete ===");
        console.log("");
        console.log("Project Schema UID:", vm.toString(projectSchemaUID));
        console.log("");
        console.log("=== Next Steps ===");
        console.log("1. Update PROJECT_SCHEMA_UID in Deploy.s.sol");
        console.log("2. Run Deploy.s.sol to deploy contracts");
        console.log(
            "3. Register Ship Schema manually on EAS with ShipResolver address"
        );
        console.log("4. Schema:", SHIP_SCHEMA);
        console.log("5. Resolver: <address from Deploy.s.sol output>");
        console.log("6. Revocable: false");
        console.log("");
        console.log("=== Project Schema Details ===");
        console.log("EAS Scan URL:");
        if (chainId == 84532) {
            console.log(
                string.concat(
                    "https://base-sepolia.easscan.org/schema/view/",
                    vm.toString(projectSchemaUID)
                )
            );
        } else {
            console.log(
                string.concat(
                    "https://base.easscan.org/schema/view/",
                    vm.toString(projectSchemaUID)
                )
            );
        }
    }

    /// @notice Helper function to register Ship schema after deploying ShipResolver
    /// @dev Call this after Deploy.s.sol completes
    /// @param shipResolverAddress The address of the deployed ShipResolver
    function registerShipSchema(address shipResolverAddress) public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");

        uint256 chainId = block.chainid;
        address schemaRegistryAddress;

        if (chainId == 84532) {
            schemaRegistryAddress = BASE_SEPOLIA_SCHEMA_REGISTRY;
        } else if (chainId == 8453) {
            schemaRegistryAddress = BASE_MAINNET_SCHEMA_REGISTRY;
        } else {
            revert("Unsupported network");
        }

        ISchemaRegistry schemaRegistry = ISchemaRegistry(schemaRegistryAddress);

        vm.startBroadcast(deployerPrivateKey);

        console.log("Registering Ship Schema...");
        console.log("Schema:", SHIP_SCHEMA);
        console.log("Resolver:", shipResolverAddress);

        bytes32 shipSchemaUID = schemaRegistry.register(
            SHIP_SCHEMA,
            ISchemaResolver(shipResolverAddress), // ShipResolver address
            false // Irrevocable
        );

        console.log("Ship Schema UID:", vm.toString(shipSchemaUID));

        vm.stopBroadcast();

        // Verify Ship Schema
        SchemaRecord memory shipRecord = schemaRegistry.getSchema(
            shipSchemaUID
        );
        require(
            keccak256(bytes(shipRecord.schema)) ==
                keccak256(bytes(SHIP_SCHEMA)),
            "Ship schema mismatch"
        );
        require(
            address(shipRecord.resolver) == shipResolverAddress,
            "Ship resolver mismatch"
        );
        require(!shipRecord.revocable, "Ship schema should be irrevocable");

        console.log("");
        console.log("Ship Schema registered successfully!");
        console.log("Schema UID:", vm.toString(shipSchemaUID));
        console.log("");
        console.log("EAS Scan URL:");
        if (chainId == 84532) {
            console.log(
                string.concat(
                    "https://base-sepolia.easscan.org/schema/view/",
                    vm.toString(shipSchemaUID)
                )
            );
        } else {
            console.log(
                string.concat(
                    "https://base.easscan.org/schema/view/",
                    vm.toString(shipSchemaUID)
                )
            );
        }
    }
}
