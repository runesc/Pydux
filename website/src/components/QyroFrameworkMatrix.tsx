import React, { useState } from 'react';
import {
  Monitor,
  Layers,
  Code,
  Copy,
  Check,
  CheckCircle2,
  Terminal,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { AppState } from '../types/pydux';
import { computeCartMetrics } from '../core/pyduxSimulator';

interface Props {
  state: AppState;
}

export const QyroFrameworkMatrix: React.FC<Props> = ({ state }) => {
  const [selectedToolkit, setSelectedToolkit] = useState<'qyro' | 'qt' | 'tkinter' | 'kivy'>('qyro');
  const [copied, setCopied] = useState(false);

  const cartMetrics = computeCartMetrics(state.cart.items, state.cart.couponApplied);
  const unreadCount = state.notifications.items.filter((n) => !n.read).length;

  const codeSnippets: Record<string, string> = {
    qyro: `"""
Qyro Integration Example with PyDux 3.0
Compatible with Qyro Component & ApplicationContext lifecycle
"""
import sys
from qyro import ApplicationContext
from qyro.ui.component import Component
from pydux import create_store, create_selector, Action
from pydux.adapters.qyro import QyroReactiveComponent, connect_qyro

# Define store and memoized selectors
store = create_store(root_reducer, INITIAL_STATE)
select_user_display = lambda s: f"{s['user']['name']} ({s['user']['role']})"
select_cart_total = lambda s: sum(i['price'] * i['qty'] for i in s['cart']['items'])

class IndustrialConsole(Component, QyroReactiveComponent, ApplicationContext):
    def component_will_mount(self):
        # 1. Bind selector: PyDux automatically cleans up on unmount!
        self.bind_selector(
            store=store,
            selector=select_user_display,
            on_change=self.on_user_updated
        )
        self.bind_selector(
            store=store,
            selector=select_cart_total,
            on_change=self.on_cart_updated
        )

    def on_user_updated(self, user_label: str):
        # Triggered ONLY when user slice changes
        print(f"User changed: {user_label}")

    def on_cart_updated(self, total: float):
        # Triggered ONLY when cart items change
        print(f"Cart total updated: \${total:.2f}")

    def render(self):
        # Framework-agnostic rendering powered by Qyro!
        return self.create_widget()
`,
    qt: `"""
PySide6 / PyQt5 Agnostic Binding Example
Uses QtMainThreadBridge to ensure thread-safety on Qt Event Loop
"""
from PySide6.QtWidgets import QMainWindow, QLabel, QVBoxLayout, QWidget
from pydux import create_store, ReactiveBinding
from pydux.adapters.qt import QtMainThreadBridge

class QtDashboardWindow(QMainWindow):
    def __init__(self, store):
        super().__init__()
        self.setWindowTitle("PySide6 / PyDux 3.0")
        self.resize(480, 260)

        # UI elements
        container = QWidget()
        layout = QVBoxLayout(container)
        self.lbl_user = QLabel("Loading...")
        self.lbl_cart = QLabel("Loading...")
        layout.addWidget(self.lbl_user)
        layout.addWidget(self.lbl_cart)
        self.setCentralWidget(container)

        # Thread-safe Agnostic ReactiveBinding!
        # Automatically dispatches to Qt main thread using QTimer/QMetaObject
        self.bind_user = ReactiveBinding(
            store=store,
            selector=lambda s: s["user"]["name"],
            target=lambda name: self.lbl_user.setText(f"Operator: {name}"),
            bridge=QtMainThreadBridge()
        )
        self.bind_cart = ReactiveBinding(
            store=store,
            selector=lambda s: sum(i["price"] * i["qty"] for i in s["cart"]["items"]),
            target=lambda tot: self.lbl_cart.setText(f"Total: \${tot:.2f}"),
            bridge=QtMainThreadBridge()
        )
`,
    tkinter: `"""
Tkinter Agnostic Binding Example
Uses TkinterBridge with widget.after_idle for smooth GUI updates
"""
import tkinter as tk
from pydux import create_store, ReactiveBinding
from pydux.adapters.tkinter import TkinterBridge

class TkinterApp(tk.Tk):
    def __init__(self, store):
        super().__init__()
        self.title("Tkinter / PyDux 3.0")
        self.geometry("480x260")

        self.user_var = tk.StringVar()
        self.cart_var = tk.StringVar()

        tk.Label(self, textvariable=self.user_var, font=("Helvetica", 12, "bold")).pack(pady=10)
        tk.Label(self, textvariable=self.cart_var, font=("Helvetica", 11)).pack(pady=5)

        bridge = TkinterBridge(self)

        # Binds PyDux memoized selectors to Tkinter StringVars directly
        self.bind_user = ReactiveBinding(
            store=store,
            selector=lambda s: s["user"]["name"],
            target=lambda name: self.user_var.set(f"Operator: {name}"),
            bridge=bridge
        )
        self.bind_cart = ReactiveBinding(
            store=store,
            selector=lambda s: sum(i["price"] * i["qty"] for i in s["cart"]["items"]),
            target=lambda tot: self.cart_var.set(f"Total: \${tot:.2f}"),
            bridge=bridge
        )
`,
    kivy: `"""
Kivy Agnostic Binding Example
Uses KivyBridge with Clock.schedule_once for seamless canvas updates
"""
from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from pydux import create_store, ReactiveBinding
from pydux.adapters.kivy import KivyBridge

class KivyDashboardApp(App):
    def __init__(self, store, **kwargs):
        super().__init__(**kwargs)
        self.store = store

    def build(self):
        layout = BoxLayout(orientation="vertical", padding=20, spacing=10)
        self.lbl_user = Label(text="Operator: ...", font_size="18sp")
        self.lbl_cart = Label(text="Total: ...", font_size="16sp")
        layout.add_widget(self.lbl_user)
        layout.add_widget(self.lbl_cart)

        # Thread-safe Kivy Binding on Clock loop
        bridge = KivyBridge()
        self.bind_user = ReactiveBinding(
            store=self.store,
            selector=lambda s: s["user"]["name"],
            target=lambda name: setattr(self.lbl_user, "text", f"Operator: {name}"),
            bridge=bridge
        )
        return layout
`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[selectedToolkit]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Monitor className="w-4 h-4" />
              <span>Multi-Toolkit UI Agnostic Architecture</span>
              <span>·</span>
              <span className="text-slate-400">Qyro / PySide6 / PyQt5 / Tkinter / Kivy</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Agnostic Reactive Binding Protocol
            </h2>
            <p className="text-sm text-slate-300 max-w-3xl">
              Desktop GUI toolkits have strict thread affinity (GUI updates must occur on the main thread).
              PyDux 3.0 separates state logic from UI toolkits via the <code className="text-cyan-300 font-mono text-xs">MainThreadBridge</code> protocol,
              allowing the exact same store to feed Qyro, PySide6, PyQt5, Tkinter, and Kivy without modifying your reducers.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://github.com/Neuri-AI/qyro"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors"
            >
              <span>Qyro Repository</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Toolkit selector tabs */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-2">
          {(['qyro', 'qt', 'tkinter', 'kivy'] as const).map((tk) => {
            const labels = {
              qyro: 'Qyro Component (Recommended)',
              qt: 'PySide6 / PyQt5 / PyQt6',
              tkinter: 'Tkinter (Standard Python)',
              kivy: 'Kivy (Multi-touch / OpenGL)',
            };
            return (
              <button
                key={tk}
                onClick={() => setSelectedToolkit(tk)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors cursor-pointer ${
                  selectedToolkit === tk
                    ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {labels[tk]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Side-by-side: Simulated Desktop App Window & Code */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Simulated Desktop Window (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden shadow-lg">
            {/* Desktop Window Title Bar */}
            <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {selectedToolkit === 'qyro'
                  ? 'Qyro Application [Protected Resources]'
                  : selectedToolkit === 'qt'
                  ? 'PySide6 MainWindow'
                  : selectedToolkit === 'tkinter'
                  ? 'Tkinter Root Window'
                  : 'Kivy Window'}
              </span>
              <div className="w-10"></div>
            </div>

            {/* Window Content */}
            <div className="p-5 space-y-4 bg-slate-900/60 min-h-[360px] flex flex-col justify-between">
              <div className="space-y-4">
                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400 font-mono">OPERATOR PROFILE</div>
                    <div className="text-sm font-bold text-white mt-0.5">{state.user.name}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono border border-cyan-800">
                    {state.user.role}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
                  <div className="text-[11px] text-slate-400 font-mono">CART SUBSYSTEM (MEMOIZED)</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">Items: {cartMetrics.itemCount} units</span>
                    <span className="text-emerald-400 font-mono font-bold text-sm">
                      ${cartMetrics.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">System Theme &amp; Density:</span>
                  <span className="font-mono text-purple-300 uppercase">
                    {state.ui.theme} / {state.ui.density}
                  </span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Unread Alert Queue:</span>
                  <span className="font-mono text-yellow-400 font-bold">
                    {unreadCount} pending
                  </span>
                </div>
              </div>

              {/* Status footer inside desktop window */}
              <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
                <span>Adapter: {selectedToolkit.toUpperCase()}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>MainThread Safe</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-slate-300">Thread-Safe Synchronizer</div>
            <p>
              Desktop toolkits will crash with segmentation faults if a background thread touches GUI widgets.
              PyDux 3.0's <code className="text-cyan-300 font-mono">ReactiveBinding</code> automatically detects the framework bridge and schedules mutations through the event loop.
            </p>
          </div>
        </div>

        {/* Right Column: Code viewer for this framework (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>Implementation Code for {selectedToolkit.toUpperCase()}</span>
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <pre className="flex-1 font-mono text-xs text-slate-200 bg-slate-950 p-4 overflow-y-auto max-h-[460px] leading-relaxed border-t border-slate-900">
            {codeSnippets[selectedToolkit]}
          </pre>
        </div>
      </div>
    </div>
  );
};
