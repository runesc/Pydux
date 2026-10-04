import React, { useState } from 'react';
import {
  BookOpen,
  Rocket,
  CheckCircle2,
  HelpCircle,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Zap,
  Code2,
  ShieldCheck,
  AlertCircle,
  Play,
} from 'lucide-react';
import { Action } from '../types/pydux';

interface Props {
  onDispatch: (action: Action) => void;
  onNavigateTab: (tab: 'simulator' | 'devtools' | 'selectors' | 'frameworks' | 'code' | 'docs') => void;
}

interface Step {
  id: string;
  stepNumber: string;
  title: string;
  subtitle: string;
  why: string;
  code: string;
  explanation: string[];
  testAction?: { label: string; action: Action };
}

export const QuickStartGuide: React.FC<Props> = ({ onDispatch, onNavigateTab }) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const steps: Step[] = [
    {
      id: 'step-1',
      stepNumber: '01',
      title: 'Define your State & Actions',
      subtitle: 'The blueprint of your data and the intentions to change it',
      why: 'In desktop apps, state gets scattered across variables in 10 different window classes. Having a single immutable dictionary or typed model ensures you always know what your application data looks like at any given millisecond.',
      code: `from dataclasses import dataclass
from pydux import Action

# 1. Your Initial State (plain dict, dataclass, or Pydantic model)
INITIAL_STATE = {
    "user": {"name": "Carlos Gomez", "role": "Lead Engineer"},
    "cart": {"items": [], "tax_rate": 0.16},
    "ui": {"theme": "dark"}
}

# 2. Dispatched Actions: An Action is just an intent with a 'type' and optional 'payload'
action_login = Action(type="USER/LOGIN", payload={"name": "Carlos Gomez", "role": "Admin"})
action_add = Action(type="CART/ADD_ITEM", payload={"name": "CAN Bus Transceiver", "price": 45.0, "qty": 1})
`,
      explanation: [
        'An Action is a simple data structure with a string type and payload.',
        'Never mutate state directly (e.g. state["user"]["name"] = "New"). That bypasses listeners and breaks change detection.',
        'Using UPPERCASE namespaces like "USER/LOGIN" makes your logs and DevTools crystal clear.',
      ],
      testAction: {
        label: 'Test Action: USER/SET_NAME',
        action: { type: 'USER/SET_NAME', payload: 'Carlos Gomez' },
      },
    },
    {
      id: 'step-2',
      stepNumber: '02',
      title: 'Write a Pure Reducer Function',
      subtitle: 'The only place where state transitions are calculated',
      why: 'A Reducer is a pure function: (prevState, action) -> nextState. Because it produces a new state object instead of mutating in place, PyDux can instantly detect which memory pointers changed in O(1) time and allow time-travel debugging.',
      code: `from pydux import Action

def app_reducer(state: dict, action: Action) -> dict:
    """
    Pure function: ALWAYS returns a new dictionary copy when modifying data.
    Never modify 'state' directly in place!
    """
    if action.type == "USER/SET_NAME":
        return {
            **state,
            "user": {**state["user"], "name": action.payload}
        }
    
    elif action.type == "CART/ADD_ITEM":
        return {
            **state,
            "cart": {
                **state["cart"],
                "items": [*state["cart"]["items"], action.payload]
            }
        }
        
    elif action.type == "UI/TOGGLE_THEME":
        current = state["ui"]["theme"]
        return {
            **state,
            "ui": {**state["ui"], "theme": "light" if current == "dark" else "dark"}
        }

    # If action is unhandled, return existing state untouched
    return state
`,
      explanation: [
        'Pure functions have NO side effects: no network calls, no disk writes, no GUI mutations.',
        'Use the Python dictionary unpacking syntax {**state, "key": new_val} to create shallow copies.',
        'If the reducer returns the exact same object reference, PyDux knows nothing changed and skips all notifications.',
      ],
      testAction: {
        label: 'Test Action: UI/TOGGLE_THEME',
        action: { type: 'UI/TOGGLE_THEME' },
      },
    },
    {
      id: 'step-3',
      stepNumber: '03',
      title: 'Initialize the Store & DevTools',
      subtitle: 'Create the centralized, thread-safe state container',
      why: 'The Store holds the state tree and manages subscriber notifications with an internal threading lock, making it 100% safe to dispatch actions from background worker threads or async network tasks.',
      code: `from pydux import create_store, PyDuxDevTools, devtools_middleware

# 1. Optional: Create DevTools instance for time-travel & action logging
devtools = PyDuxDevTools(max_history=100)

# 2. Create the store with your reducer and initial state
store = create_store(
    reducer=app_reducer,
    initial_state=INITIAL_STATE,
    middlewares=[devtools_middleware(devtools)]
)

# 3. Reading current state anywhere:
current = store.get_state()
print("Current user:", current["user"]["name"])

# 4. Dispatching actions:
store.dispatch(Action("USER/SET_NAME", "Elena Rostova"))
`,
      explanation: [
        'create_store() sets up the store and chains any active middlewares.',
        'The store has ZERO GUI dependencies: it runs identically in PySide6, Tkinter, Kivy, or headless CLI scripts.',
        'devtools_middleware logs every state transition with microsecond precision for debugging.',
      ],
    },
    {
      id: 'step-4',
      stepNumber: '04',
      title: 'Create Memoized Selectors (The Core Superpower)',
      subtitle: 'Compute derived data and eliminate redundant re-renders',
      why: 'In legacy Pydux/PPGStore, every subscriber woke up on every update. With memoized selectors, PyDux computes derived data (like cart totals) and checks if the result changed. If your component only cares about user.name, it will NEVER re-render when cart items change!',
      code: `from pydux import create_selector, shallow_equal

# 1. Simple input selectors (extract pure slices)
select_cart_items = lambda state: state["cart"]["items"]
select_tax_rate = lambda state: state["cart"]["tax_rate"]

# 2. Memoized Selector: ONLY recomputes when items or tax_rate change!
select_cart_total = create_selector(
    select_cart_items,
    select_tax_rate,
    lambda items, tax: sum(i["price"] * i["qty"] for i in items) * (1 + tax),
    equality_fn=shallow_equal
)

# 3. Simple slice selector for user header:
select_user_display = lambda state: f"{state['user']['name']} ({state['user']['role']})"
`,
      explanation: [
        'create_selector takes input selector functions and a computation function.',
        'If state changes, but cart items remain identical, select_cart_total returns the cached value instantly in O(1) time without looping through the array.',
        'shallow_equal compares dictionary keys and sequence items without expensive deep recursion.',
      ],
      testAction: {
        label: 'Test Action: CART/ADD_ITEM',
        action: {
          type: 'CART/ADD_ITEM',
          payload: { id: `quick-${Date.now()}`, name: 'Stepper Driver Module', price: 29.9, qty: 1 },
        },
      },
    },
    {
      id: 'step-5',
      stepNumber: '05',
      title: 'Connect to UI: Qyro, PySide6, Tkinter or Kivy',
      subtitle: 'Framework-agnostic reactive binding with automatic lifecycle cleanup',
      why: 'Desktop GUI toolkits crash if you update widgets from background threads, and leak memory if you forget to unsubscribe when closing windows. PyDux adapters handle thread synchronization and teardown automatically.',
      code: `# Example A: Qyro Integration (Recommended)
from qyro.ui.component import Component
from pydux.adapters.qyro import QyroReactiveComponent

class UserHeader(Component, QyroReactiveComponent):
    def component_will_mount(self):
        # 1. Bind selector: Automatically unsubscribes on component_will_unmount!
        self.bind_selector(
            store=store,
            selector=select_user_display,
            on_change=self.on_user_updated
        )

    def on_user_updated(self, user_label: str):
        # Called ONLY when user changes! (Ignores cart & theme updates)
        self.header_label.text = user_label

# Example B: PySide6 / PyQt5 (Qt Signal Bridge)
from pydux.adapters.qt import QtMainThreadBridge
from pydux import ReactiveBinding

binding = ReactiveBinding(
    store=store,
    selector=select_user_display,
    target=lambda text: qt_label.setText(text),
    bridge=QtMainThreadBridge()
)
`,
      explanation: [
        'In Qyro, QyroReactiveComponent tracks subscriptions and cleans them up on unmount to prevent memory leaks.',
        'In PySide/PyQt, QtMainThreadBridge dispatches to the Qt event loop safely.',
        'In Tkinter, TkinterBridge uses widget.after_idle() to avoid thread lockups.',
      ],
    },
  ];

  const handleCopy = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const current = steps[activeStep];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Rocket className="w-4 h-4" />
              <span>Crash Course 101</span>
              <span>·</span>
              <span className="text-slate-400">Step-by-Step Interactive Guide &amp; El Porqué</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              PyDux 3.0 QuickStart in 5 Minutes
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl leading-relaxed">
              New to state management or migrating from legacy Pydux/PPGStore? This guide explains every concept from first principles, why it is designed this way, and how to wire it into your desktop application.
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('simulator')}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <span>Open Live Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Step Navigation Pill Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
        {steps.map((s, idx) => {
          const isActive = activeStep === idx;
          return (
            <button
              key={s.id}
              onClick={() => setActiveStep(idx)}
              className={`p-2.5 rounded-lg text-left transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'bg-cyan-950/80 border border-cyan-700/80 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="text-[10px] font-mono font-bold text-cyan-400 mb-1">
                STEP {s.stepNumber}
              </div>
              <div className="text-xs font-semibold truncate">{s.title.split(' ')[0]} {s.title.split(' ')[1]}</div>
            </button>
          );
        })}
      </div>

      {/* Active Step Content Card */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 overflow-hidden shadow-sm">
        {/* Step Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-1">
                <span>STEP {current.stepNumber} OF 05</span>
                <span>·</span>
                <span className="text-slate-400">{current.subtitle}</span>
              </div>
              <h2 className="text-xl font-bold text-white">{current.title}</h2>
            </div>

            {current.testAction && (
              <button
                onClick={() => onDispatch(current.testAction!.action)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-800 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{current.testAction.label}</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* El Porqué (The "Why") Callout Box */}
          <div className="bg-gradient-to-r from-cyan-950/40 via-slate-900 to-cyan-950/30 p-4 rounded-lg border border-cyan-900/60 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider font-mono">
                ¿Por qué se hace de esta manera? (The Architectural Reason)
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {current.why}
              </p>
            </div>
          </div>

          {/* Code Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Python Code Implementation
              </span>
              <button
                onClick={() => handleCopy(current.code, activeStep)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
              >
                {copiedIndex === activeStep ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedIndex === activeStep ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed whitespace-pre">
              {current.code}
            </pre>
          </div>

          {/* Key Takeaways */}
          <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
              Key Rules for this Step:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {current.explanation.map((item, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Step Footer Navigation */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
            disabled={activeStep === 0}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors disabled:opacity-30 cursor-pointer"
          >
            ← Previous Step
          </button>

          <span className="text-xs font-mono text-slate-400">
            {activeStep + 1} of {steps.length}
          </span>

          {activeStep < steps.length - 1 ? (
            <button
              onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Next: {steps[activeStep + 1].title.split(' ')[0]}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              onClick={() => onNavigateTab('docs')}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-md transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Explore Complete API Reference</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Comparison Matrix: What went wrong before vs how PyDux 3.0 fixes it */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span>Quick Summary: Before vs After</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-rose-950/30 border border-rose-900/60 rounded-lg space-y-2">
            <div className="font-bold text-rose-400 font-mono">❌ The Old Way (PPGStore &amp; Pydux 1.x/2.x)</div>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed">
              <li>Subscribes whole components to the entire store.</li>
              <li>When Component A updates, Components B, C, and D are all called and re-rendered.</li>
              <li>Hardcoded <code className="text-rose-300 font-mono">QTimer</code> in the core broke Tkinter and Kivy.</li>
              <li>Heavy Pydantic <code className="text-rose-300 font-mono">model_dump()</code> deep cloning on every change.</li>
            </ul>
          </div>

          <div className="p-4 bg-emerald-950/30 border border-emerald-900/60 rounded-lg space-y-2">
            <div className="font-bold text-emerald-400 font-mono">✅ The PyDux 3.0 Way</div>
            <ul className="space-y-1.5 text-slate-300 list-disc list-inside leading-relaxed">
              <li>Subscribes ONLY to specific slices via <code className="text-emerald-300 font-mono">store.select(selector)</code>.</li>
              <li>If the slice didn't change, the component's callback is <strong>never called</strong>.</li>
              <li>Zero GUI imports in core: Uses agnostic <code className="text-emerald-300 font-mono">MainThreadBridge</code>.</li>
              <li>Includes Time-Travel DevTools tracker &amp; 1-click JSON export.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
