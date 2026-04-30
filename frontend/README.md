# RemitChain ⚡

[![RemitChain CI](https://github.com/tanaygt/RemitChain/actions/workflows/ci.yml/badge.svg)](https://github.com/tanaygt/RemitChain/actions/workflows/ci.yml)
[![Stellar Testnet](https://img.shields.io/badge/Stellar-Testnet-63b3ed?style=flat-square)](https://stellar.expert/explorer/testnet)
[![Soroban](https://img.shields.io/badge/Soroban-Deployed-4fd1c5?style=flat-square)](https://developers.stellar.org/docs/build/smart-contracts/overview)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square)](https://remitchain.vercel.app)

> **Stellar + Soroban dApp for modern, tracked remittances.**
> Connect a wallet, fund an escrow, and track contract-backed remittance records with real-time event synchronization.

**Live App** → [https://remitchain.vercel.app](https://remitchain.vercel.app)
**Demo Video** → [https://www.loom.com/share/af0d67a7005d4f95abc7edc756c56e0e](https://www.loom.com/share/af0d67a7005d4f95abc7edc756c56e0e)
**GitHub** → [https://github.com/tanaygt/RemitChain](https://github.com/tanaygt/RemitChain)

---

## Table of Contents

- [What is RemitChain?](#what-is-remitchain)
- [Level 1 — White Belt](#level-1--white-belt)
- [Level 2 — Yellow Belt](#level-2--yellow-belt)
- [Level 3 — Orange Belt](#level-3--orange-belt)
- [Level 4 — Green Belt](#level-4--green-belt)
- [Tech Stack](#tech-stack)
- [Local Setup](#local-setup)
- [Contract Development](#contract-development)

---

## What is RemitChain?

Traditional blockchain payments are one-shot transfers. That creates friction for users who need small repeated payments instead of lump sums. **RemitChain** is a belt-by-belt Stellar dApp that evolves from a basic XLM payment tool into a full Soroban USDC escrow platform with inter-contract fee accounting, real-time event sync, and production CI/CD.

---

## Level 1 — White Belt

**The basics: wallet connect, XLM balance, testnet payment.**

Covers the core Stellar fundamentals — Freighter wallet connect/disconnect, XLM balance from Horizon, testnet payment flow, and success/failure feedback with transaction hash verification.

**What was built:**
- Freighter wallet connect and disconnect
- Stellar Testnet enforcement
- XLM balance display from Horizon
- Testnet XLM payment with pending → success → failure states
- Transaction hash with Stellar Expert verification link

**Screenshots:**

| Balance + In-App Result | Transaction on Stellar Expert |
|---|---|
| ![Balance](./public/screenshots/wallet%20and%20balance.png) | ![Explorer](./public/screenshots/transaction.png) |

---

## Level 2 — Yellow Belt

**Multi-wallet + first Soroban contract deployed and called.**

Moved from Freighter-only to StellarWalletsKit, deployed a real remittance registry contract on Soroban testnet, and wired up frontend contract invocations with live event polling.

**What was built:**
- StellarWalletsKit wallet modal (Freighter, xBull, Albedo, etc.)
- Deployed Soroban Remittance Registry contract
- `create_remittance` from the frontend
- Contract reads: total count, pending/completed stats, recent activities
- Event feed polling from Soroban RPC
- Explicit error handling: wallet unavailable, user rejected, insufficient balance

**Deployed contract:**

```
CCLUDU2DFAJ7H3UCHHCMPVN2ASRNKP3V3UWIMWC5MEUGTVNJ2IQ3EEPS
```

**On-chain proof:**

| Event | Transaction |
|---|---|
| Initialization | [8b64fa09...cbed26c67](https://stellar.expert/explorer/testnet/tx/8b64fa099020c5c86bbb65a16815d4c063153bb9437ca517443eae0cbed26c67) |
| Contract call | [fa3e568c...2830278b](https://stellar.expert/explorer/testnet/tx/b925b292fa12de239619b1dfdd7a40d4de218ae1de586310dc9adcdc2830278b) |

**Screenshots:**

| Multi-wallet Popup | Contract Dashboard | Contract Call (Expert) |
|---|---|---|
| ![Multiwallet](./public/screenshots/walletkit.png) | ![Dashboard](./public/screenshots/dashboard%20contract%20succesfull%20call.png) | ![Contract Call](./public/screenshots/contract%20call%20explorer.png) |

---

## Level 3 — Orange Belt

**Caching, loading states, automated tests, and demo-ready quality.**

Upgraded RemitChain into a polished mini-dApp with dashboard state caching, progress indicators during wallet restore and live sync, and automated test coverage.

**What was built:**
- `localStorage` cache for statistics and recent Soroban events
- Loading states and "Syncing..." pulse indicators for background refreshes
- 6 automated tests — utility logic, cache parsing, XLM/stroops conversion
- Complete README and submission ready structure

**Test command:**

```bash
npm test
```

**On-chain proof:**

| Event | Transaction |
|---|---|
| Registry Interaction | [fa3e568c...2830278b](https://stellar.expert/explorer/testnet/tx/b925b292fa12de239619b1dfdd7a40d4de218ae1de586310dc9adcdc2830278b) |

**Screenshots:**

| Test Output (6 passing) | Successful Call Feedback |
|---|---|
| ![Tests](./public/screenshots/test.png) | ![Dashboard](./public/screenshots/contract%20call%20level3.png) |

---

## Level 4 — Green Belt

**Real USDC escrow, inter-contract fee vault, CI/CD, mobile responsive.**

RemitChain becomes a production-ready dApp. USDC is escrowed in a Soroban contract, protocol fees are routed to a separate FeeVault contract via an inter-contract call, and recipients withdraw earned balance on demand.

**Live App** → [https://remitchain.vercel.app](https://remitchain.vercel.app)

**What was built:**
- Real testnet USDC funded remittances via Stellar Asset Contract (SAC)
- `RemitRegistry` contract — create, complete, refund
- `FeeVault` contract — protocol fee accounting via inter-contract call
- Dashboard: XLM + USDC balances, trustline awareness, funded remittance forms
- Linked registry + fee event feed
- GitHub Actions CI (frontend lint, tests, build + Soroban contract build)
- Mobile-responsive dashboard layout

**Deployed contracts:**

| Contract | Address |
|---|---|
| RemitRegistry | `CCLUDU2DFAJ7H3UCHHCMPVN2ASRNKP3V3UWIMWC5MEUGTVNJ2IQ3EEPS` |
| FeeVault | `CBRAYXE2MCTP5MBDPT3CQNFARYVEYWQLMALVTWEYFUS6LBCQTAPIEK2T` |
| Testnet USDC SAC | `CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWFEIE3USCIHMXQDAMA` |

**On-chain proof:**

| Event | Transaction |
|---|---|
| FeeVault deployment | [b598b47e...c2c50](https://stellar.expert/explorer/testnet/tx/b598b47e6a26a0a6fe73410fe1de6bf0d616bb4b2d71006bd1547590bf8a2c50) |
| RemitRegistry deployment | [ffb63414...21a14](https://stellar.expert/explorer/testnet/tx/ffb634147358bdd45b6717947299b3812fc7a1efb14541c585c9bf4de4a21a14) |
| Funded remittance + inter-contract fee | [15075257...58890](https://stellar.expert/explorer/testnet/tx/1507525771707cd038fd6e88c72730d22e2e31324512328a069d3aa4b4258890) |

**Screenshots:**

| Mobile Responsive | Contract Interactions (RPC Events) |
|---|---|
| ![Mobile](./public/screenshots/mobileview.png) | ![Create Remittance](./public/screenshots/level4%20transctaion.png) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, TypeScript, Vanilla CSS |
| Wallet | `@creit.tech/stellar-wallets-kit` (Freighter, xBull, Albedo, etc.) |
| Stellar SDK | `@stellar/stellar-sdk`, `@stellar/freighter-api` |
| Smart contracts | Rust, Soroban SDK 26 |
| RPC | Soroban testnet RPC (`soroban-testnet.stellar.org`) |
| Horizon | Stellar Testnet Horizon |
| Testing | Vitest (frontend) |
| CI/CD | GitHub Actions |
| Deployment | Vercel |

---

## Local Setup

```bash
git clone https://github.com/tanaygt/RemitChain
cd RemitChain/frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Contract Development

**Build contracts:**

```bash
stellar contract build
```

**Run frontend tests:**

```bash
cd frontend
npm test
```

**Contract source files:**

| Contract | Source |
|---|---|
| Remittance Registry | `contracts/remit_registry/src/lib.rs` |
| FeeVault | `contracts/fee_vault/src/lib.rs` |

---

*Built on Stellar and Soroban testnet · Rise In Challenge · April 2026*
