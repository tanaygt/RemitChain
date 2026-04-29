import { Networks } from "@stellar/stellar-sdk";

export const NETWORK_PASSPHRASE =
  process.env.NEXT_PUBLIC_NETWORK_PASSPHRASE || Networks.TESTNET;

export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL || "https://horizon-testnet.stellar.org";

export const SOROBAN_RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";

export const REMIT_CONTRACT_ID =
  process.env.NEXT_PUBLIC_REMIT_CONTRACT_ID || "";

export const CONTRACT_ENABLED = REMIT_CONTRACT_ID.length > 0;

export const DEFAULT_ACTIVITY_LIMIT = 12;
