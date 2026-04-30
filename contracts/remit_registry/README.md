# Remit Registry Contract

This Soroban contract is the RemitChain contract path for Yellow Belt through Green Belt.

## Contract responsibilities

- Create a remittance record
- Hold escrowed token funds in the contract address
- Complete a remittance by sending funds to the recipient
- Refund a remittance back to the sender
- Emit events on create, complete, and refund
- Expose read methods for recent remittances and summary stats

## Why this matters for the belts

- Level 2: contract deployment, frontend writes, frontend reads, event integration
- Level 3: end-to-end mini-dApp documentation and tests
- Level 4: inter-contract call through the token contract transfer flow

## Current status

The contract now builds and has been deployed on Stellar testnet.

- Contract address:
  - `CB7XG5EK2SA52WMGFCUOPJFHWVH6KPYHM3MJFE4ELEDCDU44OW4PEBNU`
- Deploy transaction:
  - [a5df5b0cbd1fb8ded457eb1c99578261f98959cb57009a19572f56b91c490051](https://stellar.expert/explorer/testnet/tx/a5df5b0cbd1fb8ded457eb1c99578261f98959cb57009a19572f56b91c490051)
- Live create transaction:
  - [15ae7916a46f83115e25664f2a1dba43ee338ee186215574fd0460c92ff25f23](https://stellar.expert/explorer/testnet/tx/15ae7916a46f83115e25664f2a1dba43ee338ee186215574fd0460c92ff25f23)

## Build command

```bash
cargo build -p remit_registry --target wasm32v1-none --release
```
