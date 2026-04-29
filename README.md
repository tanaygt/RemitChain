# RemitChain

[![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-63b3ed?style=flat-square)](https://stellar.expert/explorer/testnet)
[![Rise In White Belt](https://img.shields.io/badge/Rise%20In-White%20Belt-68d391?style=flat-square)](./LEVEL1-README.md)

RemitChain is a Stellar testnet payment dApp built for the Rise In White Belt challenge. The project focuses on the Level 1 fundamentals: wallet connection, XLM balance display, and direct XLM payments with visible transaction feedback.

## Problem

People building their first Stellar app need a simple, working example that covers the basics cleanly:

- connecting a wallet
- reading the wallet balance
- sending XLM on Stellar Testnet
- showing clear transaction success or failure

## Solution

RemitChain solves that with a compact White Belt payment flow:

- Freighter wallet connect and disconnect
- Stellar Testnet payment flow
- live XLM balance from Horizon
- direct XLM transfer form
- in-app transaction feedback
- transaction hash with Stellar Expert verification

## Level 1 - White Belt

Level 1 covers the required payment fundamentals:

- Freighter wallet connect and disconnect
- Stellar Testnet usage
- XLM balance display from Horizon
- testnet XLM transaction flow
- success and failure feedback
- transaction hash with explorer verification

Level 1 submission details:

- [LEVEL1-README.md](./LEVEL1-README.md)

## Level 1 Screenshots

### Wallet connected and balance displayed

This screenshot shows the connected Freighter wallet and the visible XLM balance in the dashboard.

![Wallet connected and balance displayed](<public/wallet and balance.png>)

### Successful transaction in dashboard

This screenshot shows the successful transaction confirmation in the dashboard.

![Successful transaction in dashboard](<public/confrim transcation.png>)

### Transaction on Stellar Expert

This screenshot shows the submitted transaction on Stellar Expert testnet for external verification.

![Transaction on Stellar Expert](<public/transaction.png>)

Transaction link:

[https://stellar.expert/explorer/testnet/tx/d6b22c94a1fb372ab0d0ea5db88dbbff5b308ce1bffa815e897865a7a4f131a5](https://stellar.expert/explorer/testnet/tx/d6b22c94a1fb372ab0d0ea5db88dbbff5b308ce1bffa815e897865a7a4f131a5)

## Tech Stack

- Next.js App Router
- TypeScript
- `@stellar/freighter-api`
- `@stellar/stellar-sdk`

## Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Repository

- GitHub: [https://github.com/tanaygt/RemitChain](https://github.com/tanaygt/RemitChain)
