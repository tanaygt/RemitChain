'use client';

import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  connectWalletKit,
  getStoredWallet,
} from '@/lib/wallet';

export default function LandingPage() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Buffer) {
      (window as Window & { Buffer?: typeof Buffer }).Buffer = Buffer;
    }

    const connection = getStoredWallet();
    if (connection?.address) {
      router.push('/dashboard');
    }
  }, [router]);

  async function handleConnectWallet() {
    try {
      setIsBusy(true);
      setError(null);
      await connectWalletKit();
      router.push('/dashboard');
    } catch (err) {
      console.error('Wallet kit connection failed:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not connect a supported wallet.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/85 backdrop-blur-md animate-fade-in dark:border-slate-800 dark:bg-slate-900/85">
        <div className="mx-auto max-w-7xl px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="brand-mark">RemitChain</div>
            
            {/* Desktop Menu */}
            <div className="hidden items-center gap-8 md:flex">
              <a
                href="#features"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-400"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-400"
              >
                How It Works
              </a>
              <button
                onClick={handleConnectWallet}
                disabled={isBusy}
                className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-primary-dark hover:shadow-lg hover:shadow-primary/20 disabled:opacity-50"
              >
                {isBusy ? 'Opening...' : 'Connect Wallet'}
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="inline-flex items-center justify-center rounded-md p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-500 focus:outline-none dark:hover:bg-slate-800"
              >
                <span className="sr-only">Open main menu</span>
                {isMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Content */}
        {isMenuOpen && (
          <div className="border-t border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-900">
            <div className="space-y-1 px-2 pt-2 pb-3">
              <a
                href="#features"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-md px-3 py-4 text-base font-medium text-slate-700 hover:bg-slate-50 hover:text-primary dark:text-slate-300 dark:hover:bg-slate-800"
              >
                How It Works
              </a>
              <div className="px-3 py-4">
                <button
                  onClick={() => {
                    handleConnectWallet();
                    setIsMenuOpen(false);
                  }}
                  disabled={isBusy}
                  className="w-full rounded-xl bg-primary px-4 py-3 text-center text-base font-bold text-white transition-all hover:bg-primary-dark disabled:opacity-50"
                >
                  {isBusy ? 'Opening...' : 'Connect Wallet'}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(55,138,221,0.16),_transparent_36%),radial-gradient(circle_at_bottom_right,_rgba(29,158,117,0.14),_transparent_32%)]" />
        <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-4 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <div className="relative z-10 animate-fade-in">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-xs font-bold text-warning">
              Contract tracker in progress
            </div>
            <h1 className="max-w-3xl text-5xl font-bold tracking-tight leading-[1.02] sm:text-6xl lg:text-7xl">
              Multi-wallet remittance tracking on{' '}
              <span className="text-primary">Stellar Testnet</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 sm:text-xl">
              RemitChain is moving beyond a single XLM transfer with wallet
              choice, contract-backed payment records, live activity updates, and clearer
              transaction status from wallet signature to on-chain result.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <button
                onClick={handleConnectWallet}
                disabled={isBusy}
                className="rounded-2xl bg-primary px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-xl disabled:opacity-50"
              >
                {isBusy ? 'Opening wallet kit...' : 'Connect Wallet'}
              </button>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ['Wallet choice', 'Choose from supported Stellar wallets in one connect flow'],
                ['Contract records', 'Soroban-backed remittance tracking and status reads'],
                ['Live sync', 'Recent contract events surfaced in the dashboard feed'],
              ].map(([title, detail]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
                >
                  <div className="text-sm font-bold">{title}</div>
                  <div className="mt-2 text-sm leading-relaxed text-slate-500">{detail}</div>
                </div>
              ))}
            </div>

            {error ? <p className="mt-5 font-medium text-danger">{error}</p> : null}
          </div>

          <div className="relative z-10 animate-fade-in">
            <div className="relative mx-auto max-w-xl rounded-[28px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold">Realtime Payment Tracker</div>
                  <div className="text-xs text-slate-500">Wallet to contract to activity feed</div>
                </div>
                <div className="rounded-full bg-success/10 px-3 py-1 text-[10px] font-bold uppercase text-success">
                  Testnet
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-950">
                  <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-slate-400">
                    <span>Wallet lane</span>
                    <span>Pending</span>
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                    <div className="h-2 flex-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                    <div className="h-3 w-3 rounded-full bg-warning animate-pulse" />
                  </div>
                  <div className="mt-3 text-sm text-slate-500">
                    Select a wallet, sign a contract call, and watch the record settle into the
                    feed.
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Supported flow
                    </div>
                    <div className="mt-3 text-sm font-semibold">Direct pay + tracked remittance</div>
                    <div className="mt-2 text-sm text-slate-500">
                      Keep a simple XLM send lane while adding a contract-backed history layer.
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Contract focus
                    </div>
                    <div className="mt-3 text-sm font-semibold">Wallets, contract, events</div>
                    <div className="mt-2 text-sm text-slate-500">
                      A clean path toward deployed contract proof and visible transaction status.
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-primary">
                        Activity sample
                      </div>
                      <div className="mt-2 text-sm font-semibold">
                        created -&gt; pending -&gt; completed
                      </div>
                    </div>
                    <div className="rounded-lg bg-white px-3 py-2 text-xs font-mono shadow-sm dark:bg-slate-900">
                      ledger + events
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-24">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold">RemitChain Feature Set</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-500">
            RemitChain turns a simple payment app into a small contract-aware
            dApp with clearer transaction lifecycle tracking.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              title: 'Multi-wallet access',
              desc: 'A single connect flow opens a Stellar wallet chooser so users can pick the wallet they want.',
            },
            {
              title: 'Contract write flow',
              desc: 'Create remittance records through Soroban so the payment tracker has on-chain state to read back.',
            },
            {
              title: 'Realtime activity',
              desc: 'Poll Stellar RPC events and surface the most recent contract actions in a live dashboard feed.',
            },
            {
              title: 'Clear errors',
              desc: 'Show readable handling for wallet missing, user rejection, and insufficient balance instead of vague failures.',
            },
          ].map((feature, index) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/40 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                0{index + 1}
              </div>
              <h3 className="text-lg font-bold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="how-it-works" className="border-y border-slate-200 bg-white py-24 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="mx-auto mt-4 max-w-2xl text-slate-500">
              The app keeps the UX simple while adding contract records and event updates behind
              the scenes.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              ['Connect a wallet', 'Open the wallet chooser, pick a supported Stellar wallet, and restore the connected address into the dashboard.'],
              ['Write to the contract', 'Create a remittance record and sign the contract transaction through the connected wallet.'],
              ['Watch activity update', 'Recent events and transaction status refresh in the dashboard so the app stays in sync with testnet state.'],
            ].map(([title, body]) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Step</div>
                <h3 className="mt-3 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="bg-slate-50 py-10 dark:bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="brand-mark mr-3">RemitChain</span>
            Contract-backed payment tracking on Stellar Testnet.
          </div>
          <div>Multi-wallet, contract calls, and activity sync on Stellar Testnet.</div>
        </div>
      </footer>
    </main>
  );
}
