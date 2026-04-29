import { isConnected, setAllowed, getAddress, signTransaction } from "@stellar/freighter-api";
import { NETWORK_PASSPHRASE } from "./config";

type FreighterAddressResponse = string | { address?: string };
export type FreighterSignResponse =
  | string
  | {
      signedTxXdr?: string;
      signerAddress?: string;
      error?: { message?: string };
    };

/**
 * Robust Freighter connection logic.
 * Optimizes for a fast, "no-click" experience if already authorized.
 */
export async function connectFreighter() {
  try {
    console.log("Freighter: Initialization started");

    const connected = await isConnected();
    if (!connected) {
      throw new Error("Freighter extension not found. Please install it to continue.");
    }

    // 1. Try to get the address immediately
    console.log("Freighter: Attempting silent getAddress()...");
    let response = await getAddress();
    
    // Check if the response is valid (not empty string, not empty object)
    const getAddressStr = (res: FreighterAddressResponse) => typeof res === 'string' ? res : res?.address;
    let address = getAddressStr(response);

    // 2. If no address, we MUST call setAllowed to trigger the popup
    if (!address) {
      console.log("Freighter: No address found silently, calling setAllowed()...");
      await setAllowed();
      response = await getAddress();
      address = getAddressStr(response);
    }

    console.log("Freighter: Final address obtained:", address);

    if (!address) {
      throw new Error("Freighter connection was not authorized. Please click 'Allow' in the extension.");
    }

    return address;
  } catch (error) {
    console.error("Freighter Connection Error:", error);
    throw error;
  }
}

export async function signWithFreighter(xdr: string) {
  try {
    const signed = (await signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    })) as FreighterSignResponse;
    return signed;
  } catch (error) {
    console.error("Freighter Signing Error:", error);
    throw error;
  }
}

export function extractSignedTransactionXdr(signed: FreighterSignResponse) {
  if (typeof signed === "string") {
    return signed;
  }

  if (signed.error?.message) {
    throw new Error(signed.error.message);
  }

  if (!signed.signedTxXdr) {
    throw new Error("Freighter did not return a signed transaction.");
  }

  return signed.signedTxXdr;
}
