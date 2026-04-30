# RemitChain

[![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-63b3ed?style=flat-square)](https://stellar.expert/explorer/testnet)
[![Rise In White Belt](https://img.shields.io/badge/Rise%20In-White%20Belt-68d391?style=flat-square)](./LEVEL1-README.md)
[![Rise In Yellow Belt](https://img.shields.io/badge/Rise%20In-Yellow%20Belt-f6ad55?style=flat-square)](./LEVEL2-README.md)

RemitChain is a Stellar dApp built belt by belt for the Rise In Stellar challenge. The project started as a clean White Belt XLM payment app, and it now includes a live Yellow Belt payment tracker with multi-wallet support, a deployed Soroban contract, and real-time activity tracking.

## Problem

Many first-time Stellar apps stop at wallet connection and a single transfer. That is useful, but it does not show how a real mini-dApp starts evolving into a contract-backed product with wallet choice, tracked state, and live updates.

## Solution Direction

RemitChain is being built in stages:

- Level 1 establishes wallet, balance, and XLM transfer fundamentals on Stellar Testnet
- Level 2 adds multi-wallet support, a Soroban contract, frontend contract calls, and real-time activity sync
- Future levels will be documented when we start that work

## Level 1 - White Belt

Level 1 is complete and covers the required payment fundamentals:

- Freighter wallet connect and disconnect
- Stellar Testnet usage
- XLM balance display from Horizon
- testnet XLM transaction flow
- success and failure feedback
- transaction hash with explorer verification

Level 1 submission details:

- [LEVEL1-README.md](./LEVEL1-README.md)

### Level 1 Live App

- [https://remitchain.vercel.app/](https://remitchain.vercel.app/)

### Level 1 Screenshots

#### Wallet connected and balance displayed

This screenshot shows the connected Freighter wallet and the visible XLM balance in the dashboard.

![Wallet connected and balance displayed](<public/wallet and balance.png>)

#### Successful transaction in dashboard

This screenshot shows the successful transaction confirmation in the dashboard.

![Successful transaction in dashboard](<public/confrim transcation.png>)

#### Transaction on Stellar Expert

This screenshot shows the submitted transaction on Stellar Expert testnet for external verification.

![Transaction on Stellar Expert](<public/transaction.png>)

Transaction link:

[https://stellar.expert/explorer/testnet/tx/d6b22c94a1fb372ab0d0ea5db88dbbff5b308ce1bffa815e897865a7a4f131a5](https://stellar.expert/explorer/testnet/tx/d6b22c94a1fb372ab0d0ea5db88dbbff5b308ce1bffa815e897865a7a4f131a5)

## Level 2 - Yellow Belt

Level 2 is now implemented around a payment tracker flow:

- multi-wallet support with `StellarWalletsKit`
- 3 required error types handled
- Soroban contract deployed on testnet
- contract called from the frontend
- contract reads and activity feed in the dashboard
- visible transaction status: pending, success, fail

### Level 2 Live App

- [https://remitchain.vercel.app/](https://remitchain.vercel.app/)

### Level 2 On-chain Proof

- Contract address:
  - `CB7XG5EK2SA52WMGFCUOPJFHWVH6KPYHM3MJFE4ELEDCDU44OW4PEBNU`
- Contract upload transaction:
  - [be7521faf50d2487b2abb9dfd08dfffa3f830fddabf19b33d66097190714de29](https://stellar.expert/explorer/testnet/tx/be7521faf50d2487b2abb9dfd08dfffa3f830fddabf19b33d66097190714de29)
- Contract deploy transaction:
  - [a5df5b0cbd1fb8ded457eb1c99578261f98959cb57009a19572f56b91c490051](https://stellar.expert/explorer/testnet/tx/a5df5b0cbd1fb8ded457eb1c99578261f98959cb57009a19572f56b91c490051)
- Contract init transaction:
  - [015ad4e62b14a466463ab4273326c145c18822963022fce4a8fea779041fcde3](https://stellar.expert/explorer/testnet/tx/015ad4e62b14a466463ab4273326c145c18822963022fce4a8fea779041fcde3)
- Contract call transaction:
  - [15ae7916a46f83115e25664f2a1dba43ee338ee186215574fd0460c92ff25f23](https://stellar.expert/explorer/testnet/tx/15ae7916a46f83115e25664f2a1dba43ee338ee186215574fd0460c92ff25f23)

### Level 2 Read Path Check

- `get_stats` simulation result after live call:
  - `{"completed_count":0,"escrowed_amount":"10000000","pending_count":1,"refunded_count":0,"total_count":1}`

Level 2 working notes:

- [LEVEL2-README.md](./LEVEL2-README.md)

## Tech Stack

- Next.js App Router
- TypeScript
- `@stellar/freighter-api`
- `@creit.tech/stellar-wallets-kit`
- `@stellar/stellar-sdk`
- Soroban smart contracts

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Repository

- GitHub: [https://github.com/tanaygt/RemitChain](https://github.com/tanaygt/RemitChain)
