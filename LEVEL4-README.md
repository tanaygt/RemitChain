# Level 4 - Green Belt Submission

## Overview

RemitChain Level 4 represents the project's evolution into a production-grade decentralized application. This level focuses on advanced smart contract patterns, specifically **inter-contract communication**, combined with professional DevOps practices and mobile-first design.

## Key Features

### 1. Inter-Contract Communication
We have implemented a dual-contract architecture to separate core business logic from protocol accounting:
- **RemitRegistry Contract**: Handles user remittances and state.
- **FeeVault Contract**: A standalone contract that receives and tracks protocol fees.
- **The Call**: Every time a remittance is created via `RemitRegistry`, it automatically invokes the `FeeVault.deposit_fees()` method.

### 2. CI/CD Implementation
A full CI/CD pipeline has been established using **GitHub Actions** (`.github/workflows/ci.yml`).
- **Frontend Quality**: Automatically runs linting, unit tests (Vitest), and builds on every push.
- **Contract Verification**: Validates contract compilation and tests using the Soroban environment.

### 3. Mobile Responsive Design
The RemitChain Dashboard has been overhauled with a mobile-first approach:
- **Fluid Grids**: Uses a responsive grid system that stacks seamlessly on smaller screens.
- **Optimized Components**: Form inputs, action buttons, and activity cards are scaled for touch interaction.

### 4. Production Readiness
- **Event Synchronization**: Updated event listeners to track both registry and fee-vault events.
- **Error Tracking**: Enhanced mapping for inter-contract call failures and RPC range errors.

## Deployed Artifacts

| Contract | Address |
|---|---|
| **Remittance Registry** | `CCLUDU2DFAJ7H3UCHHCMPVN2ASRNKP3V3UWIMWC5MEUGTVNJ2IQ3EEPS` |
| **Fee Vault (Accounting)** | `CAQXP3J4...` (Inter-contract Target) |

## Requirement Mapping

- [x] **Inter-contract call working**: `RemitRegistry` -> `FeeVault` integration.
- [x] **CI/CD running**: GitHub Actions workflow active.
- [x] **Mobile responsive**: Optimized CSS for mobile/tablet.
- [x] **Minimum 8+ meaningful commits**: Full development history preserved.

## Screenshots

### Mobile Responsive Design
The dashboard adapted for mobile devices, showing stacked stats and the remittance form.

![Mobile View](./frontend/public/screenshots/mobile.png)

### CI/CD Pipeline
GitHub Actions status showing successful builds and tests.

![CI Status](https://github.com/tanaygt/RemitChain/actions/workflows/ci.yml/badge.svg)

---

## Local Setup

```bash
cd frontend
npm install
npm run dev
```

---

*Built on Stellar and Soroban testnet · Rise In Challenge · April 2026*
