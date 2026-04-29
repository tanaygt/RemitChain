'use client';

import { Buffer } from 'buffer';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { connectFreighter } from '@/lib/freighter';
import type { WalletConnection } from '@/lib/types';

function getStoredWallet() {
  if (typeof window === 'undefined') {
    return null;
  }

  const stored = window.localStorage.getItem('remitchain_wallet');
  if (!stored) {
    return null;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<WalletConnection>;
    if (typeof parsed.address === 'string' && parsed.address) {
      return parsed;
    }
  } catch {
    window.localStorage.removeItem('remitchain_wallet');
  }

  return null;
}

export default function LandingPage() {
  const router = useRouter();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && !window.Buffer) {
      (window as Window & { Buffer?: typeof Buffer }).Buffer = Buffer;
    }

    const connection = getStoredWallet();
    if (connection?.address) {
      router.push('/dashboard');
    }
  }, [router]);

  async function handleConnect() {
    try {
      setIsBusy(true);
      setError(null);
      const address = await connectFreighter();
      const connection = { id: 'freighter', name: 'Freighter', address };
      localStorage.setItem('remitchain_wallet', JSON.stringify(connection));
      router.push('/dashboard');
    } catch (err) {
      console.error('Connection failed:', err);
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to connect. Make sure Freighter is unlocked and set to Testnet.';
      setError(message);
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="brand-mark">RemitChain</div>
          <div className="flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-slate-600 transition-colors hover:text-primary dark:text-slate-400"
            >
              Features
            </a>
            <button
              onClick={handleConnect}
              disabled={isBusy}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-primary-dark hover:shadow-lg disabled:opacity-50"
            >
              {isBusy ? 'Check Extension Popup...' : 'Connect Freighter'}
            </button>
          </div>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 lg:grid-cols-2 lg:py-32">
        <div className="animate-fade-in">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            White Belt Submission
          </div>
          <h1 className="mb-6 text-5xl font-bold tracking-tight leading-[1.1] lg:text-7xl">
            Global Remittances,
            <br />
            <span className="text-primary">Zero Fees.</span>
          </h1>
          <p className="mb-10 max-w-lg text-xl leading-relaxed text-slate-600 dark:text-slate-400">
            The first working version of RemitChain. Connect your Freighter wallet to send
            Stellar Testnet payments with clear status and proof.
          </p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleConnect}
              disabled={isBusy}
              className="rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white transition-all hover:-translate-y-1 hover:bg-primary-dark hover:shadow-xl disabled:opacity-50"
            >
              {isBusy ? 'Connecting...' : 'Connect with Freighter'}
            </button>
            <a
              href="#features"
              className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-lg font-bold transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800"
            >
              See How it Works
            </a>
          </div>
          {error ? <p className="mt-4 font-medium text-danger">{error}</p> : null}
        </div>

        <div className="relative flex justify-center animate-fade-in">
          <div className="glass-card relative z-10 w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <div className="mb-8 flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-danger/50" />
              <div className="h-3 w-3 rounded-full bg-warning/50" />
              <div className="h-3 w-3 rounded-full bg-success/50" />
            </div>
            <div className="space-y-4">
              <div className="h-8 w-3/4 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-full animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/50" />
              <div className="h-4 w-1/2 animate-pulse rounded-md bg-slate-100 dark:bg-slate-800/50" />
              <div className="grid grid-cols-2 gap-4 pt-6">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Fees
                  </span>
                  <div className="text-xl font-bold text-success">$0.00</div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Speed
                  </span>
                  <div className="text-xl font-bold text-slate-700 dark:text-slate-300">~5s</div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute left-1/2 top-1/2 -z-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/20 blur-[100px]" />
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-24">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold">Core Standards Implementation</h2>
          <p className="mx-auto max-w-2xl text-slate-500">
            Everything you need for a compliant Level 1 submission.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: 'FW',
              title: 'Freighter Wallet',
              desc: 'Securely integrated industry-standard browser extension.',
            },
            {
              icon: 'LB',
              title: 'Live Balance',
              desc: 'High-precision tracking with 7 decimal points.',
            },
            {
              icon: 'TN',
              title: 'Testnet Ready',
              desc: 'Optimized for the Stellar Testnet environment.',
            },
            {
              icon: 'TX',
              title: 'Full Proof',
              desc: 'Transaction hashes and direct links provided for every payment.',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:border-primary/50 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="mb-6 text-2xl font-bold text-primary transition-transform duration-300 group-hover:scale-110">
                {feature.icon}
              </div>
              <h3 className="mb-3 text-lg font-bold">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-8 px-4 md:flex-row">
          <div>
            <div className="brand-mark mb-2">RemitChain</div>
            <p className="text-sm text-slate-500">Built for the Risein Stellar Challenge.</p>
          </div>
          <div className="text-sm text-slate-400">RemitChain. White Belt Submission.</div>
        </div>
      </footer>
    </main>
  );
}
