# Changelog Smart Contracts

Decentralized smart contracts for the Changelog miniapp, built with Foundry and integrated with Ethereum Attestation Service (EAS).

## 📋 Overview

The Changelog contract suite enables builders to:
- Create **Project** attestations (composable, portable project identity)
- Create **Ship** attestations (daily updates that reference projects)
- Track **shipping streaks** automatically via resolver contracts
- Build **on-chain reputation** through immutable attestations

### Architecture

```
┌─────────────────────────────────────────────┐
│ EAS (Ethereum Attestation Service)         │
├─────────────────────────────────────────────┤
│ • Project Schema (no resolver)              │
│ • Ship Schema (ShipResolver attached)       │
│ • All data queryable via GraphQL            │
└─────────────────────────────────────────────┘
               ↓ triggers on attest
┌─────────────────────────────────────────────┐
│ ShipResolver                                │
├─────────────────────────────────────────────┤
│ • Validates project references              │
│ • Enforces rate limits (1 ship/24h)         │
│ • Updates StreakTracker automatically       │
│ • Prevents spam and invalid data            │
└─────────────────────────────────────────────┘
               ↓ updates
┌─────────────────────────────────────────────┐
│ StreakTracker                               │
├─────────────────────────────────────────────┤
│ • Tracks current streak per FID             │
│ • Records ship history                      │
│ • Calculates longest streak                 │
│ • Read by NFT contract (future)             │
└─────────────────────────────────────────────┘
```

## 🏗️ Contracts

### StreakTracker
Tracks daily shipping streaks for users (identified by Farcaster ID).

**Features:**
- Records ships per FID
- Calculates consecutive day streaks
- Handles streak breaks automatically
- Access control for authorized resolvers
- View functions for current/longest streaks

**Key Functions:**
```solidity
function recordShip(uint256 fid, bytes32 attestationUID) external;
function getCurrentStreak(uint256 fid) external view returns (uint256);
function getStreakData(uint256 fid) external view returns (...);
```

### ShipResolver
EAS resolver contract that validates ship attestations and updates streak tracking.

**Features:**
- Validates project references exist
- Enforces 24-hour rate limit
- Validates text length (1-5000 chars)
- Automatically records ships in StreakTracker
- Prevents revocation (ships are immutable)

**Schema:**
```
string text
string[] links
uint256 timestamp
uint256 fid
```

**Key Design:** Ships use EAS's native `refUID` field to reference Project attestations, keeping the schema focused on the update content. The `links` array allows sharing multiple URLs (GitHub PR, docs, demo, etc.).

## 🚀 Quick Start

### Prerequisites

- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Bun](https://bun.sh) (for parent project)
- Base Sepolia ETH for testnet deployment

### Installation

```bash
cd contracts
forge install
```

### Environment Setup

```bash
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

### Build

```bash
forge build
```

### Test

```bash
# Run all tests
forge test

# Run with gas reports
forge test --gas-report

# Run specific test
forge test --match-test test_RecordFirstShip

# Run with verbosity for traces
forge test -vvv
```

### Test Coverage

```bash
forge coverage
```

## 📦 Deployment

### Step 1: Register Project Schema

Register the Project schema on EAS (no resolver needed):

```bash
forge script script/RegisterSchemas.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify
```

**Save the Project Schema UID** from the output.

### Step 2: Update Deploy Script

Update `script/Deploy.s.sol` with the Project Schema UID:

```solidity
// In Deploy.s.sol, update this line for Base Sepolia:
projectSchemaUID = 0x<YOUR_PROJECT_SCHEMA_UID_HERE>;
```

### Step 3: Deploy Contracts

Deploy StreakTracker and ShipResolver with CREATE2 (deterministic addresses):

```bash
forge script script/Deploy.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  --interactives 1
```

This will:
1. Deploy StreakTracker
2. Deploy ShipResolver
3. Authorize ShipResolver in StreakTracker
4. Output contract addresses and verification commands

### Step 4: Register Ship Schema

After deployment, register the Ship schema with the ShipResolver address:

**Option A: Manual (recommended for visibility)**
1. Go to [Base Sepolia EAS](https://base-sepolia.easscan.org/)
2. Navigate to "Register Schema"
3. Enter schema: `bytes32 projectRefUID,string text,string link,uint256 timestamp,uint256 fid`
4. Set resolver to the deployed ShipResolver address
5. Set revocable to `false`

**Option B: Script**
```bash
forge script script/RegisterSchemas.s.sol \
  --sig "registerShipSchema(address)" \
  <SHIP_RESOLVER_ADDRESS> \
  --rpc-url base_sepolia \
  --broadcast
```

### Deployment Addresses (Base Sepolia)

**Note:** Addresses are deterministic via CREATE2. Update after your deployment.

```
StreakTracker: 0x... (to be deployed)
ShipResolver: 0x... (to be deployed)
Project Schema UID: 0x7ac71a5f2f9e8fa90bc9e8fce4f22640828d5a33d9ac6415030204d8b6acd7d6
Ship Schema UID: 0x... (to be registered)
```

## 🧪 Testing

### Unit Tests

Comprehensive test coverage for all contracts:

```bash
# StreakTracker tests
forge test --match-contract StreakTrackerTest

# ShipResolver tests
forge test --match-contract ShipResolverTest
```

### Fuzz Tests

Automated property-based testing:

```bash
forge test --match-test testFuzz_
```

### Test Coverage Report

```bash
forge coverage --report summary
```

Expected coverage: **>95%** for all contracts.

## 🔒 Security

### Auditing

- [ ] Internal review completed
- [ ] External audit (planned for mainnet)
- [ ] Bug bounty program (post-launch)

### Best Practices

✅ **Access Control:** Ownable for admin functions, resolver authorization
✅ **Input Validation:** All inputs validated (FID, text length, references)
✅ **Rate Limiting:** 24-hour cooldown between ships
✅ **Immutability:** Ships cannot be revoked (data integrity)
✅ **Gas Optimization:** Efficient storage patterns, minimal on-chain data
✅ **Reentrancy Protection:** No external calls in state-changing functions

### Known Limitations

1. **Streak calculation uses block.timestamp** - Assumes ~12 second blocks (acceptable for daily streaks)
2. **FID trust model** - Assumes Farcaster FIDs are unique per user (handled by frontend)
3. **Project reference validation** - Only checks existence, not schema match (acceptable tradeoff)

## 📚 Development

### Project Structure

```
contracts/
├── src/
│   ├── interfaces/
│   │   └── IStreakTracker.sol      # StreakTracker interface
│   ├── StreakTracker.sol           # Streak tracking logic
│   └── ShipResolver.sol            # EAS resolver with validation
├── test/
│   ├── StreakTracker.t.sol         # StreakTracker tests
│   └── ShipResolver.t.sol          # ShipResolver tests
├── script/
│   ├── Deploy.s.sol                # Main deployment script
│   └── RegisterSchemas.s.sol       # EAS schema registration
└── foundry.toml                    # Foundry configuration
```

### Adding New Features

1. Write tests first (`test/YourContract.t.sol`)
2. Implement contract (`src/YourContract.sol`)
3. Run tests: `forge test`
4. Check coverage: `forge coverage`
5. Update deployment scripts if needed

### Upgrading Contracts

Contracts are **not upgradeable** by design (immutability for trust). To deploy new versions:

1. Update `SALT` in `Deploy.s.sol` to get new addresses
2. Deploy new contracts
3. Update frontend to point to new addresses
4. Optionally migrate data (via events/subgraph)

## 🔗 Integration

### Frontend Integration

See `src/lib/eas.ts` in the parent project for integration examples.

**Creating a Ship:**
```typescript
import { EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";

const eas = new EAS(EAS_CONTRACT_ADDRESS);
eas.connect(signer);

const encoder = new SchemaEncoder(
  "string text,string[] links,uint256 timestamp,uint256 fid"
);

const encodedData = encoder.encodeData([
  { name: "text", value: "Shipped feature X", type: "string" },
  { name: "links", value: ["https://github.com/user/repo/pull/123", "https://docs.example.com"], type: "string[]" },
  { name: "timestamp", value: Date.now(), type: "uint256" },
  { name: "fid", value: userFID, type: "uint256" }
]);

const tx = await eas.attest({
  schema: SHIP_SCHEMA_UID,
  data: {
    recipient: ethers.constants.AddressZero,
    expirationTime: 0,
    revocable: false,
    refUID: projectUID, // References Project attestation via EAS native field
    data: encodedData
  }
});
```

### Querying Streaks

```typescript
import { StreakTracker__factory } from "./generated";

const tracker = StreakTracker__factory.connect(
  STREAK_TRACKER_ADDRESS,
  provider
);

const streak = await tracker.getCurrentStreak(fid);
const data = await tracker.getStreakData(fid);
```

### GraphQL Queries

Query attestations from EAS GraphQL endpoint:

```graphql
query Ships($fid: Int!) {
  attestations(
    where: {
      schema: { equals: $shipSchemaUID }
      decodedDataJson: { contains: $fid }
    }
    orderBy: { time: desc }
  ) {
    id
    attester
    recipient
    refUID  # References the Project attestation
    data
    time
  }
}
```

## 📖 Additional Resources

- [EAS Documentation](https://docs.attest.org/)
- [Foundry Book](https://book.getfoundry.sh/)
- [Base Network Docs](https://docs.base.org/)
- [Project Architecture (CLAUDE.md)](../CLAUDE.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new functionality
4. Ensure all tests pass: `forge test`
5. Submit a pull request

### Style Guide

- Follow [Solidity Style Guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- Use NatSpec comments for all public/external functions
- Write descriptive test names: `test_RevertWhen_ConditionNotMet`
- Keep functions focused and under 50 lines

## 📄 License

MIT License - see [LICENSE](../LICENSE) for details

## 🆘 Support

- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Discord: [Join our community](https://discord.gg/your-invite)
- Twitter: [@yourproject](https://twitter.com/yourproject)

---

**Built with ❤️ for builders who ship daily**