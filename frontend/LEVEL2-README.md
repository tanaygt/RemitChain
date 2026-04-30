# Level 2 - Yellow Belt Submission

## Overview

RemitChain Level 2 builds on the White Belt payment dApp and moves the project into Soroban. The product vision is a tracked remittance system where every payment is recorded on-chain in a Soroban registry:

- multi-wallet integration
- first deployed Soroban contract
- frontend contract calls
- contract reads and real-time statistics
- real-time event polling
- visible transaction status

## What This Branch Implements

- `StellarWalletsKit` wallet modal and multi-wallet support (Freighter, xBull, Albedo, etc.)
- Stellar testnet balance display in the dashboard
- Deployed Soroban Remittance Registry contract on testnet
- Frontend `create_remittance` contract invocation
- Frontend reads for:
  - Total remittance count
  - Pending / Completed / Refunded stats
  - Total escrowed amount
  - Recent activity feed
- Event feed polling from Soroban RPC (optimized for range history)
- Visible pending / success / failure states in the UI
- Explicit error handling for:
  - Wallet not found / unavailable
  - User rejected signature
  - Insufficient balance
  - BigInt serialization in JSON
  - RPC ledger range errors

## Requirement Mapping

### 1. 3 error types handled

Handled explicitly in the frontend and contract:
- Wallet not found / unavailable (StellarWalletsKit modal)
- User rejected request (Caught in `submitContractRemittance`)
- Insufficient balance (Caught in contract logic and Horizon submission)
- **Bonus**: Handled `BigInt` serialization and `startLedger` range errors for robust polling.

### 2. Contract deployed on testnet

- Contract address:
  - `CCLUDU2DFAJ7H3UCHHCMPVN2ASRNKP3V3UWIMWC5MEUGTVNJ2IQ3EEPS`

### 3. Contract called from the frontend

Implemented in the dashboard:
- `create_remittance` (writes to the registry)
- `get_stats` (reads summary stats)
- Event polling (reads activity history)

### 4. Transaction status visible

The dashboard shows:
- **Pending** while waiting for wallet signature or RPC confirmation.
- **Success** with transaction hash link after finalization.
- **Failure** banner with mapped error messages if any step fails.

### 5. Minimum 2+ meaningful commits

The project has been evolved through several iterations including repository consolidation and robust error handling fixes.

## Contract Artifacts

- **Initialization transaction**:
  - [8b64fa09...cbed26c67](https://stellar.expert/explorer/testnet/tx/8b64fa099020c5c86bbb65a16815d4c063153bb9437ca517443eae0cbed26c67)
- **Verified contract call transaction**:
  - [fa3e568c...2830278b](https://stellar.expert/explorer/testnet/tx/b925b292fa12de239619b1dfdd7a40d4de218ae1de586310dc9adcdc2830278b)

## Screenshots

### Wallet options available
Using `StellarWalletsKit`, RemitChain now allows users to connect with Freighter, xBull, Albedo, and other supported Stellar wallets.

![Level 2 Multi-wallet Popup](./public/screenshots/walletkit.png)

### Deployed contract dashboard
The dashboard provides a real-time view of the remittance registry, showing stats, activity, and successful transaction feedback.

![Level 2 Dashboard](./public/screenshots/dashboard%20contract%20succesfull%20call.png)

### Contract call on Stellar Expert
Every remittance creates an on-chain event and state entry, which can be verified on the Stellar Expert explorer.

![Level 2 Contract Call](./public/screenshots/contract%20call%20explorer.png)

## Local Setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Contract Source

- **Rust contract**:
  - [../contracts/remit_registry/src/lib.rs](../contracts/remit_registry/src/lib.rs)
- **Custom Errors**:
  - Uses `#[contracterror]` for precise error reporting (AmountNotPositive, etc.)

---

*Built on Stellar and Soroban testnet · Rise In Challenge · April 2026*
