# Level 1 - White Belt Submission

## Project

**RemitChain** is a beginner-friendly Stellar dApp that lets a user connect a Freighter wallet, view their XLM balance on Stellar Testnet, and send an XLM payment with clear transaction feedback.

## Requirement mapping

### 1. Wallet Setup

- Freighter wallet is the supported wallet for Level 1
- The app uses **Stellar Testnet**

### 2. Wallet Connection

- Connect wallet action is available on the landing page
- Disconnect action is available after connection

### 3. Balance Handling

- XLM balance is fetched from `https://horizon-testnet.stellar.org`
- Balance is displayed prominently on the dashboard

### 4. Transaction Flow

- User enters a Stellar recipient address and XLM amount
- User signs the payment in Freighter
- App displays pending, success, or failure feedback
- Successful payments expose a transaction hash link for Stellar Expert testnet verification

### 5. Development Standards

- Structured landing page and dashboard UI
- Wallet integration with `@stellar/freighter-api`
- Horizon balance fetch with `@stellar/stellar-sdk`
- Inline validation for address and amount inputs
- Error handling for wallet rejection, missing wallet, and failed submission

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Screenshots

### Wallet Connected State And Balance Displayed

This screenshot shows the connected Freighter wallet and the visible XLM balance in the dashboard.

![Wallet connected and balance displayed](<public/wallet and balance.png>)

### Successful Testnet Transaction

This screenshot shows the successful transaction confirmation in the dashboard.

![Successful transaction in dashboard](<public/confrim transcation.png>)

### Transaction On Stellar Expert

This screenshot shows the submitted testnet transaction on Stellar Expert for verification.

![Transaction on Stellar Expert](<public/transaction.png>)

Transaction link:

[https://stellar.expert/explorer/testnet/tx/d6b22c94a1fb372ab0d0ea5db88dbbff5b308ce1bffa815e897865a7a4f131a5](https://stellar.expert/explorer/testnet/tx/d6b22c94a1fb372ab0d0ea5db88dbbff5b308ce1bffa815e897865a7a4f131a5)

## Submission link

- Repository: Add your public GitHub repository link here
