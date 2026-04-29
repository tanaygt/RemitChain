import type { ContractActivity, ContractStats, TxStage, TxState } from "./types";

export function buildTxState(
  stage: TxStage,
  title: string,
  detail?: string,
  hash?: string,
): TxState {
  return { stage, title, detail, hash };
}

export function formatUsdEstimate(
  xlmAmount: number,
  price: number,
  rate: number,
  currency: string,
) {
  const usdAmount = xlmAmount * price;
  const localAmount = usdAmount * rate;

  return {
    usdAmount,
    localAmount,
    text: `About $${usdAmount.toFixed(2)} USDC -> ${Math.round(localAmount).toLocaleString()} ${currency} after swap`,
  };
}

export function mapWalletErrorMessage(message: string) {
  const lowered = message.toLowerCase();

  if (lowered.includes("declined") || lowered.includes("rejected")) {
    return "The wallet request was rejected.";
  }

  if (lowered.includes("not found") || lowered.includes("install")) {
    return "No supported wallet was found in this browser.";
  }

  if (lowered.includes("underfunded") || lowered.includes("insufficient")) {
    return "The wallet balance is too low for this transaction.";
  }

  return message || "The wallet action failed.";
}

export function summarizeActivity(items: ContractActivity[]) {
  if (items.length === 0) {
    return "No contract events yet.";
  }

  const latest = items[0];
  return `${latest.action} recorded at ledger ${latest.ledger}.`;
}

export function emptyStats(): ContractStats {
  return {
    totalCount: 0,
    pendingCount: 0,
    completedCount: 0,
    refundedCount: 0,
    escrowedAmount: "0",
  };
}
