import {
  Asset,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

import { HORIZON_URL, NETWORK_PASSPHRASE } from "./config";
import { mapWalletErrorMessage } from "./remit-utils";
import { signWithActiveWallet } from "./wallet";
import type { AssetOption, BalanceState, PaymentRecipient, TxState } from "./types";

const horizonServer = new Horizon.Server(HORIZON_URL);

type StellarError = {
  message?: string;
  response?: {
    status?: number;
    data?: {
      extras?: {
        result_codes?: {
          transaction?: string;
          operations?: string[];
        };
      };
    };
  };
};

type BalanceLine = {
  asset_type: string;
  balance: string;
  asset_code?: string;
  asset_issuer?: string;
};

function isIssuedAssetBalance(
  balance: BalanceLine,
): balance is BalanceLine & {
  asset_type: "credit_alphanum4" | "credit_alphanum12";
  asset_code: string;
  asset_issuer: string;
} {
  return (
    (balance.asset_type === "credit_alphanum4" ||
      balance.asset_type === "credit_alphanum12") &&
    typeof balance.asset_code === "string" &&
    typeof balance.asset_issuer === "string"
  );
}

function toAssetOption(balance: BalanceLine): AssetOption | null {
  if (balance.asset_type === "native") {
    return {
      id: "native",
      code: "XLM",
      assetType: "native",
      balance: balance.balance,
    };
  }

  if (isIssuedAssetBalance(balance)) {
    return {
      id: `${balance.asset_code}:${balance.asset_issuer}`,
      code: balance.asset_code,
      issuer: balance.asset_issuer,
      assetType: balance.asset_type,
      balance: balance.balance,
    };
  }

  return null;
}

function buildAsset(asset: AssetOption) {
  if (asset.assetType === "native") {
    return Asset.native();
  }

  if (!asset.issuer) {
    throw new Error(`Asset issuer missing for ${asset.code}.`);
  }

  return new Asset(asset.code, asset.issuer);
}

async function verifyRecipientTrustline(destination: string, asset: AssetOption) {
  if (asset.assetType === "native") {
    return;
  }

  const account = await horizonServer.loadAccount(destination);
  const hasTrustline = account.balances.some((balance) => {
    if (
      balance.asset_type !== "credit_alphanum4" &&
      balance.asset_type !== "credit_alphanum12"
    ) {
      return false;
    }

    return (
      balance.asset_type === asset.assetType &&
      balance.asset_code === asset.code &&
      balance.asset_issuer === asset.issuer
    );
  });

  if (!hasTrustline) {
    throw new Error(
      `Recipient ${destination.slice(0, 6)}... does not trust ${asset.code}.`,
    );
  }
}

function mapOperationError(error: StellarError) {
  const operationCode = error.response?.data?.extras?.result_codes?.operations?.[0];

  switch (operationCode) {
    case "op_underfunded":
      return "The wallet balance is too low for this transaction.";
    case "op_no_trust":
      return "The recipient is missing the trustline for this asset.";
    case "op_no_destination":
      return "One recipient account does not exist on Stellar.";
    case "op_line_full":
      return "A recipient trustline is already at its limit.";
    default:
      return mapWalletErrorMessage(error.message || "The payment transaction failed.");
  }
}

export async function fetchBalance(address: string): Promise<BalanceState> {
  try {
    const account = await horizonServer.loadAccount(address);
    const nativeBalance = account.balances.find((item) => item.asset_type === "native");

    return {
      balance: nativeBalance?.balance || "0",
      active: true,
    };
  } catch (error) {
    const stellarError = error as StellarError;
    if (stellarError.response?.status === 404) {
      return {
        balance: "0",
        active: false,
      };
    }

    return {
      balance: "0",
      active: true,
    };
  }
}

export async function fetchAccountAssets(address: string): Promise<AssetOption[]> {
  const account = await horizonServer.loadAccount(address);
  return account.balances
    .map((balance) => toAssetOption(balance as BalanceLine))
    .filter((asset): asset is AssetOption => Boolean(asset));
}

export async function sendAssetPayments(params: {
  address: string;
  asset: AssetOption;
  recipients: PaymentRecipient[];
  memo?: string;
}): Promise<TxState> {
  try {
    const cleanedRecipients = params.recipients.filter(
      (recipient) => recipient.destination.trim() && Number(recipient.amount) > 0,
    );

    if (cleanedRecipients.length === 0) {
      throw new Error("Add at least one valid recipient and amount.");
    }

    if (cleanedRecipients.length > 100) {
      throw new Error("Stellar transactions can include up to 100 operations.");
    }

    const account = await horizonServer.loadAccount(params.address);
    const networkPassphrase = NETWORK_PASSPHRASE || Networks.TESTNET;
    const transactionBuilder = new TransactionBuilder(account, {
      fee: String(await horizonServer.fetchBaseFee()),
      networkPassphrase,
    });
    const asset = buildAsset(params.asset);

    for (const recipient of cleanedRecipients) {
      if (!recipient.destination.startsWith("G") || recipient.destination.length < 56) {
        throw new Error(`Invalid Stellar address: ${recipient.destination || "(empty)"}.`);
      }

      await verifyRecipientTrustline(recipient.destination, params.asset);

      transactionBuilder.addOperation(
        Operation.payment({
          destination: recipient.destination,
          asset,
          amount: String(recipient.amount),
        }),
      );
    }

    if (params.memo && params.memo.trim()) {
      transactionBuilder.addMemo(Memo.text(params.memo.trim().slice(0, 28)));
    }

    const builtTransaction = transactionBuilder.setTimeout(60).build();
    const signedXdr = await signWithActiveWallet(builtTransaction.toXDR(), params.address);
    // Re-parse through our SDK so submitTransaction's instanceof check passes
    const signedTransaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
    const result = await horizonServer.submitTransaction(signedTransaction);


    return {
      stage: "success",
      title:
        cleanedRecipients.length === 1
          ? `${params.asset.code} payment confirmed`
          : `${params.asset.code} batch payment confirmed`,
      detail: `Submitted ${cleanedRecipients.length} payment operation${cleanedRecipients.length > 1 ? "s" : ""} on Stellar Testnet.`,
      hash: result.hash,
    };
  } catch (error) {
    console.error("Transaction Error Detail:", error);
    const stellarError = error as StellarError;

    return {
      stage: "error",
      title: `${params.asset.code} payment failed`,
      detail: mapOperationError(stellarError),
    };
  }
}

export async function sendDirectXlm(params: {
  address: string;
  recipient: string;
  amount: string;
  memo?: string;
}): Promise<TxState> {
  return sendAssetPayments({
    address: params.address,
    asset: {
      id: "native",
      code: "XLM",
      assetType: "native",
      balance: "0",
    },
    recipients: [
      {
        id: "single",
        destination: params.recipient,
        amount: params.amount,
      },
    ],
    memo: params.memo,
  });
}
