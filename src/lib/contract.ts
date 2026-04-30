import {
  Asset,
  BASE_FEE,
  Contract,
  Networks,
  TransactionBuilder,
  nativeToScVal,
  scValToNative,
} from "@stellar/stellar-sdk";
import { Server as RpcServer } from "@stellar/stellar-sdk/rpc";

import { CONTRACT_ENABLED, DEFAULT_ACTIVITY_LIMIT, NETWORK_PASSPHRASE, REMIT_CONTRACT_ID, SOROBAN_RPC_URL } from "./config";
import { buildTxState, emptyStats, mapWalletErrorMessage } from "./remit-utils";
import { signWithActiveWallet } from "./wallet";
import type { ContractActivity, ContractStats, TxState } from "./types";

const rpcServer = new RpcServer(SOROBAN_RPC_URL);

function getContract() {
  if (!CONTRACT_ENABLED) {
    throw new Error("Remittance contract is not configured.");
  }

  return new Contract(REMIT_CONTRACT_ID);
}

function getNativeAssetContractId() {
  const passphrase = NETWORK_PASSPHRASE || Networks.TESTNET;
  return Asset.native().contractId(passphrase);
}

export async function submitContractRemittance(params: {
  address: string;
  recipient: string;
  amount: string;
  country: string;
  memo: string;
}): Promise<TxState> {
  try {
    const contract = getContract();
    const account = await rpcServer.getAccount(params.address);
    const stroops = BigInt(Math.round(Number(params.amount) * 10_000_000));

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call(
          "create_remittance",
          nativeToScVal(params.address, { type: "address" }),
          nativeToScVal(params.recipient, { type: "address" }),
          nativeToScVal(getNativeAssetContractId(), { type: "address" }),
          nativeToScVal(stroops),
          nativeToScVal(params.country, { type: "symbol" }),
          nativeToScVal(params.memo || "RemitChain payout"),
        ),
      )
      .setTimeout(60)
      .build();

    const prepared = await rpcServer.prepareTransaction(tx);
    const signedXdr = await signWithActiveWallet(prepared.toXDR(), params.address);
    const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
    const response = await rpcServer.sendTransaction(signedTx);
    const txResult = await rpcServer.pollTransaction(response.hash);

    if (txResult.status !== "SUCCESS") {
      return buildTxState(
        "error",
        "Contract remittance failed",
        `RPC status: ${txResult.status}`,
        response.hash,
      );
    }

    return buildTxState(
      "success",
      "Contract remittance confirmed",
      "The remittance record was written on Soroban Testnet.",
      response.hash,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contract remittance failed.";
    return buildTxState("error", "Contract remittance failed", mapWalletErrorMessage(message));
  }
}

export async function fetchContractActivity(limit = DEFAULT_ACTIVITY_LIMIT): Promise<ContractActivity[]> {
  if (!CONTRACT_ENABLED) {
    return [];
  }

  const response = await rpcServer.getEvents({
    filters: [
      {
        type: "contract",
        contractIds: [REMIT_CONTRACT_ID],
      },
    ],
    startLedger: 1,
    limit,
  });

  return response.events
    .slice()
    .reverse()
    .map((event) => {
      const action = String(scValToNative(event.topic[0] || nativeToScVal("unknown")));
      const value = scValToNative(event.value);

      return {
        id: event.id,
        action,
        ledger: event.ledger,
        timestamp: event.ledgerClosedAt,
        detail: typeof value === "object" ? JSON.stringify(value) : String(value),
      };
    })
    .reverse();
}

export async function fetchContractStats(): Promise<ContractStats> {
  if (!CONTRACT_ENABLED) {
    return emptyStats();
  }

  try {
    const contract = getContract();
    const account = await rpcServer.getAccount(
      "GBRPYHIL2CI3O2IYHXV4XQ7PZQ3J6L6I3L4TQJ5P3J4Y4H4K6A2JL4KQ",
    );

    const tx = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(contract.call("get_stats", nativeToScVal(20)))
      .setTimeout(30)
      .build();

    const simulation = await rpcServer.simulateTransaction(tx);
    if ("error" in simulation && simulation.error) {
      return emptyStats();
    }

    const value =
      "result" in simulation && simulation.result?.retval
        ? scValToNative(simulation.result.retval)
        : {};
    const stats = (value || {}) as Record<string, bigint | number | string>;

    return {
      totalCount: Number(stats.total_count || 0),
      pendingCount: Number(stats.pending_count || 0),
      completedCount: Number(stats.completed_count || 0),
      refundedCount: Number(stats.refunded_count || 0),
      escrowedAmount: String(stats.escrowed_amount || "0"),
    };
  } catch {
    return emptyStats();
  }
}

export function getContractStatusSummary() {
  if (!CONTRACT_ENABLED) {
    return {
      enabled: false,
      label: "Contract integration is coded but not configured.",
    };
  }

  return {
    enabled: true,
    label: `Contract ready: ${REMIT_CONTRACT_ID}`,
  };
}
