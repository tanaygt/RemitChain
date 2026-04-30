import { Networks } from "@stellar/stellar-sdk";

import { connectFreighter, extractSignedTransactionXdr, signWithFreighter } from "./freighter";
import { NETWORK_PASSPHRASE } from "./config";
import { mapWalletErrorMessage } from "./remit-utils";
import type { WalletConnection } from "./types";

const STORAGE_KEY = "remitchain_wallet";

type WalletKitModule = typeof import("@creit.tech/stellar-wallets-kit/sdk");
type WalletKitTypes = typeof import("@creit.tech/stellar-wallets-kit/types");
type WalletKitModules = typeof import("@creit.tech/stellar-wallets-kit/modules/utils");
type SupportedWallet = {
  id: string;
  name: string;
  type: string;
  isAvailable: boolean;
  isPlatformWrapper: boolean;
  icon: string;
  url: string;
};

let walletKitReady = false;

async function loadWalletKit() {
  const [sdk, modules, types] = await Promise.all([
    import("@creit.tech/stellar-wallets-kit/sdk"),
    import("@creit.tech/stellar-wallets-kit/modules/utils"),
    import("@creit.tech/stellar-wallets-kit/types"),
  ]);

  return {
    sdk: sdk as WalletKitModule,
    modules: modules as WalletKitModules,
    types: types as WalletKitTypes,
  };
}

async function ensureWalletKit() {
  const { sdk, modules, types } = await loadWalletKit();

  if (!walletKitReady) {
    sdk.StellarWalletsKit.init({
      modules: modules.defaultModules(),
      network: types.Networks.TESTNET,
      authModal: {
        showInstallLabel: true,
        hideUnsupportedWallets: false,
      },
    });
    walletKitReady = true;
  }

  sdk.StellarWalletsKit.setNetwork(types.Networks.TESTNET);

  return { sdk, modules, types };
}

export function saveWallet(connection: WalletConnection) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(connection));
}

export function clearStoredWallet() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
}

export function getStoredWallet(): WalletConnection | null {
  if (typeof window === "undefined") {
    return null;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<WalletConnection> & {
      address?: unknown;
    };
    const addressValue = parsed.address;
    const addressRecord =
      typeof addressValue === "object" && addressValue !== null
        ? (addressValue as Record<string, unknown>)
        : null;
    const normalizedAddress =
      typeof addressValue === "string"
        ? addressValue
        : addressRecord && typeof addressRecord.address === "string"
          ? addressRecord.address
          : null;

    if (!normalizedAddress) {
      clearStoredWallet();
      return null;
    }

    return {
      id: parsed.id || "freighter",
      name: parsed.name || "Freighter",
      address: normalizedAddress,
      provider: parsed.provider || "freighter",
      walletId: parsed.walletId || parsed.id || "freighter",
    };
  } catch {
    clearStoredWallet();
    return null;
  }
}

export async function connectWalletKit(): Promise<WalletConnection> {
  const { sdk, types } = await ensureWalletKit();
  let selectedWalletId: string | undefined;

  const unsubscribe = sdk.StellarWalletsKit.on(
    types.KitEventType.WALLET_SELECTED,
    (event) => {
      selectedWalletId = event.payload.id;
    },
  );

  try {
    const { address } = await sdk.StellarWalletsKit.authModal();
    const network = await sdk.StellarWalletsKit.getNetwork();

    if (network.networkPassphrase !== Networks.TESTNET) {
      throw new Error("Please switch the selected wallet to Stellar Testnet.");
    }

    const connection: WalletConnection = {
      id: selectedWalletId || "wallet-kit",
      walletId: selectedWalletId || "wallet-kit",
      name: selectedWalletId || "Wallet",
      address,
      provider: "wallet-kit",
    };

    saveWallet(connection);
    return connection;
  } catch (error) {
    console.error("StellarWalletsKit authModal error:", error);
    const rawMessage =
      error instanceof Error
        ? error.message
        : typeof error === "string"
          ? error
          : "Wallet connection failed.";
    throw new Error(mapWalletErrorMessage(rawMessage));
  } finally {
    unsubscribe();
  }
}

export async function listSupportedWallets(): Promise<SupportedWallet[]> {
  const { sdk } = await ensureWalletKit();
  const wallets = await sdk.StellarWalletsKit.refreshSupportedWallets();
  return wallets.slice().sort((left, right) => {
    if (left.isAvailable !== right.isAvailable) {
      return left.isAvailable ? -1 : 1;
    }
    return left.name.localeCompare(right.name);
  });
}

export async function connectWalletById(walletId: string): Promise<WalletConnection> {
  try {
    const { sdk } = await ensureWalletKit();
    sdk.StellarWalletsKit.setWallet(walletId);
    const { address } = await sdk.StellarWalletsKit.fetchAddress();
    const network = await sdk.StellarWalletsKit.getNetwork();

    if (network.networkPassphrase !== Networks.TESTNET) {
      throw new Error("Please switch the selected wallet to Stellar Testnet.");
    }

    const wallets = await sdk.StellarWalletsKit.refreshSupportedWallets();
    const selected = wallets.find((wallet) => wallet.id === walletId);

    const connection: WalletConnection = {
      id: walletId,
      walletId,
      name: selected?.name || walletId,
      address,
      provider: "wallet-kit",
    };

    saveWallet(connection);
    return connection;
  } catch (error) {
    throw new Error(
      mapWalletErrorMessage(
        error instanceof Error ? error.message : "Wallet connection failed.",
      ),
    );
  }
}

export async function connectFreighterWallet(): Promise<WalletConnection> {
  const address = await connectFreighter();
  const connection: WalletConnection = {
    id: "freighter",
    walletId: "freighter",
    name: "Freighter",
    address,
    provider: "freighter",
  };
  saveWallet(connection);
  return connection;
}

export async function disconnectWallet() {
  const stored = getStoredWallet();

  if (stored?.provider === "wallet-kit") {
    try {
      const { sdk } = await ensureWalletKit();
      await sdk.StellarWalletsKit.disconnect();
    } catch (error) {
      console.warn("Wallet kit disconnect warning:", error);
    }
  }

  clearStoredWallet();
}

export async function signWithActiveWallet(xdr: string, address?: string) {
  const stored = getStoredWallet();

  if (!stored) {
    throw new Error("No wallet is connected.");
  }

  if (stored.provider === "wallet-kit" && stored.walletId) {
    const { sdk } = await ensureWalletKit();
    sdk.StellarWalletsKit.setWallet(stored.walletId);
    const { signedTxXdr } = await sdk.StellarWalletsKit.signTransaction(xdr, {
      address: address || stored.address,
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    return signedTxXdr;
  }

  const signed = await signWithFreighter(xdr);
  return extractSignedTransactionXdr(signed);
}
