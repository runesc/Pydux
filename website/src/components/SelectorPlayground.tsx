import React, { useState } from 'react';
import {
  GitFork,
  CheckCircle2,
  XCircle,
  Database,
  Cpu,
  Layers,
  Sparkles,
  ArrowDown,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { AppState, Action } from '../types/pydux';
import { computeCartMetrics } from '../core/pyduxSimulator';

interface Props {
  state: AppState;
  onDispatch: (action: Action) => void;
  recomputationCount: number;
  cacheHitCount: number;
}

export const SelectorPlayground: React.FC<Props> = ({
  state,
  onDispatch,
  recomputationCount,
  cacheHitCount,
}) => {
  const [copied, setCopied] = useState(false);
  const cartMetrics = computeCartMetrics(state.cart.items, state.cart.couponApplied);

  const pythonSelectorExample = `# PyDux 3.0 Memoized Selector Example (Reselect Pattern)
from pydux import create_selector, shallow_equal

# 1. Base input selectors (extract pure slices)
select_cart_items = lambda state: state["cart"]["items"]
select_coupon = lambda state: state["cart"]["couponApplied"]

# 2. Memoized selector (only re-evaluates when input slices change!)
select_cart_summary = create_selector(
    select_cart_items,
    select_coupon,
    lambda items, has_coupon: {
        "subtotal": sum(i["price"] * i["qty"] for i in items),
        "discount": 0.15 if has_coupon else 0.0,
        "item_count": sum(i["qty"] for i in items),
    },
    equality_fn=shallow_equal  # Fast O(N) dict / list comparison
)

# 3. In your desktop component (Qyro, PySide6, Tkinter, Kivy):
# The component's on_change listener will NEVER be called
# if user.name or ui.theme changes!
store.select(select_cart_summary, listener=my_widget.update_view)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonSelectorExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <GitFork className="w-4 h-4" />
              <span>PyDux 3.0 Reselect Engine</span>
              <span>·</span>
              <span className="text-slate-400">DAG Dependency &amp; Cache Graph</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Memoized Selector Dependency Graph
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Selectors compute derived state. By memoizing previous arguments with customizable equality comparators,
              PyDux ensures expensive math, formatting, or filtering only runs when source inputs change.
            </p>
          </div>

          {/* Cache Efficiency Score */}
          <div className="grid grid-cols-2 gap-3 shrink-0 bg-slate-950/80 p-4 rounded-lg border border-slate-800 text-center min-w-[240px]">
            <div>
              <div className="text-xs text-slate-400 font-medium">Cache Hits (Saved)</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                {cacheHitCount}
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5">Zero Math Computed</div>
            </div>
            <div className="border-l border-slate-800 pl-3">
              <div className="text-xs text-slate-400 font-medium">Recomputations</div>
              <div className="text-2xl font-mono font-bold text-cyan-400 mt-1 tabular-nums">
                {recomputationCount}
              </div>
              <div className="text-[11px] text-cyan-400/80 mt-0.5">True Slice Changes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Visual DAG Graph */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-6 flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Live DAG Evaluation Flow</span>
        </h3>

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Level 1: Input Slices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-cyan-300 font-semibold">Slice 1: cart.items</span>
                <span className="text-slate-400 font-mono">{state.cart.items.length} items</span>
              </div>
              <div className="text-xs text-slate-400 truncate font-mono">
                [{state.cart.items.map((i) => i.name.slice(0, 12)).join(', ')}...]
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-mono text-cyan-300 font-semibold">Slice 2: cart.couponApplied</span>
                <span className="font-mono text-amber-300">{state.cart.couponApplied ? 'TRUE' : 'FALSE'}</span>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Discount multiplier: {state.cart.couponApplied ? '0.85 (15% OFF)' : '1.00 (Standard)'}
              </div>
            </div>
          </div>

          {/* Connector Arrows */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs font-mono text-slate-300">
              <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>shallow_equal(prev_inputs, next_inputs)</span>
            </div>
          </div>

          {/* Level 2: Memoized Selector Node */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-5 rounded-xl border border-cyan-800/60 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-white font-mono">
                    select_cart_summary (Memoized Node)
                  </div>
                  <div className="text-xs text-slate-400">
                    Caches derived cart math. Invalidates ONLY when Slice 1 or Slice 2 alters.
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-mono text-emerald-400 font-bold">
                  Active Cache Valid
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {recomputationCount} total evaluations
                </div>
              </div>
            </div>

            <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800 text-xs font-mono grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-slate-400 text-[10px]">DERIVED SUBTOTAL</div>
                <div className="text-white font-bold mt-0.5">${cartMetrics.subtotal.toFixed(2)}</div>
              </div>
              <div className="border-x border-slate-800">
                <div className="text-slate-400 text-[10px]">DERIVED DISCOUNT</div>
                <div className="text-amber-300 font-bold mt-0.5">-${cartMetrics.discount.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-slate-400 text-[10px]">FINAL TOTAL</div>
                <div className="text-emerald-400 font-bold mt-0.5">${cartMetrics.total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Connector Arrow */}
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700 text-xs font-mono text-slate-300">
              <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
              <span>Notifies desktop widget only if result changed</span>
            </div>
          </div>

          {/* Level 3: Desktop UI Sink */}
          <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
              <span className="font-semibold text-white">Connected GUI Widget (Qt / Tkinter / Kivy / Qyro)</span>
            </div>
            <span className="text-slate-400 font-mono">
              Unrelated actions (<code className="text-cyan-300">USER/*</code>, <code className="text-purple-300">UI/*</code>) bypass this completely!
            </span>
          </div>
        </div>
      </div>

      {/* Python Implementation Code Reference */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Python Selector API Contract
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Python Snippet'}</span>
          </button>
        </div>
        <pre className="font-mono text-xs text-slate-200 bg-slate-950 p-4 rounded-lg overflow-x-auto leading-relaxed border border-slate-800">
          {pythonSelectorExample}
        </pre>
      </div>
    </div>
  );
};
