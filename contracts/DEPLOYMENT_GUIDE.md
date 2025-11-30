# Changelog Smart Contracts - Deployment Guide

Complete step-by-step guide for deploying Changelog smart contracts to Base Sepolia (testnet) and Base Mainnet.

## 📋 Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation) installed
- Private key with funds (Base Sepolia ETH or Base ETH)
- [Basescan API key](https://basescan.org/apis) for verification
- RPC URLs for Base networks

## 🔧 Environment Setup

### 1. Copy Environment Template

```bash
cd contracts
cp .env.example .env
```

### 2. Configure Environment Variables

Edit `.env` with your values:

```bash
# Deployment wallet (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# Optional: Separate owner address (defaults to deployer)
OWNER=0x0000000000000000000000000000000000000000

# RPC endpoints
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
BASE_RPC_URL=https://mainnet.base.org

# For contract verification
BASESCAN_API_KEY=your_api_key_here
```

### 3. Get Testnet ETH

For Base Sepolia:
- Use [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
- Or bridge from Goerli/Sepolia ETH

## 🚀 Deployment Steps

### Phase 1: Register Project Schema

The Project schema must be registered first as Ship attestations reference it.

#### Step 1.1: Run Schema Registration Script

```bash
forge script script/RegisterSchemas.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```

#### Step 1.2: Save Project Schema UID

The script will output:
```
Project Schema UID: 0x7ac71a5f2f9e8fa90bc9e8fce4f22640828d5a33d9ac6415030204d8b6acd7d6
```

**⚠️ IMPORTANT:** Copy this UID - you'll need it for the next step.

#### Step 1.3: Verify on EAS Scan

Visit the URL from the script output:
```
https://base-sepolia.easscan.org/schema/view/0x7ac...
```

Confirm:
- Schema matches: `string name,string description,string website,address creator,uint256 createdAt`
- Resolver: `0x0000000000000000000000000000000000000000` (no resolver)
- Revocable: `false`

### Phase 2: Deploy Contracts

#### Step 2.1: Update Deploy Script

Edit `script/Deploy.s.sol` line 42 with your Project Schema UID:

```solidity
// Replace this line for Base Sepolia:
projectSchemaUID = 0x<YOUR_PROJECT_SCHEMA_UID_HERE>;
```

#### Step 2.2: Run Deployment

```bash
forge script script/Deploy.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  --interactives 1 \
  -vvvv
```

**What this does:**
1. Deploys `StreakTracker` with CREATE2 (deterministic address)
2. Deploys `ShipResolver` with CREATE2
3. Authorizes `ShipResolver` in `StreakTracker`
4. Verifies contracts on Basescan
5. Outputs contract addresses

#### Step 2.3: Save Contract Addresses

The script outputs:
```
=== Deployment Complete ===
StreakTracker: 0x1234...
ShipResolver: 0x5678...
```

**⚠️ CRITICAL:** Save these addresses - they're needed for frontend integration.

#### Step 2.4: Verify Deployment

Check contracts on Basescan:
```
https://sepolia.basescan.org/address/0x1234...  (StreakTracker)
https://sepolia.basescan.org/address/0x5678...  (ShipResolver)
```

Confirm:
- Contracts are verified (green checkmark)
- Owner is set correctly
- ShipResolver is authorized in StreakTracker

### Phase 3: Register Ship Schema

The Ship schema must reference the deployed ShipResolver.

#### Option A: Manual Registration (Recommended)

1. Go to [Base Sepolia EAS](https://base-sepolia.easscan.org/schema/create)
2. Fill in schema details:
   - **Schema**: `string text,string[] links,uint256 timestamp,uint256 fid`
   - **Resolver**: `<ShipResolver address from Phase 2>`
   - **Revocable**: `false` (IMPORTANT!)
   - **Note**: Ships use EAS's native `refUID` field to reference Projects
3. Click "Register Schema"
4. Confirm transaction
5. Save the Ship Schema UID

#### Option B: Script Registration

```bash
forge script script/RegisterSchemas.s.sol \
  --sig "registerShipSchema(address)" \
  <SHIP_RESOLVER_ADDRESS> \
  --rpc-url base_sepolia \
  --broadcast \
  -vvvv
```

#### Step 3.2: Verify Ship Schema

Visit:
```
https://base-sepolia.easscan.org/schema/view/0xABC...
```

Confirm:
- Schema matches: `string text,string[] links,uint256 timestamp,uint256 fid`
- Resolver points to your ShipResolver
- Revocable: `false`
- Ships reference Projects via `refUID` field (not in schema data)

### Phase 4: Test End-to-End

#### Step 4.1: Create Test Project Attestation

Using [EAS SDK](https://docs.attest.org/docs/quick--start/):

```typescript
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";

const eas = new EAS("0x4200000000000000000000000000000000000021"); // Base Sepolia EAS
await eas.connect(signer);

const encoder = new SchemaEncoder("string name,string description,string website,address creator,uint256 createdAt");
const projectData = encoder.encodeData([
  { name: "name", value: "Test Project", type: "string" },
  { name: "description", value: "A test project", type: "string" },
  { name: "website", value: "https://test.com", type: "string" },
  { name: "creator", value: signerAddress, type: "address" },
  { name: "createdAt", value: Date.now(), type: "uint256" }
]);

const tx = await eas.attest({
  schema: PROJECT_SCHEMA_UID,
  data: {
    recipient: ethers.constants.AddressZero,
    expirationTime: 0,
    revocable: false,
    data: projectData
  }
});

const newProjectUID = await tx.wait();
console.log("Project UID:", newProjectUID);
```

#### Step 4.2: Create Test Ship Attestation

```typescript
const encoder = new SchemaEncoder("string text,string[] links,uint256 timestamp,uint256 fid");
const shipData = encoder.encodeData([
  { name: "text", value: "Shipped feature X", type: "string" },
  { name: "links", value: ["https://github.com/user/repo/pull/123", "https://docs.example.com"], type: "string[]" },
  { name: "timestamp", value: Date.now(), type: "uint256" },
  { name: "fid", value: 12345, type: "uint256" }
]);

const tx = await eas.attest({
  schema: SHIP_SCHEMA_UID,
  data: {
    recipient: ethers.constants.AddressZero,
    expirationTime: 0,
    revocable: false,
    refUID: projectUID, // Reference Project attestation via EAS native field
    data: shipData
  }
});

await tx.wait();
```

#### Step 4.3: Verify Streak Tracking

```bash
# Using cast
cast call <STREAK_TRACKER_ADDRESS> "getCurrentStreak(uint256)" 12345 --rpc-url base_sepolia

# Should return: 1 (0x0000...0001)
```

## 🎯 Mainnet Deployment

Once tested on Base Sepolia, deploy to mainnet:

### 1. Update Environment

```bash
# Use mainnet RPC
BASE_RPC_URL=https://mainnet.base.org

# Ensure you have real ETH in deployment wallet
```

### 2. Register Project Schema (Mainnet)

```bash
forge script script/RegisterSchemas.s.sol \
  --rpc-url base \
  --broadcast \
  --verify \
  -vvvv
```

### 3. Update Deploy Script

Edit `script/Deploy.s.sol` line 48 with mainnet Project Schema UID:

```solidity
projectSchemaUID = vm.envBytes32("PROJECT_SCHEMA_UID");
```

Set in `.env`:
```bash
PROJECT_SCHEMA_UID=0x<mainnet_project_schema_uid>
```

### 4. Deploy Contracts (Mainnet)

```bash
forge script script/Deploy.s.sol \
  --rpc-url base \
  --broadcast \
  --verify \
  --interactives 1 \
  --gas-estimate-multiplier 120 \
  -vvvv
```

**Note:** `--gas-estimate-multiplier 120` adds 20% buffer for mainnet gas volatility.

### 5. Register Ship Schema (Mainnet)

Follow Phase 3 steps using mainnet addresses.

## 📝 Post-Deployment Checklist

- [ ] All contracts deployed successfully
- [ ] All contracts verified on Basescan
- [ ] Project Schema registered and verified
- [ ] Ship Schema registered with correct resolver
- [ ] Ship Schema set as irrevocable
- [ ] ShipResolver authorized in StreakTracker
- [ ] Test project attestation created
- [ ] Test ship attestation created
- [ ] Streak tracking verified (returns 1)
- [ ] Contract addresses documented
- [ ] Schema UIDs documented
- [ ] Frontend updated with new addresses

## 🔗 Contract Addresses

### Base Sepolia (Testnet)

```
EAS Contract: 0x4200000000000000000000000000000000000021
Schema Registry: 0x4200000000000000000000000000000000000020

Project Schema UID: 0x7ac71a5f2f9e8fa90bc9e8fce4f22640828d5a33d9ac6415030204d8b6acd7d6
Ship Schema UID: <to be registered>

StreakTracker: <to be deployed>
ShipResolver: <to be deployed>
```

### Base Mainnet (Production)

```
EAS Contract: 0x4200000000000000000000000000000000000021
Schema Registry: 0x4200000000000000000000000000000000000020

Project Schema UID: <to be registered>
Ship Schema UID: <to be registered>

StreakTracker: <to be deployed>
ShipResolver: <to be deployed>
```

## 🐛 Troubleshooting

### "Invalid project reference" error
- Ensure Project Schema UID in `Deploy.s.sol` is correct
- Verify project attestation exists on EAS
- Check project attestation uses correct schema

### "Already shipped today" error
- Expected if testing same FID within 24 hours
- Use different FID or wait 24 hours
- Or deploy new contracts (change SALT in Deploy.s.sol)

### CREATE2 deployment fails
- Change SALT constant in `Deploy.s.sol`
- Ensure deployer has sufficient ETH
- Check RPC URL is correct

### Verification fails
- Wait 30 seconds after deployment
- Run verification manually:
```bash
forge verify-contract <address> \
  src/StreakTracker.sol:StreakTracker \
  --constructor-args $(cast abi-encode "constructor(address)" <owner>) \
  --chain-id 84532
```

### Ship attestation fails
- Verify text is not empty and <5000 chars
- Ensure FID is not 0
- Check project reference exists
- Verify haven't shipped in last 24 hours

## 📚 Resources

- [EAS Documentation](https://docs.attest.org/)
- [Base Documentation](https://docs.base.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [EAS SDK](https://github.com/ethereum-attestation-service/eas-sdk)
- [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)

## 🆘 Support

If you encounter issues:

1. Check contract events on Basescan
2. Review attestations on EAS Scan
3. Test on Base Sepolia first
4. Open GitHub issue with error logs
5. Join Discord for real-time help

## 🎉 Success!

Once deployed, update the frontend:

```typescript
// src/lib/contracts.ts
export const CONTRACTS = {
  STREAK_TRACKER: "0x<deployed_address>",
  SHIP_RESOLVER: "0x<deployed_address>",
  PROJECT_SCHEMA_UID: "0x<project_schema_uid>",
  SHIP_SCHEMA_UID: "0x<ship_schema_uid>"
};
```

You're now ready to start building in public! 🚀