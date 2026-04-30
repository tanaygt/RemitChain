import { buildTxState, formatUsdEstimate, mapWalletErrorMessage, summarizeActivity } from "./remit-utils";

describe("remit utils", () => {
  it("formats the fiat estimate for the remittance summary", () => {
    const result = formatUsdEstimate(25, 0.112, 83.2, "INR");

    expect(result.usdAmount).toBeCloseTo(2.8);
    expect(result.localAmount).toBeCloseTo(232.96);
    expect(result.text).toContain("USDC");
    expect(result.text).toContain("INR");
  });

  it("maps wallet rejection and missing wallet errors to readable text", () => {
    expect(mapWalletErrorMessage("User rejected the request")).toBe("The wallet request was rejected.");
    expect(mapWalletErrorMessage("Wallet not found in browser")).toBe("No supported wallet was found in this browser.");
  });

  it("summarizes recent contract activity and preserves tx state shape", () => {
    const txState = buildTxState("pending", "Waiting", "Sign in wallet");
    const summary = summarizeActivity([
      {
        id: "1",
        action: "created",
        ledger: 128,
        timestamp: "2026-04-25T12:00:00.000Z",
        detail: "escrow opened",
      },
    ]);

    expect(txState.stage).toBe("pending");
    expect(txState.title).toBe("Waiting");
    expect(summary).toBe("created recorded at ledger 128.");
  });
});
