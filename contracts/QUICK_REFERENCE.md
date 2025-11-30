# Changelog Contracts - Quick Reference

## 🚀 Quick Start Commands

### Initial Setup
```bash
cd contracts
forge install
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

### Build & Test
```bash
forge build                    # Compile contracts
forge test                     # Run all tests
forge test -vvv                # Run with detailed output
forge test --match-test <name> # Run specific test
forge coverage                 # Generate coverage report
```

### Deploy to Base Sepolia

#### 1. Register Project Schema
```bash
forge script script/RegisterSchemas.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  -vvvv
```
**Save the Project Schema UID!**

#### 2. Update Deploy Script
Edit `script/Deploy.s.sol` line 42 with Project Schema UID.

#### 3. Deploy Contracts
```bash
forge script script/Deploy.s.sol \
  --rpc-url base_sepolia \
  --broadcast \
  --verify \
  --interactives 1 \
  -vvvv
```
**Save StreakTracker and ShipResolver addresses!**

#### 4. Register Ship Schema
Go to https://base-sepolia.easscan.org/schema/create

- Schema: `string text,string[] links,uint256 timestamp,uint256 fid`
- Resolver: `<ShipResolver address>`
- Revocable: `false`
- Note: Ships use EAS's native `refUID` field to reference Projects

**Save the Ship Schema UID!**

---

## 📋 Contract Addresses

### Base Sepolia (Testnet)
```
EAS: 0x4200000000000000000000000000000000000021
Schema Registry: 0x4200000000000000000000000000000000000020

Project Schema: 0x7ac71a5f2f9e8fa90bc9e8fce4f22640828d5a33d9ac6415030204d8b6acd7d6
Ship Schema: <register after deployment>

StreakTracker: <deploy>
ShipResolver: <deploy>
```

---

## 🧪 Useful Test Commands

```bash
# Run specific test file
forge test --match-contract StreakTrackerTest

# Run specific test
forge test --match-test test_RecordFirstShip

# Fuzz tests only
forge test --match-test testFuzz_

# Gas report
forge test --gas-report

# Coverage with details
forge coverage --report summary
```

---

## 🔍 Interaction Commands (Cast)

### Query Streak Tracker
```bash
# Get current streak
cast call <TRACKER_ADDR> "getCurrentStreak(uint256)" <FID> --rpc-url base_sepolia

# Get total ships
cast call <TRACKER_ADDR> "getTotalShips(uint256)" <FID> --rpc-url base_sepolia

# Has shipped today?
cast call <TRACKER_ADDR> "hasShippedToday(uint256)" <FID> --rpc-url base_sepolia

# Get comprehensive data
cast call <TRACKER_ADDR> "getStreakData(uint256)" <FID> --rpc-url base_sepolia
```

### Query Ship Resolver
```bash
# Has user shipped today?
cast call <RESOLVER_ADDR> "hasShippedToday(uint256)" <FID> --rpc-url base_sepolia

# Time until next ship allowed
cast call <RESOLVER_ADDR> "getTimeUntilNextShip(uint256)" <FID> --rpc-url base_sepolia
```

---

## 📝 Schema Definitions

### Project Schema
```
string name
string description
string website
address creator
uint256 createdAt
```

### Ship Schema
```
string text
string[] links
uint256 timestamp
uint256 fid
```

**Note:** Ships reference Projects using EAS's native `refUID` field (not in schema data).

---

## 🔗 Useful Links

- **EAS Docs**: https://docs.attest.org/
- **Base Docs**: https://docs.base.org/
- **Base Sepolia Faucet**: https://www.coinbase.com/faucets/base-ethereum-goerli-faucet
- **Base Sepolia EAS Scan**: https://base-sepolia.easscan.org/
- **Base Sepolia Basescan**: https://sepolia.basescan.org/
- **Foundry Book**: https://book.getfoundry.sh/

---

## 🐛 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Run `forge clean && forge build` |
| Test fails | Check `setUp()` doesn't have double `vm.prank()` |
| CREATE2 fails | Change `SALT` in Deploy.s.sol |
| "Already shipped" | Wait 24h or use different FID |
| Verification fails | Wait 30s, then manually verify |
| "Invalid project" | Check project attestation exists on EAS |

---

## 📊 Test Results

```
✓ 26 StreakTracker tests (all passing)
✓ 14 ShipResolver tests (all passing)
✓ 100% coverage on ShipResolver
✓ 98.4% coverage on StreakTracker
```

---

## 🎯 Deployment Checklist

- [ ] Environment variables set (.env)
- [ ] Private key has testnet ETH
- [ ] Project Schema registered
- [ ] Project Schema UID saved
- [ ] Deploy script updated with Schema UID
- [ ] Contracts deployed successfully
- [ ] Contracts verified on Basescan
- [ ] StreakTracker address saved
- [ ] ShipResolver address saved
- [ ] Ship Schema registered with resolver
- [ ] Ship Schema UID saved
- [ ] Test attestations created
- [ ] Streak tracking verified
- [ ] Frontend updated with addresses

---

**For detailed instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)**

**For full documentation, see [README.md](./README.md)**