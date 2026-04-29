'use client';

import { Buffer } from 'buffer';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { fetchAccountAssets, fetchBalance, sendAssetPayments } from '@/lib/stellar';
import type { AssetOption, PaymentRecipient, TxState, WalletConnection } from '@/lib/types';

function createRecipient(id: number): PaymentRecipient {
  return {
    id: `recipient-${id}`,
    destination: '',
    amount: '',
  };
}

function getStoredWallet(): WalletConnection | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem('remitchain_wallet');
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as {
      id?: string;
      name?: string;
      address?: unknown;
    };
    const addressValue = parsed.address;
    const normalizedAddress =
      typeof addressValue === 'string'
        ? addressValue
        : typeof addressValue === 'object' &&
            addressValue !== null &&
            'address' in addressValue &&
            typeof addressValue.address === 'string'
          ? addressValue.address
          : null;

    if (!normalizedAddress) {
      return null;
    }

    return {
      id: parsed.id || 'freighter',
      name: parsed.name || 'Freighter',
      address: normalizedAddress,
    };
  } catch {
    window.localStorage.removeItem('remitchain_wallet');
    return null;
  }
}

export default function Dashboard() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletConnection | null>(() => getStoredWallet());
  const [balance, setBalance] = useState('0');
  const [assets, setAssets] = useState<AssetOption[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState('native');
  const [memo, setMemo] = useState('Family support');
  const [recipients, setRecipients] = useState<PaymentRecipient[]>([createRecipient(1)]);
  const [txState, setTxState] = useState<TxState>({ stage: 'idle', title: 'Ready' });
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Buffer) {
      (window as Window & { Buffer?: typeof Buffer }).Buffer = Buffer;
    }
  }, []);

  const refreshAccountState = useCallback(
    async (address: string) => {
      try {
        const [{ balance: nextBalance }, nextAssets] = await Promise.all([
          fetchBalance(address),
          fetchAccountAssets(address),
        ]);

        setBalance(nextBalance);
        setAssets(nextAssets);

        if (nextAssets.length > 0 && !nextAssets.some((asset) => asset.id === selectedAssetId)) {
          setSelectedAssetId(nextAssets[0].id);
        }
      } catch (error) {
        console.error('Account refresh failed:', error);
      }
    },
    [selectedAssetId],
  );

  useEffect(() => {
    if (!wallet?.address) {
      router.push('/');
      return;
    }

    const initialLoad = window.setTimeout(() => {
      void refreshAccountState(wallet.address);
    }, 0);

    const interval = setInterval(() => {
      void refreshAccountState(wallet.address);
    }, 10000);

    return () => {
      window.clearTimeout(initialLoad);
      clearInterval(interval);
    };
  }, [refreshAccountState, router, wallet]);

  const selectedAsset = useMemo(() => {
    return assets.find((asset) => asset.id === selectedAssetId) || assets[0] || null;
  }, [assets, selectedAssetId]);

  const totalAmount = useMemo(() => {
    return recipients.reduce((sum, recipient) => sum + (Number(recipient.amount) || 0), 0);
  }, [recipients]);

  function handleDisconnect() {
    localStorage.removeItem('remitchain_wallet');
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
        title: 'Transaction Pending',
        detail: 'Please sign the batch payment in Freighter.',
      });

      const result = await sendAssetPayments({
        address: wallet.address,
        asset: selectedAsset,
        recipients,
        memo,
      });

      setTxState(result);

      if (result.stage === 'success') {
        setRecipients([createRecipient(1)]);
        await refreshAccountState(wallet.address);
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
        <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="brand-mark cursor-pointer" onClick={() => router.push('/')}>
              RemitChain
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Level 1 Payments Dashboard
            </p>
          </div>

          <div className="flex items-center justify-between gap-4 sm:justify-end">
            <div className="min-w-0 flex-1 sm:flex-none sm:text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                Connected Wallet
              </span>
              <span className="block truncate text-sm font-medium">
                {wallet?.address
                  ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-6)}`
                  : '...'}
              </span>
            </div>
            <button
              onClick={handleDisconnect}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-bold text-slate-500 transition-all hover:border-danger/30 hover:text-danger dark:border-slate-800"
            >
              Disconnect
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-6 p-4 sm:p-6 lg:grid-cols-3 lg:gap-8">
        <div className="space-y-6 lg:col-span-1">
          <div className="animate-fade-in rounded-3xl bg-primary p-6 text-white shadow-xl shadow-primary/20 sm:p-8">
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">
              Current XLM Balance
            </span>
            <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
              <h2 className="font-heading text-3xl font-bold sm:text-4xl">
                {parseFloat(balance).toFixed(7)}
              </h2>
              <span className="pb-1 text-base font-medium opacity-80 sm:text-lg">XLM</span>
            </div>

            {parseFloat(balance) === 0 ? (
              <p className="mt-4 text-[11px] leading-tight opacity-70 sm:text-[10px]">
                New wallet? Fund it using the{' '}
                <a
                  href="https://laboratory.stellar.org/#account-creator?network=testnet"
                  target="_blank"
                  rel="noreferrer"
                  className="underline hover:text-white"
                >
                  Stellar Laboratory
                </a>
                .
              </p>
            ) : null}
          </div>

          <div className="animate-fade-in rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
            <h3 className="mb-4 font-bold">Available Assets</h3>
            <div className="space-y-3">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="font-semibold">{asset.code}</div>
                    {asset.issuer ? (
                      <div className="break-all text-[10px] text-slate-400">{asset.issuer}</div>
                    ) : null}
                  </div>
                  <div className="font-mono text-xs">{asset.balance}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <div className="animate-fade-in rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold sm:text-2xl">Send XLM or Stellar Assets</h2>
                <p className="mt-2 text-sm text-slate-500">
                  One Stellar transaction can include multiple payment operations. This form
                  sends the selected asset to up to 100 recipients at once.
                </p>
              </div>
              <button
                onClick={addRecipient}
                className="h-11 w-full rounded-xl bg-slate-100 px-4 font-bold text-slate-700 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:w-auto"
              >
                + Add recipient
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Asset
                  </label>
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
                </div>
                <div>
                  <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Memo (Optional)
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
                      disabled={recipients.length === 1}
                      className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm font-bold text-slate-500 transition-all hover:border-danger/30 hover:text-danger disabled:opacity-40 dark:border-slate-800 sm:w-auto"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Batch summary
                  </div>
                  <div className="mt-1 text-sm text-slate-500">
                    {recipients.filter((recipient) => recipient.destination.trim()).length}{' '}
                    recipient entries
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
                disabled={isBusy || !selectedAsset}
                className="w-full rounded-2xl bg-primary px-5 py-4 text-base font-bold text-white transition-all hover:bg-primary-dark hover:shadow-xl disabled:opacity-50 sm:p-5 sm:text-lg"
              >
                {isBusy ? 'Processing...' : `Submit ${selectedAsset?.code || 'XLM'} transaction`}
              </button>
            </div>
          </div>

          {txState.stage !== 'idle' ? (
            <div
              className={`animate-fade-in rounded-2xl border p-6 ${
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
        </div>
      </div>
    </main>
  );
}
