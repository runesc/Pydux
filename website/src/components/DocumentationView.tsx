import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Code,
  Copy,
  Check,
  Tag,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Filter,
  ExternalLink,
} from 'lucide-react';

interface DocItem {
  id: string;
  name: string;
  signature: string;
  category: 'core' | 'selectors' | 'devtools' | 'adapters' | 'best-practices';
  summary: string;
  parameters?: Array<{ name: string; type: string; description: string }>;
  returns?: string;
  codeExample: string;
  whyItMatters: string;
  gotchas?: string[];
}

export const DocumentationView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const docItems: DocItem[] = [
    {
      id: 'create_store',
      name: 'create_store()',
      signature: 'create_store(reducer: Reducer[TState], initial_state: TState, middlewares: Optional[Sequence[Middleware]] = None) -> Store[TState]',
      category: 'core',
      summary: 'Initializes a thread-safe state container with optional middleware chain.',
      parameters: [
        { name: 'reducer', type: 'Callable[[TState, Action], TState]', description: 'Pure function calculating state transitions.' },
        { name: 'initial_state', type: 'TState', description: 'The baseline application state (dict, dataclass, or Pydantic model).' },
        { name: 'middlewares', type: 'Optional[Sequence[Middleware]]', description: 'List of middleware enhancers (e.g. devtools_middleware, logging).' },
      ],
      returns: 'Store[TState] instance with get_state(), dispatch(), and select() methods.',
      whyItMatters: 'Guarantees thread-safety through an internal RLock, isolating the state tree from individual GUI widgets.',
      codeExample: `from pydux import create_store, Action

def counter_reducer(state: dict, action: Action) -> dict:
    if action.type == "INCREMENT":
        return {**state, "count": state["count"] + 1}
    return state

store = create_store(counter_reducer, {"count": 0})
`,
      gotchas: [
        'Do NOT dispatch actions from inside a reducer (will raise RuntimeError).',
        'Reducers must be pure functions without side effects.',
      ],
    },
    {
      id: 'store_select',
      name: 'store.select()',
      signature: 'store.select(selector: Selector[TState, TSelected], listener: Listener[TSelected], equality_fn: Optional[EqualityFn] = None, fire_immediately: bool = False) -> Unsubscribe',
      category: 'core',
      summary: 'Subscribes a listener to a specific slice of state with memoized equality gating.',
      parameters: [
        { name: 'selector', type: 'Callable[[TState], TSelected]', description: 'Function extracting a specific slice or derived value.' },
        { name: 'listener', type: 'Callable[[TSelected], None]', description: 'Callback executed ONLY when the selected value changes.' },
        { name: 'equality_fn', type: 'Callable[[Any, Any], bool]', description: 'Comparator function (defaults to shallow_equal).' },
        { name: 'fire_immediately', type: 'bool', description: 'If True, invokes the listener immediately with current value upon subscription.' },
      ],
      returns: 'Unsubscribe callable: () -> None. Call this to clean up the subscription.',
      whyItMatters: 'This is the exact method that eliminates the full-fanout bug. Subscribed GUI components only re-render if equality_fn(prev_slice, new_slice) returns False.',
      codeExample: `# Subscribing only to user's display name
select_name = lambda state: state["user"]["name"]

def on_name_changed(new_name: str):
    label.setText(f"Operator: {new_name}")

# Will NEVER trigger when cart or theme actions dispatch!
unsubscribe = store.select(select_name, on_name_changed, fire_immediately=True)

# Later on widget close:
unsubscribe()
`,
      gotchas: [
        'Always store and invoke the returned unsubscribe function when destroying desktop widgets to prevent memory leaks.',
      ],
    },
    {
      id: 'create_selector',
      name: 'create_selector()',
      signature: 'create_selector(*input_selectors: Selector, result_fn: Callable, equality_fn: EqualityFn = shallow_equal) -> MemoizedSelector',
      category: 'selectors',
      summary: 'Builds a memoized Reselect-style selector that caches computation results across dispatches.',
      parameters: [
        { name: '*input_selectors', type: 'Selector[TState, Any]', description: 'One or more selector functions extracting inputs.' },
        { name: 'result_fn', type: 'Callable[..., TResult]', description: 'The derivation function receiving extracted inputs as arguments.' },
        { name: 'equality_fn', type: 'EqualityFn', description: 'Equality comparator for input parameters (default: shallow_equal).' },
      ],
      returns: 'Callable memoized selector with .recomputations and .reset_recomputations properties.',
      whyItMatters: 'Avoids running heavy loops (e.g. summing 5,000 cart items or filtering big lists) if the input slices have not changed.',
      codeExample: `from pydux import create_selector, shallow_equal

select_items = lambda s: s["cart"]["items"]
select_coupon = lambda s: s["cart"]["couponApplied"]

# Only recomputes when items or couponApplied change!
select_cart_total = create_selector(
    select_items,
    select_coupon,
    lambda items, has_coupon: sum(i["price"] * i["qty"] for i in items) * (0.85 if has_coupon else 1.0),
    equality_fn=shallow_equal
)
`,
    },
    {
      id: 'shallow_equal',
      name: 'shallow_equal()',
      signature: 'shallow_equal(a: Any, b: Any) -> bool',
      category: 'selectors',
      summary: 'High-performance equality comparator for dictionaries, sequences, and dataclasses.',
      whyItMatters: 'Deep comparisons can be slow. shallow_equal checks dictionary keys and list elements at level 1 in O(N) time, which is optimal for immutable state updates.',
      codeExample: `from pydux import shallow_equal

d1 = {"name": "Alice", "role": "Admin"}
d2 = {"name": "Alice", "role": "Admin"}

assert shallow_equal(d1, d2) is True  # True even if different dict instances!
`,
    },
    {
      id: 'devtools_tracker',
      name: 'PyDuxDevTools & devtools_middleware()',
      signature: 'devtools_middleware(devtools: PyDuxDevTools) -> Middleware',
      category: 'devtools',
      summary: 'Middleware that intercepts actions, computes granular key diffs, and enables time travel.',
      parameters: [
        { name: 'devtools', type: 'PyDuxDevTools', description: 'The tracker instance managing action history and time-travel steps.' },
      ],
      returns: 'Middleware function to pass into create_store(middlewares=[...]).',
      whyItMatters: 'Provides deep visibility into state mutations, action execution times (duration_ms), and allows undo/redo or replaying action histories.',
      codeExample: `from pydux import PyDuxDevTools, devtools_middleware, create_store

devtools = PyDuxDevTools(max_history=100)
store = create_store(root_reducer, INITIAL_STATE, middlewares=[devtools_middleware(devtools)])

# Time Travel Methods:
devtools.undo()             # Step back 1 action
devtools.redo()             # Step forward 1 action
devtools.jump_to_state(3)   # Jump to state at action #3
json_trace = devtools.export_trace_json()  # Export diagnostic dump
`,
    },
    {
      id: 'qyro_adapter',
      name: 'QyroReactiveComponent & connect_qyro',
      signature: 'class QyroReactiveComponent / bind_selector(store, selector, on_change)',
      category: 'adapters',
      summary: 'First-class lifecycle adapter for the Qyro framework (qyro.ui.component.Component).',
      whyItMatters: 'Automatically registers subscriptions during component_will_mount and tears them down during component_will_unmount, preventing dangling memory references.',
      codeExample: `from qyro import ApplicationContext
from qyro.ui.component import Component
from pydux.adapters.qyro import QyroReactiveComponent

class StatusWidget(Component, QyroReactiveComponent, ApplicationContext):
    def component_will_mount(self):
        # Cleanly binds with automatic teardown on unmount!
        self.bind_selector(
            store=store,
            selector=lambda s: s["system"]["status"],
            on_change=self.on_status_updated
        )

    def on_status_updated(self, status: str):
        self.status_label.text = status
`,
    },
    {
      id: 'main_thread_bridge',
      name: 'MainThreadBridge Protocol',
      signature: 'schedule_on_main_thread(fn: Callable[[], None]) -> None',
      category: 'adapters',
      summary: 'Protocol ensuring background thread state updates are safely dispatched to the GUI thread.',
      whyItMatters: 'Desktop GUI toolkits like Qt, Tkinter, and Kivy will crash with segmentation faults or lockups if UI widgets are touched from background threads. PyDux bridges wrap listeners into the main event loop.',
      codeExample: `# Qt Bridge (PySide6 / PyQt5 / PyQt6):
from pydux.adapters.qt import QtMainThreadBridge
from pydux import ReactiveBinding

binding = ReactiveBinding(
    store=store,
    selector=select_user,
    target=lambda u: label.setText(u["name"]),
    bridge=QtMainThreadBridge()  # Uses QTimer.singleShot(0, ...)
)

# Tkinter Bridge:
from pydux.adapters.tkinter import TkinterBridge
tk_binding = ReactiveBinding(
    store=store,
    selector=select_user,
    target=lambda u: string_var.set(u["name"]),
    bridge=TkinterBridge(root)   # Uses root.after_idle(...)
)
`,
    },
    {
      id: 'best_practices',
      name: 'Best Practices & Common Gotchas',
      signature: 'Architectural Rules for High-Performance Desktop Apps',
      category: 'best-practices',
      summary: 'Fundamental rules to guarantee 60fps performance and zero memory leaks.',
      whyItMatters: 'Following these rules prevents subtle state synchronization bugs across multiple windows.',
      codeExample: `# ✅ DO: Always return a new copy when modifying dictionaries or lists
def good_reducer(state, action):
    if action.type == "ADD_TODO":
        return {**state, "todos": [*state["todos"], action.payload]}
    return state

# ❌ DON'T: Never mutate state in-place!
def bad_reducer(state, action):
    if action.type == "ADD_TODO":
        state["todos"].append(action.payload) # BROKEN! Pointers match, selectors skip!
        return state
`,
      gotchas: [
        'Never mutate lists or dicts in place. If pointers do not change, memoized selectors will assume data is identical and skip rendering.',
        'Use store.select() for UI components, never store.subscribe(). store.subscribe() listens to everything and triggers full fan-out.',
        'Always clean up subscriptions when closing child windows or modals.',
      ],
    },
  ];

  const filteredDocs = docItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.signature.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header & Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <BookOpen className="w-4 h-4" />
              <span>PyDux 3.0 API Documentation</span>
              <span>·</span>
              <span className="text-slate-400">Complete Method Signatures &amp; Guidelines</span>
            </div>
            <h1 className="text-2xl font-bold text-white">
              Official Library API Reference
            </h1>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search methods, types, bridges..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Modules' },
            { id: 'core', label: 'Core Store' },
            { id: 'selectors', label: 'Selectors & Equality' },
            { id: 'devtools', label: 'DevTools Tracker' },
            { id: 'adapters', label: 'Qyro & UI Adapters' },
            { id: 'best-practices', label: 'Rules & Gotchas' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* API Reference Cards */}
      <div className="space-y-6">
        {filteredDocs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
            No API documentation found matching "{searchQuery}".
          </div>
        ) : (
          filteredDocs.map((doc) => (
            <div
              key={doc.id}
              id={doc.id}
              className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-sm hover:border-slate-700 transition-colors"
            >
              {/* Card Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-white font-mono">{doc.name}</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80 uppercase">
                      {doc.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{doc.summary}</p>
                </div>

                <button
                  onClick={() => handleCopy(doc.codeExample, doc.id)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer shrink-0"
                >
                  {copiedId === doc.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedId === doc.id ? 'Copied' : 'Copy Example'}</span>
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Signature */}
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto">
                  {doc.signature}
                </div>

                {/* Parameters Table */}
                {doc.parameters && doc.parameters.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      Parameters:
                    </div>
                    <div className="border border-slate-800 rounded-lg overflow-hidden divide-y divide-slate-800 text-xs">
                      {doc.parameters.map((param, i) => (
                        <div key={i} className="p-2.5 bg-slate-950/40 flex flex-col sm:flex-row sm:items-baseline gap-2">
                          <span className="font-mono font-semibold text-cyan-300 w-32 shrink-0">
                            {param.name}
                          </span>
                          <span className="font-mono text-slate-400 text-[11px] w-48 shrink-0">
                            {param.type}
                          </span>
                          <span className="text-slate-300 text-xs">{param.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Returns */}
                {doc.returns && (
                  <div className="text-xs text-slate-300 flex items-baseline gap-2">
                    <span className="font-bold text-slate-400 font-mono uppercase text-[11px]">Returns:</span>
                    <span className="font-mono text-slate-200">{doc.returns}</span>
                  </div>
                )}

                {/* Why It Matters */}
                <div className="p-3.5 bg-cyan-950/20 rounded-lg border border-cyan-900/40 flex items-start gap-2.5 text-xs text-slate-300">
                  <Lightbulb className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-cyan-300">Why it is designed this way: </span>
                    <span>{doc.whyItMatters}</span>
                  </div>
                </div>

                {/* Code Example */}
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    Usage Example:
                  </div>
                  <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed whitespace-pre">
                    {doc.codeExample}
                  </pre>
                </div>

                {/* Gotchas / Warnings */}
                {doc.gotchas && doc.gotchas.length > 0 && (
                  <div className="p-3 bg-amber-950/20 rounded-lg border border-amber-900/40 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 font-mono">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Important Considerations:</span>
                    </div>
                    <ul className="text-xs text-slate-300 space-y-1 list-disc list-inside">
                      {doc.gotchas.map((g, gi) => (
                        <li key={gi}>{g}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
