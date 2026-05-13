# 🎯 Plinko Drop — On-Chain on Voi Network

Drop the ball. Let the chain decide.

Plinko Drop is a fully on-chain Plinko game built on [Voi Network](https://voi.network). Every outcome is derived from block entropy and the transaction ID — no server, no RNG oracle, no house manipulation. The smart contract handles the randomness, the payout, and the house fee in a single atomic transaction group.

---

## How It Works

1. Connect your Voi wallet (Kibisis, Lute, or Voi Wallet)
2. Choose your board size (8, 12, or 16 rows) and risk level (Low / Medium / High)
3. Set your bet (0.1 – 100 VOI) and drop
4. The contract derives your bucket from `sha256(txID + round)` and pays out immediately

No waiting. No off-chain resolution. The result is in the same block as the bet.

---

## Contract

| | |
|---|---|
| **App ID** | `49028406` |
| **Network** | Voi Mainnet |
| **House fee** | 3% |
| **Min bet** | 0.1 VOI |
| **Max bet** | 100 VOI |

### Multiplier Tables

Buckets are mirrored — edges pay big, center pays small.

| Risk | Edge | → | Center |
|------|------|---|--------|
| Low | 5.6x | 2.1x → 1.1x → 1.0x → 0.7x → 0.5x | 0.4x |
| Medium | 13x | 3x → 1.3x → 0.7x → 0.4x → 0.3x | 0.2x |
| High | 29x | 4x → 1.5x → 0.3x → 0.2x → 0.1x | 0.05x |

---

## Repo Structure

```
contracts/
  contract.algo.ts      # PuyaTs smart contract source
  plinko_approval.teal  # Compiled approval program
  plinko_clear.teal     # Compiled clear state program
  deploy_plinko.mjs     # Deployment script (Node.js / algosdk v3)

src/
  components/           # React UI components
  services/
    voiBlockchain.ts    # Contract interaction layer (algosdk)
  config/
    gameConfig.ts       # Payout tables, board config, bet options
  hooks/                # Game state, wallet, celebration hooks
  pages/                # App routes
```

---

## Running Locally

```bash
npm install
npm run dev
# → http://localhost:5173
```

## Deploying the Contract

```bash
cd contracts
cp .env.example .env   # add your MNEMONIC
node deploy_plinko.mjs
```

> Requires Node.js 18+ and a funded Voi mainnet wallet.

---

## Tech Stack

- **Contract**: [Algorand TypeScript (PuyaTs)](https://github.com/algorandfoundation/puya-ts) → TEAL
- **Frontend**: React + Vite + Tailwind + shadcn/ui
- **Wallet**: [@txnlab/use-wallet-react](https://github.com/TxnLab/use-wallet)
- **Chain**: [Voi Network](https://voi.network) (AVM-compatible, low fees)

---

Built on Voi. Provably fair.
