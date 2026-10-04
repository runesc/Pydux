import React, { useState } from 'react';
import {
  User,
  ShoppingCart,
  Palette,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { AppState, Action, ComponentRenderStats } from '../types/pydux';
import { computeCartMetrics } from '../core/pyduxSimulator';

interface Props {
  state: AppState;
  onDispatch: (action: Action) => void;
  legacyStats: Record<string, ComponentRenderStats>;
  v3Stats: Record<string, ComponentRenderStats>;
  lastDispatchedAction: Action | null;
  onResetStats: () => void;
  onRunStressTest: () => void;
  isStressTesting: boolean;
}

export const HeadToHeadSimulator: React.FC<Props> = ({
  state,
  onDispatch,
  legacyStats,
  v3Stats,
  lastDispatchedAction,
  onResetStats,
  onRunStressTest,
  isStressTesting,
}) => {
  const [userNameInput, setUserNameInput] = useState('Elena Vance');
  const [itemNameInput, setItemNameInput] = useState('Optical Encoder 1000PPR');
  const [itemPriceInput, setItemPriceInput] = useState(48);

  const cartMetrics = computeCartMetrics(state.cart.items, state.cart.couponApplied);
  const unreadCount = state.notifications.items.filter((n) => !n.read).length;

  const totalLegacyRenders = Object.values(legacyStats).reduce((acc, curr) => acc + curr.legacyRenders, 0);
  const totalV3Renders = Object.values(v3Stats).reduce((acc, curr) => acc + curr.v3Renders, 0);
  const rendersEliminated = Math.max(0, totalLegacyRenders - totalV3Renders);
  const savingsPercent = totalLegacyRenders > 0 ? Math.round((rendersEliminated / totalLegacyRenders) * 100) : 0;

  // Track which component was targeted by the last action
  const isTargeted = (compKey: string): boolean => {
    if (!lastDispatchedAction) return false;
    const type = lastDispatchedAction.type;
    if (compKey === 'user') return type.startsWith('USER/');
    if (compKey === 'cart') return type.startsWith('CART/');
    if (compKey === 'ui') return type.startsWith('UI/');
    if (compKey === 'notifications') return type.startsWith('NOTIFICATIONS/');
    return false;
  };

  return (
    <div className="space-y-8">
      {/* Top Banner & Quantitative Rigor */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>PyDux 3.0 Selective Dispatch Engine</span>
              <span>·</span>
              <span className="text-slate-400">Memoized Reselect Pattern</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Zero Unnecessary Re-renders Across Desktop Components
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              When one component mutates state, legacy Pydux/PPGStore forced all subscribed observers to execute their
              render routines. PyDux 3.0 uses memoized selectors (<code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded text-xs">store.select()</code>) with shallow/deep equality checks so unconcerned widgets remain completely untouched.
            </p>
          </div>

          {/* Quantitative Efficiency Metrics */}
          <div className="grid grid-cols-3 gap-3 shrink-0 bg-slate-950/80 p-4 rounded-lg border border-slate-800 text-center">
            <div>
              <div className="text-xs text-slate-400 font-medium">PyDux 2.0 Renders</div>
              <div className="text-2xl font-mono font-bold text-rose-400 mt-1 tabular-nums">
                {totalLegacyRenders}
              </div>
              <div className="text-[11px] text-rose-400/80 mt-0.5">All Observers Hit</div>
            </div>
            <div className="border-x border-slate-800 px-3">
              <div className="text-xs text-slate-400 font-medium">PyDux 3.0 Renders</div>
              <div className="text-2xl font-mono font-bold text-cyan-400 mt-1 tabular-nums">
                {totalV3Renders}
              </div>
              <div className="text-[11px] text-cyan-400/80 mt-0.5">Only Target Slice</div>
            </div>
            <div>
              <div className="text-xs text-slate-400 font-medium">Render Waste Eliminated</div>
              <div className="text-2xl font-mono font-bold text-emerald-400 mt-1 tabular-nums">
                {savingsPercent}%
              </div>
              <div className="text-[11px] text-emerald-400/80 mt-0.5 tabular-nums">
                -{rendersEliminated} redundant calls
              </div>
            </div>
          </div>
        </div>

        {/* Action Dispatch Control Bar */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Test Dispatches:
            </span>
            <button
              onClick={() => onDispatch({ type: 'USER/SET_NAME', payload: userNameInput })}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Update User ({userNameInput.split(' ')[0]})</span>
            </button>

            <button
              onClick={() =>
                onDispatch({
                  type: 'CART/ADD_ITEM',
                  payload: {
                    id: `item-${Date.now()}`,
                    name: itemNameInput,
                    price: itemPriceInput,
                    qty: 1,
                  },
                })
              }
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Add Cart Item (${itemPriceInput})</span>
            </button>

            <button
              onClick={() => onDispatch({ type: 'CART/TOGGLE_COUPON' })}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Toggle Coupon (-15%)</span>
            </button>

            <button
              onClick={() => onDispatch({ type: 'UI/TOGGLE_THEME' })}
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Cycle UI Theme ({state.ui.theme})</span>
            </button>

            <button
              onClick={() =>
                onDispatch({
                  type: 'NOTIFICATIONS/ADD',
                  payload: {
                    id: `n-${Date.now()}`,
                    title: `Telemetry packet received from node #${Math.floor(Math.random() * 90 + 10)}`,
                    read: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                })
              }
              className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-md border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5 text-yellow-400" />
              <span>Push Notification</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRunStressTest}
              disabled={isStressTesting}
              className="px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/70 hover:bg-amber-900 border border-amber-800 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Run 25x Batch</span>
            </button>
            <button
              onClick={onResetStats}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-md border border-slate-700 transition-colors cursor-pointer"
              title="Reset render counters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {lastDispatchedAction && (
          <div className="mt-4 px-3 py-2 bg-slate-950 rounded-md border border-slate-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="text-slate-400">Last Dispatched:</span>
              <span className="font-mono text-cyan-300 font-semibold">{lastDispatchedAction.type}</span>
              {lastDispatchedAction.payload !== undefined && (
                <span className="text-slate-400 truncate max-w-md font-mono">
                  {JSON.stringify(lastDispatchedAction.payload)}
                </span>
              )}
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              Affected 1 targeted slice out of 4 components
            </span>
          </div>
        )}
      </div>

      {/* 4 Connected Desktop Components Simulation */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              Subscribed Desktop UI Components
            </h2>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
              <span className="text-slate-400">Pydux 2.0 Wasted Render</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <span className="text-slate-400">Pydux 3.0 Clean Render</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-600"></div>
              <span className="text-slate-400">Skipped (Zero Work)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Component A: User Profile Card */}
          <div
            className={`bg-slate-900/90 rounded-xl border transition-all duration-300 p-5 ${
              isTargeted('user')
                ? 'border-cyan-500 shadow-md shadow-cyan-500/10'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Component A: UserHeader</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    selector: <span className="text-cyan-300">s =&gt; s.user</span>
                  </div>
                </div>
              </div>

              {/* Live Render Counter Badges */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <div className="bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded text-rose-300 tabular-nums">
                  v2: <span className="font-bold">{legacyStats.user?.legacyRenders || 0}</span>
                </div>
                <div className="bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded text-emerald-300 tabular-nums">
                  v3: <span className="font-bold">{v3Stats.user?.v3Renders || 0}</span>
                </div>
              </div>
            </div>

            {/* Widget Simulated Content */}
            <div className="bg-slate-950/70 rounded-lg p-4 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">{state.user.name}</div>
                  <div className="text-xs text-slate-400">{state.user.email}</div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 font-mono">
                  {state.user.role}
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60 text-xs">
                <input
                  type="text"
                  value={userNameInput}
                  onChange={(e) => setUserNameInput(e.target.value)}
                  placeholder="New name..."
                  className="bg-slate-900 border border-slate-700 px-2.5 py-1 rounded text-white text-xs w-full focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => onDispatch({ type: 'USER/SET_NAME', payload: userNameInput })}
                  className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded shrink-0 transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Renders triggered only by <code className="text-cyan-300">USER/*</code> actions</span>
              <span className="text-emerald-400 font-mono font-medium">
                {Math.max(0, (legacyStats.user?.legacyRenders || 0) - (v3Stats.user?.v3Renders || 0))} renders skipped
              </span>
            </div>
          </div>

          {/* Component B: Cart Checkout Widget */}
          <div
            className={`bg-slate-900/90 rounded-xl border transition-all duration-300 p-5 ${
              isTargeted('cart')
                ? 'border-emerald-500 shadow-md shadow-emerald-500/10'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Component B: CheckoutSummary</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    selector: <span className="text-emerald-300">create_selector(items, coupon)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <div className="bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded text-rose-300 tabular-nums">
                  v2: <span className="font-bold">{legacyStats.cart?.legacyRenders || 0}</span>
                </div>
                <div className="bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded text-emerald-300 tabular-nums">
                  v3: <span className="font-bold">{v3Stats.cart?.v3Renders || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 rounded-lg p-4 border border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Items ({cartMetrics.itemCount} units):</span>
                <span className="text-slate-200 font-mono tabular-nums">${cartMetrics.subtotal.toFixed(2)}</span>
              </div>
              {state.cart.couponApplied && (
                <div className="flex items-center justify-between text-xs text-amber-400">
                  <span>Industrial Partner Discount (15%):</span>
                  <span className="font-mono tabular-nums">-${cartMetrics.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-slate-800/80">
                <span className="text-white">Total Amount:</span>
                <span className="text-emerald-400 font-mono tabular-nums">${cartMetrics.total.toFixed(2)}</span>
              </div>
              <div className="pt-1 flex items-center justify-between gap-2 text-xs">
                <button
                  onClick={() =>
                    onDispatch({
                      type: 'CART/ADD_ITEM',
                      payload: {
                        id: `item-${Date.now()}`,
                        name: itemNameInput,
                        price: itemPriceInput,
                        qty: 1,
                      },
                    })
                  }
                  className="w-full py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded transition-colors cursor-pointer"
                >
                  + Add Hardware Item (${itemPriceInput})
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Memoized: Ignores theme and user mutations</span>
              <span className="text-emerald-400 font-mono font-medium">
                {Math.max(0, (legacyStats.cart?.legacyRenders || 0) - (v3Stats.cart?.v3Renders || 0))} renders skipped
              </span>
            </div>
          </div>

          {/* Component C: System Theme Bar */}
          <div
            className={`bg-slate-900/90 rounded-xl border transition-all duration-300 p-5 ${
              isTargeted('ui')
                ? 'border-purple-500 shadow-md shadow-purple-500/10'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-950/80 text-purple-400 border border-purple-800/60">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Component C: SystemThemeBar</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    selector: <span className="text-purple-300">s =&gt; s.ui.theme</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <div className="bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded text-rose-300 tabular-nums">
                  v2: <span className="font-bold">{legacyStats.ui?.legacyRenders || 0}</span>
                </div>
                <div className="bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded text-emerald-300 tabular-nums">
                  v3: <span className="font-bold">{v3Stats.ui?.v3Renders || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 rounded-lg p-4 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Current Theme Preset:</span>
                <span className="font-mono text-purple-300 font-semibold uppercase">{state.ui.theme}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Layout Density:</span>
                <span className="font-mono text-slate-300 capitalize">{state.ui.density}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onDispatch({ type: 'UI/TOGGLE_THEME' })}
                  className="w-1/2 py-1 bg-purple-900/60 hover:bg-purple-800 border border-purple-700/80 text-purple-200 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Cycle Palette
                </button>
                <button
                  onClick={() => onDispatch({ type: 'UI/TOGGLE_DENSITY' })}
                  className="w-1/2 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Toggle Density
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Unchanged during cart additions or user edits</span>
              <span className="text-emerald-400 font-mono font-medium">
                {Math.max(0, (legacyStats.ui?.legacyRenders || 0) - (v3Stats.ui?.v3Renders || 0))} renders skipped
              </span>
            </div>
          </div>

          {/* Component D: Notification Badge */}
          <div
            className={`bg-slate-900/90 rounded-xl border transition-all duration-300 p-5 ${
              isTargeted('notifications')
                ? 'border-yellow-500 shadow-md shadow-yellow-500/10'
                : 'border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-950/80 text-yellow-400 border border-yellow-800/60">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Component D: NotificationCounter</h3>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    selector: <span className="text-yellow-300">s =&gt; count_unread(s)</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <div className="bg-rose-950/70 border border-rose-800/80 px-2 py-0.5 rounded text-rose-300 tabular-nums">
                  v2: <span className="font-bold">{legacyStats.notifications?.legacyRenders || 0}</span>
                </div>
                <div className="bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 rounded text-emerald-300 tabular-nums">
                  v3: <span className="font-bold">{v3Stats.notifications?.v3Renders || 0}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950/70 rounded-lg p-4 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Unread Critical Alerts:</span>
                <span className="text-sm font-mono font-bold text-yellow-400 bg-yellow-950/80 px-2.5 py-0.5 rounded border border-yellow-800/60 tabular-nums">
                  {unreadCount} pending
                </span>
              </div>
              <div className="text-xs text-slate-400 truncate">
                Latest: {state.notifications.items[0]?.title || 'No notifications'}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => onDispatch({ type: 'NOTIFICATIONS/MARK_ALL_READ' })}
                  className="w-full py-1 bg-yellow-950/70 hover:bg-yellow-900/80 border border-yellow-800/80 text-yellow-200 text-xs font-medium rounded transition-colors cursor-pointer"
                >
                  Mark All Read
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
              <span>Integer comparator ensures 0 re-renders if count is same</span>
              <span className="text-emerald-400 font-mono font-medium">
                {Math.max(0, (legacyStats.notifications?.legacyRenders || 0) - (v3Stats.notifications?.v3Renders || 0))} renders skipped
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
