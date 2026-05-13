# Plinko Drop — On-Chain Game on Voi Network

A provably fair Plinko game built on [Voi Network](https://voi.network).  
The outcome is determined entirely on-chain — no server, no house manipulation.

## Stack

- **Smart Contract**: Algorand TypeScript (PuyaTs) → compiled TEAL, deployed on Voi mainnet
- **Frontend**: React + Vite + shadcn/ui + Tailwind
- **Wallet**: [@txnlab/use-wallet-react](https://github.com/TxnLab/use-wallet) (Kibisis, Lute, Voi Wallet)

## Contract

| | |
|---|---|
| App ID | `49028406` |
| Network | Voi Mainnet |
| Source | `contract.algo.ts` (PuyaTs) |
| Compiled | `contracts/plinko_approval.teal` |

## Development

```bash
npm install
npm run dev
```

## Deploy Contract

```bash
cd contracts
# Set MNEMONIC in .env
node deploy_plinko.mjs
```

## Game

- Choose board size: 8, 12, or 16 rows
- Choose risk level: Low / Medium / High
- Bet between 0.1 and 100 VOI
- Ball path is seeded from block entropy — fully on-chain
