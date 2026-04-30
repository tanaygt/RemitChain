'use client';

import { Buffer } from 'buffer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  fetchContractActivity,
  fetchContractStats,
  getContractStatusSummary,
  submitContractRemittance,
} from '@/lib/contract';
import { fetchAccountAssets, fetchBalance, sendAssetPayments } from '@/lib/stellar';
import type {
  AssetOption,
  ContractActivity,
  ContractStats,
  PaymentRecipient,
  TxState,
  WalletConnection,
} from '@/lib/types';
import { disconnectWallet, getStoredWallet } from '@/lib/wallet';

function createRecipient(id: number): PaymentRecipient {
  return {
    id: `recipient-${id}`,
    destination: '',
    amount: '',
  };
}

const emptyStats: ContractStats = {
  totalCount: 0,
  pendingCount: 0,
  completedCount: 0,
  refundedCount: 0,
  escrowedAmount: '0',
};

export default function Dashboard() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletConnection | null>(() => getStoredWallet());
  const [balance, setBalance] = useState('0');
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('native');
  const [memo, setMemo] = useState('Family support');
  const [country, setCountry] = useState('india');
  const [recipients, setRecipients] = useState<PaymentRecipient[]>([createRecipient(1)]);
  const [txState, setTxState] = useState<TxState>({ stage: 'idle', title: 'Ready' });
  const [isBusy, setIsBusy] = useState(false);
  const [mode, setMode] = useState<'direct' | 'contract'>('contract');
  const [activities, setActivities] = useState<ContractActivity[]>([]);
  const [stats, setStats] = useState<ContractStats>(emptyStats);

  const contractStatus = useMemo(() => getContractStatusSummary(), []);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Buffer) {
      (window as Window & { Buffer?: typeof Buffer }).Buffer = Buffer;
    }
  }, []);

  const refreshDashboard = useCallback(
    async (address: string) => {
      try {
        const basePromises: Promise<unknown>[] = [
          fetchBalance(address).then(({ balance: nextBalance }) => setBalance(nextBalance)),
          fetchAccountAssets(address).then((nextAssets) => {
            setAssets(nextAssets);
            if (
              nextAssets.length > 0 &&
              !nextAssets.some((asset) => asset.id === selectedAssetId)
            ) {
              setSelectedAssetId(nextAssets[0].id);
            }
          }),
        ];

        if (contractStatus.enabled) {
          basePromises.push(
            fetchContractActivity().then(setActivities),
            fetchContractStats().then(setStats),
          );
        }

        await Promise.all(basePromises);
      } catch (error) {
        console.error('Dashboard refresh failed:', error);
      }
    },
    [contractStatus.enabled, selectedAssetId],
  );

  useEffect(() => {
    if (!wallet?.address) {
      router.push('/');
      return;
    }

    const initialLoad = window.setTimeout(() => {
      void refreshDashboard(wallet.address);
    }, 0);

    const interval = window.setInterval(() => {
      void refreshDashboard(wallet.address);
    }, 8000);

    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
    };
  }, [refreshDashboard, router, wallet]);

  const selectedAsset = useMemo(() => {
    return assets.find((asset) => asset.id === selectedAssetId) || assets[0] || null;
  }, [assets, selectedAssetId]);

  const totalAmount = useMemo(() => {
    return recipients.reduce((sum, recipient) => sum + (Number(recipient.amount) || 0), 0);
  }, [recipients]);

  const walletLabel = useMemo(() => {
    if (!wallet) {
      return 'No wallet';
    }

    return wallet.name || wallet.id || 'Wallet';
  }, [wallet]);

  async function handleDisconnect() {
    await disconnectWallet();
    setWallet(null);
    router.push('/');
  }

  function updateRecipient(id: string, field: 'destination' | 'amount', value: string) {
    setRecipients((current) =>
      current.map((recipient) =>
        recipient.id === id ? { ...recipient, [field]: value } : recipient,
      ),
    );
  }

  function addRecipient() {
    setRecipients((current) => [...current, createRecipient(current.length + 1)]);
  }

  function removeRecipient(id: string) {
    setRecipients((current) => {
      if (current.length === 1) {
        return current;
      }

      return current.filter((recipient) => recipient.id !== id);
    });
  }

  async function handleSend() {
    if (!wallet?.address || !selectedAsset) {
      return;
    }

    try {
      setIsBusy(true);
      setTxState({
        stage: 'pending',
        title: mode === 'contract' ? 'Contract Transaction Pending' : 'Transaction Pending',
        detail:
          mode === 'contract'
            ? 'Please sign the contract call in your wallet.'
            : 'Please sign the payment transaction in your wallet.',
      });

      const primaryRecipient = recipients.find(
        (recipient) => recipient.destination.trim() && Number(recipient.amount) > 0,
      );

      const result =
        mode === 'contract'
          ? await submitContractRemittance({
              address: wallet.address,
              recipient: primaryRecipient?.destination || '',
              amount: primaryRecipient?.amount || '0',
              country,
              memo,
            })
          : await sendAssetPayments({
              address: wallet.address,
              asset: selectedAsset,
              recipients,
              memo,
            });

      setTxState(result);

      if (result.stage === 'success') {
        setRecipients([createRecipient(1)]);
        await refreshDashboard(wallet.address);
      }
    } catch (error) {
      setTxState({
        stage: 'error',
        title: 'Transaction Failed',
        detail: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="brand-mark cursor-pointer" onClick={() => router.push('/')}>
              RemitChain
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Payment Tracker Dashboard
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                Connected Wallet
              </div>
              <div className="mt-1 font-semibold">{walletLabel}</div>
              <div className="truncate text-xs text-slate-500">
                {wallet?.address
                  ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-8)}`
                  : '...'}
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-500 transition-all hover:border-danger/30 hover:text-danger dark:border-slate-800"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-6 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
        <aside className="space-y-6">
          <div className="rounded-3xl bg-primary p-6 text-white shadow-xl shadow-primary/20 sm:p-8">
            <div className="text-xs font-bold uppercase tracking-widest opacity-70">
              Current XLM Balance
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-3">
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                {parseFloat(balance).toFixed(7)}
              </h2>
              <span className="pb-1 text-base font-medium opacity-80">XLM</span>
            </div>
            <p className="mt-4 text-sm opacity-80">
              Use direct payments for simple transfers, or switch to the contract tracker for
              recorded remittance activity.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h3 className="mb-4 font-bold">Available Assets</h3>
            <div className="space-y-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="font-semibold">{asset.code}</div>
                  {asset.issuer ? (
                    <div className="break-all text-[10px] text-slate-400">{asset.issuer}</div>
                  ) : null}
                  <div className="font-mono text-xs">{asset.balance}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h3 className="font-bold">Contract Status</h3>
            <p className="mt-3 text-sm text-slate-500">{contractStatus.label}</p>
            <div
              className={`mt-4 rounded-xl border p-4 text-sm ${
                contractStatus.enabled
                  ? 'border-success/20 bg-success/5 text-success'
                  : 'border-warning/25 bg-warning/5 text-warning'
              }`}
            >
              {contractStatus.enabled
                ? 'Contract interaction is enabled. The tracker can submit calls and poll events.'
                : 'Contract interaction is not enabled yet. Add NEXT_PUBLIC_REMIT_CONTRACT_ID after deployment.'}
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-8 flex flex-col gap-4">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setMode('contract')}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    mode === 'contract'
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 text-slate-500 dark:border-slate-800'
                  }`}
                >
                  Contract Tracker
                </button>
                <button
                  onClick={() => setMode('direct')}
                  className={`rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                    mode === 'direct'
                      ? 'bg-primary text-white'
                      : 'border border-slate-200 text-slate-500 dark:border-slate-800'
                  }`}
                >
                  Direct Payment
                </button>
              </div>

              <div>
                <h2 className="text-2xl font-bold">
                  {mode === 'contract' ? 'Create a tracked remittance' : 'Send XLM or Stellar Assets'}
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  {mode === 'contract'
                    ? 'Record a payment through the Soroban contract, then follow recent events and stats in the activity panel.'
                    : 'Keep the direct payment lane available for simple testnet transfers and wallet verification.'}
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {mode === 'contract' ? 'Country' : 'Asset'}
                  </label>
                  {mode === 'contract' ? (
                    <input
                      type="text"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
                    />
                  ) : (
                    <select
                      value={selectedAssetId}
                      onChange={(event) => setSelectedAssetId(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
                    >
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.code}
                          {asset.issuer
                            ? ` - ${asset.issuer.slice(0, 4)}...${asset.issuer.slice(-4)}`
                            : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Memo
                  </label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    placeholder="Reference"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="space-y-4">
                {recipients.map((recipient, index) => (
                  <div
                    key={recipient.id}
                    className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-[minmax(0,1fr)_180px_auto] sm:items-end"
                  >
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Recipient {index + 1}
                      </label>
                      <input
                        type="text"
                        value={recipient.destination}
                        onChange={(event) =>
                          updateRecipient(recipient.id, 'destination', event.target.value)
                        }
                        placeholder="G..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.0000001"
                        value={recipient.amount}
                        onChange={(event) =>
                          updateRecipient(recipient.id, 'amount', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-4 outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <button
                      onClick={() => removeRecipient(recipient.id)}
                      disabled={mode === 'contract' || recipients.length === 1}
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-500 transition-all hover:border-danger/30 hover:text-danger disabled:opacity-40 dark:border-slate-800 sm:w-auto"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              {mode === 'direct' ? (
                <button
                  onClick={addRecipient}
                  className="w-full rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-bold text-slate-500 transition-all hover:border-primary/50 hover:text-primary dark:border-slate-700"
                >
                  + Add recipient
                </button>
              ) : null}

              <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {mode === 'contract' ? 'Tracker summary' : 'Batch summary'}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {mode === 'contract'
                      ? 'Creates one contract-backed remittance record.'
                      : `${recipients.filter((recipient) => recipient.destination.trim()).length} recipient entries`}
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Total amount
                  </div>
                  <div className="text-lg font-bold">
                    {totalAmount.toFixed(7)} {selectedAsset?.code || 'XLM'}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={isBusy || (mode === 'contract' && !contractStatus.enabled)}
                className="w-full rounded-2xl bg-primary px-5 py-4 text-base font-bold text-white transition-all hover:bg-primary-dark hover:shadow-xl disabled:opacity-50 sm:text-lg"
              >
                {isBusy
                  ? 'Processing...'
                  : mode === 'contract'
                    ? 'Submit contract remittance'
                    : `Submit ${selectedAsset?.code || 'XLM'} transaction`}
              </button>
            </div>
          </div>

          {txState.stage !== 'idle' ? (
            <div
              className={`rounded-2xl border p-6 ${
                txState.stage === 'success'
                  ? 'border-success/20 bg-success/5'
                  : txState.stage === 'error'
                    ? 'border-danger/20 bg-danger/5'
                    : 'border-warning/20 bg-warning/5'
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h3
                  className={`text-lg font-bold ${
                    txState.stage === 'success'
                      ? 'text-success'
                      : txState.stage === 'error'
                        ? 'text-danger'
                        : 'text-warning'
                  }`}
                >
                  {txState.title}
                </h3>
                <button
                  onClick={() => setTxState({ stage: 'idle', title: 'Ready' })}
                  className="text-slate-400 hover:text-slate-600"
                >
                  x
                </button>
              </div>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{txState.detail}</p>
              {txState.hash ? (
                <div className="space-y-3">
                  <div className="break-all rounded-lg border border-slate-100 bg-white p-3 font-mono text-[10px] dark:border-slate-800 dark:bg-slate-950">
                    {txState.hash}
                  </div>
                  <a
                    href={`https://stellar.expert/explorer/testnet/tx/${txState.hash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center text-xs font-bold text-primary hover:underline"
                  >
                    View on Stellar Expert -&gt;
                  </a>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h3 className="font-bold">Realtime Contract Stats</h3>
            <div className="mt-5 grid grid-cols-2 gap-3">
              {[
                ['Tracked', String(stats.totalCount)],
                ['Pending', String(stats.pendingCount)],
                ['Completed', String(stats.completedCount)],
                ['Refunded', String(stats.refundedCount)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                >
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {label}
                  </div>
                  <div className="mt-2 text-xl font-bold">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Escrowed amount
              </div>
              <div className="mt-2 text-lg font-bold">{stats.escrowedAmount}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h3 className="font-bold">Recent Activity Feed</h3>
            <div className="mt-4 space-y-3">
              {activities.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-700">
                  No contract events yet. Once the contract is configured and called from the
                  dashboard, new events will appear here.
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-sm font-bold">{activity.action}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Ledger {activity.ledger}
                      </div>
                    </div>
                    <div className="mt-2 text-xs leading-relaxed text-slate-500">
                      {activity.detail}
                    </div>
                    <div className="mt-3 text-[10px] text-slate-400">{activity.timestamp}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
