export type TxStage = "idle" | "pending" | "success" | "error";

export type TxState = {
  stage: TxStage;
  title: string;
  detail?: string;
  hash?: string;
};

export type WalletConnection = {
  id: string;
  name: string;
  address: string;
};

export type BalanceState = {
  balance: string;
  active: boolean;
};

export type AssetOption = {
  id: string;
  code: string;
  issuer?: string;
  assetType: "native" | "credit_alphanum4" | "credit_alphanum12";
  balance: string;
};

export type PaymentRecipient = {
  id: string;
  destination: string;
  amount: string;
};

export type ContractActivity = {
  id: string;
  action: string;
  ledger: number;
  timestamp: string;
  detail: string;
};

export type ContractStats = {
  totalCount: number;
  pendingCount: number;
  completedCount: number;
  refundedCount: number;
  escrowedAmount: string;
};
