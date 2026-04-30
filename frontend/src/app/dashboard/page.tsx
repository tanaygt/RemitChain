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
  const [wallet, setWallet] = useState<WalletConnection | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    setIsMounted(true);
    const stored = getStoredWallet();
    if (stored) {
      setWallet(stored);
    }

    if (typeof window !== 'undefined' && !window.Buffer) {
      (window as Window & { Buffer?: typeof Buffer }).Buffer = Buffer;
    }
  }, []);

  const refreshDashboard = useCallback(
    async (address: string, silent = false) => {
      try {
        if (!silent) setIsRefreshing(true);
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
            fetchContractActivity()
              .then(setActivities)
              .catch((err) => console.error('Failed to fetch contract activity:', err)),
            fetchContractStats().then(setStats),
          );
        }

        await Promise.all(basePromises);
      } catch (error) {
        console.error('Dashboard refresh failed:', error instanceof Error ? error.message : String(error));
      } finally {
        setIsRefreshing(false);
      }
    },
    [contractStatus.enabled, selectedAssetId],
  );

  useEffect(() => {
    if (!isMounted) return;

    if (!wallet?.address) {
      // Small delay to ensure we're not redirecting during initial client mount
      const timeout = setTimeout(() => {
        if (!wallet?.address) router.push('/');
      }, 500);
      return () => clearTimeout(timeout);
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
  }, [isMounted, refreshDashboard, router, wallet]);

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
        await refreshDashboard(wallet.address, true);
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
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 backdrop-blur-md px-4 py-3 dark:border-slate-800 dark:bg-slate-900/90 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="brand-mark cursor-pointer" onClick={() => router.push('/')}>
              RemitChain
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Dashboard {isRefreshing && <span className="ml-2 inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" /> <span className="text-[9px] lowercase font-medium text-slate-400">updating...</span></span>}
            </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs dark:border-slate-800 dark:bg-slate-950 md:block">
              <div className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                Wallet
              </div>
              <div className="truncate font-semibold max-w-[120px]">
                {wallet?.address
                  ? `${wallet.address.slice(0, 4)}...${wallet.address.slice(-4)}`
                  : '...'}
              </div>
            </div>
            <button
              onClick={handleDisconnect}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-500 transition-all hover:border-danger/30 hover:bg-danger/5 hover:text-danger dark:border-slate-800 dark:bg-slate-900"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-[280px_1fr] xl:grid-cols-[300px_1fr_320px]">
        {/* Left Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-3xl bg-primary p-6 text-white shadow-xl shadow-primary/20">
            <div className="text-[10px] font-bold uppercase tracking-widest opacity-70">
              XLM Balance
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="truncate font-heading text-3xl font-bold">
                {parseFloat(balance).toFixed(4)}
              </h2>
              <span className="text-sm font-medium opacity-80">XLM</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">Assets</h3>
            <div className="space-y-2">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-950"
                >
                  <span className="font-bold">{asset.code}</span>
                  <span className="font-mono text-xs text-slate-500">{parseFloat(asset.balance).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {contractStatus.enabled && (
            <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
              <div className="text-[10px] font-bold uppercase tracking-widest text-success">
                Contract Live
              </div>
              <div className="mt-1 truncate font-mono text-[9px] text-success/70">
                {contractStatus.label.replace('Contract ready: ', '')}
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex bg-slate-100 p-1 rounded-2xl dark:bg-slate-800">
                <button
                  onClick={() => setMode('contract')}
                  className={`flex-1 sm:flex-none rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    mode === 'contract'
                      ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Contract Tracker
                </button>
                <button
                  onClick={() => setMode('direct')}
                  className={`flex-1 sm:flex-none rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    mode === 'direct'
                      ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Direct Payment
                </button>
              </div>

              <div className="text-right">
                <h2 className="text-xl font-bold">
                  {mode === 'contract' ? 'Tracked Remittance' : 'Direct Payment'}
                </h2>
              </div>
            </div>

            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    {mode === 'contract' ? 'Destination Country' : 'Select Asset'}
                  </label>
                  {mode === 'contract' ? (
                    <input
                      type="text"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
                    />
                  ) : (
                    <select
                      value={selectedAssetId}
                      onChange={(event) => setSelectedAssetId(event.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
                    >
                      {assets.map((asset) => (
                        <option key={asset.id} value={asset.id}>
                          {asset.code}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Transaction Memo
                  </label>
                  <input
                    type="text"
                    value={memo}
                    onChange={(event) => setMemo(event.target.value)}
                    placeholder="Reference"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {recipients.map((recipient, index) => (
                  <div
                    key={recipient.id}
                    className="grid gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:grid-cols-[1fr_140px_auto] sm:items-end"
                  >
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Recipient Address {recipients.length > 1 ? `#${index + 1}` : ''}
                      </label>
                      <input
                        type="text"
                        value={recipient.destination}
                        onChange={(event) =>
                          updateRecipient(recipient.id, 'destination', event.target.value)
                        }
                        placeholder="G..."
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Amount
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={recipient.amount}
                        onChange={(event) =>
                          updateRecipient(recipient.id, 'amount', event.target.value)
                        }
                        className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition-all focus:ring-2 focus:ring-primary/20 dark:border-slate-800 dark:bg-slate-900"
                      />
                    </div>
                    {mode === 'direct' && recipients.length > 1 && (
                      <button
                        onClick={() => removeRecipient(recipient.id)}
                        className="h-11 rounded-xl border border-slate-200 px-4 text-xs font-bold text-danger hover:bg-danger/5 dark:border-slate-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {mode === 'direct' && (
                <button
                  onClick={addRecipient}
                  className="w-full rounded-xl border border-dashed border-slate-300 py-3 text-xs font-bold text-slate-500 transition-all hover:border-primary hover:text-primary dark:border-slate-700"
                >
                  + Add Recipient Entry
                </button>
              )}

              <div className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm font-medium text-slate-500">
                  {mode === 'contract' ? 'Soroban contract call' : 'Batch payment operations'}
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Total</div>
                  <div className="text-2xl font-bold text-primary">
                    {totalAmount.toFixed(2)} <span className="text-sm font-medium">{selectedAsset?.code || 'XLM'}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSend}
                disabled={isBusy || (mode === 'contract' && !contractStatus.enabled)}
                className="w-full rounded-2xl bg-primary py-4 text-base font-bold text-white transition-all hover:bg-primary-dark hover:shadow-xl disabled:opacity-50"
              >
                {isBusy
                  ? 'Confirming in Wallet...'
                  : mode === 'contract'
                    ? 'Confirm Tracked Remittance'
                    : `Submit Batch Transaction`}
              </button>
            </div>
          </div>

          {txState.stage !== 'idle' && (
            <div
              className={`rounded-2xl border p-6 animate-in fade-in slide-in-from-bottom-4 duration-300 ${
                txState.stage === 'success'
                  ? 'border-success/20 bg-success/5'
                  : txState.stage === 'error'
                    ? 'border-danger/20 bg-danger/5'
                    : 'border-warning/20 bg-warning/5'
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-3">
                <h3 className={`text-lg font-bold ${
                  txState.stage === 'success' ? 'text-success' : txState.stage === 'error' ? 'text-danger' : 'text-warning'
                }`}>
                  {txState.title}
                </h3>
                <button onClick={() => setTxState({ stage: 'idle', title: 'Ready' })} className="text-slate-400">×</button>
              </div>
              <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">{txState.detail}</p>
              {txState.hash && (
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
                    Verify on Explorer →
                  </a>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Right Sidebar */}
        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Contract Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['Tracked', stats.totalCount],
                ['Pending', stats.pendingCount],
                ['Success', stats.completedCount],
                ['Failed', stats.refundedCount],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</div>
                  <div className="mt-1 text-xl font-bold">{value}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 rounded-xl border border-primary/10 bg-primary/5 p-4 text-center">
              <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Escrow Total</div>
              <div className="mt-1 text-lg font-bold">{stats.escrowedAmount} <span className="text-xs font-normal text-primary/70">XLM</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">Live Activity</h3>
            <div className="max-h-[380px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {activities.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                  Waiting for events...
                </div>
              ) : (
                activities.map((activity) => (
                  <div key={activity.id} className="rounded-xl border border-slate-100 p-3 text-xs dark:border-slate-800 transition-colors hover:border-primary/20">
                    <div className="flex justify-between font-bold mb-1">
                      <span className="text-primary">{activity.action}</span>
                      <span className="text-slate-400">L{activity.ledger}</span>
                    </div>
                    <div className="text-slate-500 truncate mb-2">{activity.detail}</div>
                    <div className="text-[9px] text-slate-300">
                      {new Date(activity.timestamp).toLocaleTimeString()}
                    </div>
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
