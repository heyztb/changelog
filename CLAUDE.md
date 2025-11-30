
Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";

// import .css files directly and it works
import './index.css';

import { createRoot } from "react-dom/client";

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.md`.

# Changelog Miniapp - Conversation Summary

## Core Concept
A Farcaster miniapp for builders to log what they ship daily. Twitter-like interface with "What did you ship today?" as the main action. Tracks streaks, creates accountability, and serves as a discovery layer for talent and projects.

## Key Design Decisions

### Why It Works (The 4 Criteria)
1. **Repeat usage**: Daily shipping habit, streak mechanics, self-tracking
2. **Social layer**: Follow other builders, see what they're shipping, accountability
3. **Feed content**: Stream of daily wins, progress updates, launches
4. **Emotional reward**: Validation, momentum, seeing your own growth

### Spam Prevention
- Gate with Neynar score (filters bots/new accounts)
- One ship per day max (rate limiting)
- Built-in friction (gas costs) filters low-effort spam
- Builder identity is reputational (Farcaster FID has history)

## Technical Architecture

### Full Decentralization Stack
- **Frontend**: IPFS + ENS (changelog.heyztb.eth.limo)
- **Data Storage**: Ethereum Attestation Service (EAS)
- **Streak Tracking**: Lightweight smart contract
- **Proof**: Dynamic NFT that updates to show current streak
- **Network**: Base L2 for cheap transactions (~$0.0008 per ship)

### EAS Schemas

**Project Schema:**
```
string name
string description
string website
address creator
uint256 createdAt
```

**Ship Schema:**
```
string text
string[] links
uint256 timestamp
uint256 fid
```

**Key Design:** Ships use EAS's native `refUID` field to reference Project attestations, keeping schemas focused and composable. The `links` array supports multiple URLs (GitHub, docs, demos, etc.).

### Smart Contracts
1. **StreakTracker**: Calculates streaks based on daily ships
   - Tracks last ship date per FID
   - Auto-updates streak count
   - Handles streak breaks

2. **Dynamic NFT**: ERC-721 that reads live streak data
   - `tokenURI()` generates metadata on-the-fly
   - SVG updates based on current streak
   - Visual evolution (🔥 → 🔥🔥 → 💎🔥 at milestones)

### Data Flow
1. User posts ship → creates EAS attestation
2. Also calls `streakTracker.recordShip(fid)`
3. NFT dynamically reads from `streakTracker`
4. Frontend queries EAS GraphQL for feed

## Discovery Strategy

### The Curation Problem
High friction = quality but invisibility. Solution: **Be an editor, not a firehose**

### Distribution Tactics
1. **Weekly Digest**: Curate top 10-20 ships, post as thread in `/changelog` channel
2. **Ship of the Day**: Daily highlight of exceptional work
3. **Leaderboard Frame**: Interactive Farcaster Frame showing top streaks
4. **User-Initiated Sharing**: Prompt users to share their own ships via `composeCast()`
5. **Milestone Celebrations**: Personal shoutouts for 100-day, 365-day streaks

### What NOT To Do
- ❌ Bot posting every ship (algo death)
- ❌ Spam feeds (no one cares)
- ✅ Manual curation (high signal)
- ✅ Human-posted highlights (algo weight)

## Monetization & Incentives

### Why NO Token
- Tokens attract mercenaries, not builders
- Extrinsic motivation kills intrinsic motivation
- "I ship because I want tokens" ≠ staying power
- Price dumps = users leave

### Real Incentives (Intrinsic Motivation)
1. **Status & Recognition**: Public proof of consistency, featured in digests
2. **Accountability**: Streak addiction (Duolingo effect)
3. **Portfolio Effect**: Shareable proof of work (`changelog.heyztb.eth.limo/@alice`)
4. **Community**: See what other builders ship, friendly competition
5. **Identity**: "I have a 200-day shipping streak" becomes a flex

### Cold Start Strategy
1. Launch invite-only to 10-20 respected builders
2. Use it yourself for 30 days, post weekly updates
3. Feature exceptional ships publicly
4. Make NFT something people want to flex
5. Let scarcity create demand

### Optional Paid Features (Later)
- **Free**: Log ships, track streak, mint NFT
- **Pro** ($5/mo): Analytics, exports, custom subdomain
- **Team** ($50/mo): Private team changelogs, integrations

## Why This Works

### Composability
- EAS attestations are portable reputation
- Other apps can read your ships
- Data isn't siloed in custom contract
- "Proof of shipping" becomes standard

### Truly Decentralized
- Frontend on IPFS (permanent hosting)
- Data on-chain via EAS (uncensorable)
- No backend required (works forever)
- Users own their data completely

### Focus on Real Builders
- Gas costs + Neynar score = quality filter
- Streak mechanics = consistency filter
- No token = motivation filter
- Result: Actual builders, not farmers

## Key Insight
**Make "I have a 365-day shipping streak" something people brag about.** When builders see others with long streaks and think "I want that," you've won. The product becomes part of their identity.

--

## Deployed Schemas (Base Sepolia)

**Project Schema UID:** `0x7ac71a5f2f9e8fa90bc9e8fce4f22640828d5a33d9ac6415030204d8b6acd7d6`
- Link: https://base-sepolia.easscan.org/schema/view/0x7ac71a5f2f9e8fa90bc9e8fce4f22640828d5a33d9ac6415030204d8b6acd7d6
- Schema: `string name,string description,string website,address creator,uint256 createdAt`
- Revocable: false
- Resolver: none

**Ship Schema UID:** (to be registered after ShipResolver deployment)
- Schema: `string text,string[] links,uint256 timestamp,uint256 fid`
- Revocable: false
- Resolver: ShipResolver address
- Note: Uses `refUID` to reference Project attestations
