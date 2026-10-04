import React from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle2,
  ArrowRight,
  GitBranch,
  Terminal,
  Activity,
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      {/* Title & Architectural Overview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 mb-2">
          <Layers className="w-4 h-4" />
          <span>Clean Architecture Whitepaper</span>
          <span>·</span>
          <span className="text-slate-400">Evolution from PPGStore &amp; Pydux 2.0 to PyDux 3.0</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Solving the Multi-Observer Render Bottleneck in Python Desktop GUI
        </h1>
        <p className="text-slate-300 text-sm mt-2 leading-relaxed">
          Desktop UI frameworks (PySide6, PyQt5, Tkinter, Kivy) suffer severe latency when components are forced to recalculate their layouts or repaint their widget trees unnecessarily. Here is how PyDux 3.0 eradicates this problem using Clean Architecture, Type Safety, and Memoized Selectors.
        </p>
      </div>

      {/* Architectural Diagram Banner */}
      <div className="rounded-xl overflow-hidden border border-slate-800 relative bg-slate-950">
        <img
          src="/src/assets/images/pydux_architecture_1791100248025.jpg"
          alt="PyDux 3.0 Clean Architecture and State Pipeline"
          className="w-full h-64 sm:h-80 object-cover object-center opacity-85"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent flex items-end p-6">
          <div className="space-y-1">
            <div className="text-xs font-mono text-cyan-400 font-semibold">
              UNIFIED STATE PIPELINE
            </div>
            <div className="text-lg font-bold text-white">
              One Immutable State → Memoized Slices → Selective Framework Dispatch
            </div>
          </div>
        </div>
      </div>

      {/* The 3 Fatal Flaws of Legacy Pydux / PPGStore */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <span>The 3 Critical Flaws in Legacy Pydux &amp; PPGStore</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/90 rounded-xl border border-rose-950 p-5 space-y-2.5">
            <div className="text-xs font-mono text-rose-400 font-semibold">
              FLAW 1: UNCONDITIONAL FAN-OUT
            </div>
            <h3 className="text-sm font-bold text-white">All Observers Woken Up</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In legacy Pydux, <code className="text-rose-300 font-mono">_notify_observers()</code> iterates over every subscriber and calls <code className="text-rose-300 font-mono">observer.on_store_change()</code>. Even if only <code className="text-slate-300 font-mono">cart.total</code> changed, Component A (user profile) and Component C (theme bar) both executed expensive updates.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-xl border border-rose-950 p-5 space-y-2.5">
            <div className="text-xs font-mono text-rose-400 font-semibold">
              FLAW 2: HARDCODED QTIMER LOCK-IN
            </div>
            <h3 className="text-sm font-bold text-white">Broke Tkinter, Kivy &amp; CLI</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Legacy Pydux hardcoded <code className="text-rose-300 font-mono">QTimer.singleShot(0, observer._reconcile_widgets_state)</code> directly in the core notification loop. This caused import crashes or silent failures in Tkinter, Kivy, headless CLI, or pytest test suites without Qt.
            </p>
          </div>

          <div className="bg-slate-900/90 rounded-xl border border-rose-950 p-5 space-y-2.5">
            <div className="text-xs font-mono text-rose-400 font-semibold">
              FLAW 3: HEAVY SERIALIZATION
            </div>
            <h3 className="text-sm font-bold text-white">model_dump() on Every Write</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Calling Pydantic's <code className="text-rose-300 font-mono">model_dump()</code> on every read and write deep-cloned entire nested dictionaries, generating thousands of short-lived objects and triggering Python Garbage Collector pauses during UI drag/drop or rapid typing.
            </p>
          </div>
        </div>
      </div>

      {/* PyDux 3.0 Clean Architecture Breakdown */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-cyan-400" />
          <span>The PyDux 3.0 Architectural Blueprint</span>
        </h2>

        <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">1</span>
                <span>Layer 1: Decoupled Core Store</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                The core store (<code className="text-cyan-300 font-mono">Store[TState]</code>) is 100% agnostic with zero GUI imports. It utilizes a thread-safe <code className="text-cyan-300 font-mono">threading.RLock</code> to permit mutations from background threads (e.g. background worker threads, network requests) safely.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">2</span>
                <span>Layer 2: Memoized Selectors (Reselect)</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                <code className="text-cyan-300 font-mono">create_selector(*input_selectors, result_fn)</code> caches computations based on input arguments. If the inputs have not changed according to <code className="text-cyan-300 font-mono">shallow_equal</code>, the cached result is returned instantly without re-evaluating the math function.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">3</span>
                <span>Layer 3: Selective Subscription Filter</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Instead of listening to the whole store, widgets call <code className="text-cyan-300 font-mono">store.select(selector, listener)</code>. PyDux tracks each subscription's previous selected value. If <code className="text-cyan-300 font-mono">equality_fn(prev, curr) == True</code>, the listener is <strong>completely skipped</strong>!
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-bold text-cyan-300 font-mono flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-cyan-950 border border-cyan-800 flex items-center justify-center text-[10px]">4</span>
                <span>Layer 4: MainThreadBridge Protocol</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                GUI frameworks cannot accept updates from worker threads. PyDux defines a minimal protocol:
                <code className="block bg-slate-950 p-2 rounded text-[11px] font-mono mt-1 text-slate-300">
                  schedule_on_main_thread(callback: Callable[[], None])
                </code>
                Implemented for Qt (<code className="text-cyan-300 font-mono">QTimer</code>), Tkinter (<code className="text-cyan-300 font-mono">after_idle</code>), and Kivy (<code className="text-cyan-300 font-mono">Clock.schedule_once</code>).
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Migration Comparison Code */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          <span>Code Migration: Legacy Pydux vs PyDux 3.0</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-slate-950 rounded-xl border border-rose-900/60 p-4 space-y-2">
            <div className="text-rose-400 font-bold font-sans">Legacy Pydux (Problematic)</div>
            <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
{`# ❌ Legacy: Subscribes to EVERYTHING
class MyComponent(Pydux):
    def __init__(self):
        super().__init__()
        # Pydux calls on_store_change
        # for EVERY action, regardless
        # of whether data changed!
        self.subscribe_to_store(self)

    def on_store_change(self, store):
        # Fires on ANY mutation!
        # Causes heavy desktop re-render
        self.label.setText(store.user.name)`}
            </pre>
          </div>

          <div className="bg-slate-950 rounded-xl border border-emerald-900/60 p-4 space-y-2">
            <div className="text-emerald-400 font-bold font-sans">PyDux 3.0 (Clean &amp; Selective)</div>
            <pre className="text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
{`# ✅ PyDux 3.0: Subscribes ONLY to Slice
select_user_name = lambda s: s["user"]["name"]

class MyComponent(Component, QyroReactiveComponent):
    def component_will_mount(self):
        # Only notified when user.name changes!
        # Ignores cart, theme, and alerts!
        self.bind_selector(
            store=store,
            selector=select_user_name,
            on_change=lambda name: self.label.setText(name)
        )`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
