# Schema Improvements - Design Decisions

## Summary

We refined the Ship schema to leverage EAS's native capabilities and support richer content sharing. The improved design is cleaner, more composable, and better aligned with EAS best practices.

## Changes Made

### 1. Removed `projectRefUID` from Schema Data

**Before:**
```solidity
// Ship Schema
bytes32 projectRefUID
string text
string link
uint256 timestamp
uint256 fid
```

**After:**
```solidity
// Ship Schema
string text
string[] links
uint256 timestamp
uint256 fid

// Project reference via EAS native field:
attestation.refUID = projectAttestationUID
```

**Rationale:**

✅ **Cleaner Architecture** - `refUID` is a native EAS field that exists on every attestation. Using it for project references keeps the schema focused on the update content itself.

✅ **EAS Best Practice** - EAS provides `refUID` specifically for creating attestation graphs. Using it as intended makes our data more composable with other EAS applications.

✅ **Simpler Schema** - Removes redundant data from the schema payload. The reference relationship is handled at the attestation layer where it belongs.

✅ **Better Composability** - Other apps can easily follow attestation references without knowing our specific schema structure.

**Example Usage:**
```typescript
const tx = await eas.attest({
  schema: SHIP_SCHEMA_UID,
  data: {
    recipient: ethers.constants.AddressZero,
    expirationTime: 0,
    revocable: false,
    refUID: projectUID,  // ← Native EAS field for references
    data: encodedShipData
  }
});
```

---

### 2. Changed Single Link to Multiple Links Array

**Before:**
```solidity
string link  // Single URL
```

**After:**
```solidity
string[] links  // Array of URLs (0-10 links)
```

**Rationale:**

✅ **Richer Updates** - Builders often need to share multiple resources:
- GitHub PR: `https://github.com/user/repo/pull/123`
- Documentation: `https://docs.project.com/new-feature`
- Live Demo: `https://demo.project.com`
- Blog Post: `https://blog.project.com/what-we-shipped`

✅ **Flexibility** - Users can share 0 (text-only), 1, or multiple links as needed.

✅ **Spam Prevention** - Max 10 links enforced by resolver to prevent abuse.

✅ **Better Discovery** - More links = more ways to explore what was built.

**Example Usage:**
```typescript
const encoder = new SchemaEncoder("string text,string[] links,uint256 timestamp,uint256 fid");

const shipData = encoder.encodeData([
  { 
    name: "text", 
    value: "Shipped authentication system with OAuth support", 
    type: "string" 
  },
  { 
    name: "links", 
    value: [
      "https://github.com/user/auth/pull/42",
      "https://docs.auth.com/oauth-guide",
      "https://demo.auth.com"
    ], 
    type: "string[]" 
  },
  { name: "timestamp", value: Date.now(), type: "uint256" },
  { name: "fid", value: userFID, type: "uint256" }
]);
```

---

## Implementation Details

### Contract Changes

**ShipResolver.sol:**
```solidity
// New validation for refUID
if (attestation.refUID == bytes32(0)) {
    revert MissingProjectReference();
}

// Validate project exists using refUID
if (!_isValidProjectAttestation(attestation.refUID)) {
    revert InvalidProjectReference();
}

// Decode new schema format
(string memory text, string[] memory links, , uint256 fid) = abi.decode(
    attestation.data,
    (string, string[], uint256, uint256)
);

// Validate links array
if (links.length > MAX_LINKS) revert TooManyLinks();
```

**New Constants:**
```solidity
uint256 public constant MAX_LINKS = 10;
```

**New Errors:**
```solidity
error MissingProjectReference();
error TooManyLinks();
```

### Test Coverage

Added new tests to ensure correctness:

✅ `test_MultipleLinks()` - Verify 3 links work correctly
✅ `test_RevertWhen_TooManyLinks()` - Ensure >10 links are rejected  
✅ `test_RevertWhen_MissingProjectReference()` - Ensure empty refUID reverts
✅ Updated all existing tests to use new schema format

**Results:** All 43 tests passing (17 ShipResolver + 26 StreakTracker)

---

## Benefits

### 1. Developer Experience
- **Simpler SDK usage** - refUID is a standard field
- **Less confusion** - Clear separation between schema data and references
- **More expressive** - Multiple links let builders share their work better

### 2. Data Integrity
- **Type safety** - EAS handles reference validation at protocol level
- **Cleaner queries** - Can filter/traverse by refUID using EAS GraphQL
- **Better UX** - Frontends can easily display project relationships

### 3. Composability
- **Standard patterns** - Other EAS apps understand refUID references
- **Cross-app data** - Projects can be used by other applications
- **Future-proof** - Aligns with EAS ecosystem conventions

---

## Migration Notes

**For Testnet Deployments:**
- ✅ Already updated - no migration needed
- New schema will be registered with ShipResolver

**For Future Mainnet:**
- Deploy with updated schema from day 1
- No migration concerns

**For Frontend:**
Update attestation creation:
```typescript
// OLD - Don't use
const oldData = encoder.encodeData([
  { name: "projectRefUID", value: projectUID, type: "bytes32" },
  { name: "text", value: text, type: "string" },
  { name: "link", value: url, type: "string" },
  // ...
]);

// NEW - Use this
const newData = encoder.encodeData([
  { name: "text", value: text, type: "string" },
  { name: "links", value: [url1, url2], type: "string[]" },
  // ...
]);

// Add refUID at attestation level
await eas.attest({
  schema: SHIP_SCHEMA_UID,
  data: {
    refUID: projectUID,  // ← Project reference here
    data: newData,
    // ...
  }
});
```

---

## Documentation Updated

All documentation has been updated to reflect these changes:

✅ `contracts/README.md` - Updated schema definitions and examples
✅ `contracts/DEPLOYMENT_GUIDE.md` - Updated deployment instructions
✅ `contracts/QUICK_REFERENCE.md` - Updated quick reference
✅ `CONTRACTS_SUMMARY.md` - Updated implementation summary
✅ `CLAUDE.md` - Updated schema documentation

---

## Final Schema Definitions

### Project Schema
```
string name
string description
string website
address creator
uint256 createdAt
```
- **Revocable:** false
- **Resolver:** none
- **Purpose:** First-class project identity

### Ship Schema
```
string text
string[] links
uint256 timestamp
uint256 fid
```
- **Revocable:** false
- **Resolver:** ShipResolver address
- **References Projects via:** EAS native `refUID` field
- **Purpose:** Daily updates with multiple resource links

---

## Conclusion

These improvements make the Changelog schema cleaner, more flexible, and better aligned with EAS best practices. The use of native `refUID` for project references and support for multiple links creates a better experience for builders while maintaining data integrity and composability.

**Result:** Production-ready contracts with 43 passing tests, ready for deployment. 🚀