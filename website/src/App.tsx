import React, { useState, useCallback } from 'react';
import JSZip from 'jszip';
import { Header, ActiveTab } from './components/Header';
import { QuickStartGuide } from './components/QuickStartGuide';
import { DocumentationView } from './components/DocumentationView';
import { HeadToHeadSimulator } from './components/HeadToHeadSimulator';
import { DevToolsInspector } from './components/DevToolsInspector';
import { SelectorPlayground } from './components/SelectorPlayground';
import { QyroFrameworkMatrix } from './components/QyroFrameworkMatrix';
import { CodeRepositoryViewer } from './components/CodeRepositoryViewer';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { INITIAL_STATE, appReducer, computeStateDiff } from './core/pyduxSimulator';
import { PYTHON_CODEBASE } from './data/pythonCodebase';
import { AppState, Action, ActionTrace, ComponentRenderStats } from './types/pydux';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('quickstart');

  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [lastDispatchedAction, setLastDispatchedAction] = useState<Action | null>(null);

  // Time-travel history traces
  const [traces, setTraces] = useState<ActionTrace[]>([]);
  const [currentTraceIndex, setCurrentTraceIndex] = useState<number>(-1);

  // Recomputation & Cache metrics for memoized selectors
  const [recomputationCount, setRecomputationCount] = useState<number>(1);
  const [cacheHitCount, setCacheHitCount] = useState<number>(0);

  // Stress test running state
  const [isStressTesting, setIsStressTesting] = useState(false);

  // Legacy Pydux 2.0 vs Pydux 3.0 render statistics
  const [legacyStats, setLegacyStats] = useState<Record<string, ComponentRenderStats>>({
    user: { legacyRenders: 1, v3Renders: 1, lastRenderTimestamp: null, lastChangedSlice: 'user' },
    cart: { legacyRenders: 1, v3Renders: 1, lastRenderTimestamp: null, lastChangedSlice: 'cart' },
    ui: { legacyRenders: 1, v3Renders: 1, lastRenderTimestamp: null, lastChangedSlice: 'ui' },
    notifications: { legacyRenders: 1, v3Renders: 1, lastRenderTimestamp: null, lastChangedSlice: 'notifications' },
  });

  const [v3Stats, setV3Stats] = useState<Record<string, ComponentRenderStats>>({
    user: { legacyRenders: 1, v3Renders: 1, lastRenderTimestamp: null, lastChangedSlice: 'user' },
    cart: { legacyRenders: 1, v3Renders: 1, lastRenderTimestamp: null, lastChangedSlice: 'cart' },
    ui: { legacyRenders: 1, v3Renders: 1, lastRenderTimestamp: null, lastChangedSlice: 'ui' },
    notifications: { legacyRenders: 1, v3Renders: 1, lastRenderTimestamp: null, lastChangedSlice: 'notifications' },
  });

  // Central Dispatcher that calculates side-by-side metrics
  const dispatch = useCallback((action: Action) => {
    const t0 = performance.now();

    setState((prevState) => {
      const nextState = appReducer(prevState, action);
      const durationMs = performance.now() - t0;
      const diffs = computeStateDiff(prevState, nextState);

      // Determine which component slices actually changed
      const userChanged = prevState.user.name !== nextState.user.name || prevState.user.role !== nextState.user.role;
      const cartChanged = prevState.cart.items !== nextState.cart.items || prevState.cart.couponApplied !== nextState.cart.couponApplied;
      const uiChanged = prevState.ui.theme !== nextState.ui.theme || prevState.ui.density !== nextState.ui.density;
      const notificationsChanged = prevState.notifications.items !== nextState.notifications.items;

      // Update selector memoization statistics
      if (cartChanged) {
        setRecomputationCount((c) => c + 1);
      } else {
        setCacheHitCount((h) => h + 1);
      }

      // Pydux 2.0 Legacy: ALWAYS increments EVERY component's render count
      setLegacyStats((prev) => ({
        user: { ...prev.user, legacyRenders: prev.user.legacyRenders + 1 },
        cart: { ...prev.cart, legacyRenders: prev.cart.legacyRenders + 1 },
        ui: { ...prev.ui, legacyRenders: prev.ui.legacyRenders + 1 },
        notifications: { ...prev.notifications, legacyRenders: prev.notifications.legacyRenders + 1 },
      }));

      // Pydux 3.0 Clean Selectors: ONLY increments the targeted component's render count
      setV3Stats((prev) => ({
        user: { ...prev.user, v3Renders: userChanged ? prev.user.v3Renders + 1 : prev.user.v3Renders },
        cart: { ...prev.cart, v3Renders: cartChanged ? prev.cart.v3Renders + 1 : prev.cart.v3Renders },
        ui: { ...prev.ui, v3Renders: uiChanged ? prev.ui.v3Renders + 1 : prev.ui.v3Renders },
        notifications: {
          ...prev.notifications,
          v3Renders: notificationsChanged ? prev.notifications.v3Renders + 1 : prev.notifications.v3Renders,
        },
      }));

      // Record DevTools trace if not internal time travel
      if (action.type !== '@@PYDUX/TIME_TRAVEL') {
        setTraces((prevTraces) => {
          const newTrace: ActionTrace = {
            id: `trace-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            index: prevTraces.length,
            action,
            prevState,
            nextState,
            timestamp: Date.now(),
            durationMs,
            changedPaths: diffs,
          };
          const updated = [...prevTraces, newTrace];
          setCurrentTraceIndex(updated.length - 1);
          return updated;
        });
      }

      return nextState;
    });

    setLastDispatchedAction(action);
  }, []);

  // Time-travel scrubber actions
  const handleJumpToState = useCallback(
    (index: number) => {
      if (index >= 0 && index < traces.length) {
        setCurrentTraceIndex(index);
        const targetState = traces[index].nextState;
        dispatch({ type: '@@PYDUX/TIME_TRAVEL', payload: targetState });
      }
    },
    [traces, dispatch]
  );

  const handleUndo = useCallback(() => {
    if (currentTraceIndex > 0) {
      handleJumpToState(currentTraceIndex - 1);
    }
  }, [currentTraceIndex, handleJumpToState]);

  const handleRedo = useCallback(() => {
    if (currentTraceIndex < traces.length - 1) {
      handleJumpToState(currentTraceIndex + 1);
    }
  }, [currentTraceIndex, traces.length, handleJumpToState]);

  const handleResetStats = useCallback(() => {
    setLegacyStats({
      user: { legacyRenders: 0, v3Renders: 0, lastRenderTimestamp: null, lastChangedSlice: 'user' },
      cart: { legacyRenders: 0, v3Renders: 0, lastRenderTimestamp: null, lastChangedSlice: 'cart' },
      ui: { legacyRenders: 0, v3Renders: 0, lastRenderTimestamp: null, lastChangedSlice: 'ui' },
      notifications: { legacyRenders: 0, v3Renders: 0, lastRenderTimestamp: null, lastChangedSlice: 'notifications' },
    });
    setV3Stats({
      user: { legacyRenders: 0, v3Renders: 0, lastRenderTimestamp: null, lastChangedSlice: 'user' },
      cart: { legacyRenders: 0, v3Renders: 0, lastRenderTimestamp: null, lastChangedSlice: 'cart' },
      ui: { legacyRenders: 0, v3Renders: 0, lastRenderTimestamp: null, lastChangedSlice: 'ui' },
      notifications: { legacyRenders: 0, v3Renders: 0, lastRenderTimestamp: null, lastChangedSlice: 'notifications' },
    });
    setRecomputationCount(0);
    setCacheHitCount(0);
  }, []);

  // Benchmark Stress Runner: dispatches 20 rapid updates
  const handleRunStressTest = useCallback(() => {
    if (isStressTesting) return;
    setIsStressTesting(true);

    let count = 0;
    const items = [
      'Precision Servo Pack',
      'Optical Tachometer',
      'CAN-Bus Transceiver',
      'Hall Effect Sensor',
      'DC Gearmotor 12V',
    ];

    const interval = setInterval(() => {
      if (count < 20) {
        const item = items[count % items.length];
        dispatch({
          type: 'CART/ADD_ITEM',
          payload: {
            id: `item-batch-${Date.now()}-${count}`,
            name: `${item} #${count + 1}`,
            price: Math.floor(Math.random() * 80 + 20),
            qty: 1,
          },
        });
        count++;
      } else {
        clearInterval(interval);
        setIsStressTesting(false);
      }
    }, 60);
  }, [isStressTesting, dispatch]);

  // Export DevTools traces as JSON file
  const handleExportJson = useCallback(() => {
    const exportData = {
      app: 'PyDux 3.0 DevTools Trace Session',
      exportedAt: new Date().toISOString(),
      tracesCount: traces.length,
      traces: traces.map((t) => ({
        index: t.index,
        action: t.action,
        timestamp: t.timestamp,
        durationMs: t.durationMs,
        changedPaths: t.changedPaths,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pydux-trace-session-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [traces]);

  // Download entire PyDux 3.0 Python codebase as a clean zip package
  const handleDownloadZip = useCallback(async () => {
    const zip = new JSZip();

    // Add all python files
    for (const file of PYTHON_CODEBASE) {
      zip.file(file.path, file.content);
    }

    // Add setup.py and pyproject.toml
    zip.file(
      'setup.py',
      `from setuptools import setup, find_packages

setup(
    name="pydux",
    version="3.0.0",
    description="UI-Agnostic State Management for Python Desktop Apps (Qyro, PySide6, PyQt5, Tkinter, Kivy)",
    author="PyDux Team",
    packages=find_packages(),
    python_requires=">=3.10",
    classifiers=[
        "Programming Language :: Python :: 3",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
    ],
)
`
    );

    zip.file(
      'pyproject.toml',
      `[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "pydux"
version = "3.0.0"
description = "UI-Agnostic State Management with Memoized Selectors for Python Desktop Applications"
readme = "README.md"
requires-python = ">=3.10"
dependencies = []
`
    );

    const content = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pydux-3.0.0-clean-architecture.zip';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDownloadZip={handleDownloadZip}
        onRunStressTest={handleRunStressTest}
        isStressTesting={isStressTesting}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8 w-full">
        {activeTab === 'quickstart' && (
          <QuickStartGuide
            onDispatch={dispatch}
            onNavigateTab={(tab) => setActiveTab(tab as ActiveTab)}
          />
        )}

        {activeTab === 'docs' && <DocumentationView />}

        {activeTab === 'simulator' && (
          <HeadToHeadSimulator
            state={state}
            onDispatch={dispatch}
            legacyStats={legacyStats}
            v3Stats={v3Stats}
            lastDispatchedAction={lastDispatchedAction}
            onResetStats={handleResetStats}
            onRunStressTest={handleRunStressTest}
            isStressTesting={isStressTesting}
          />
        )}

        {activeTab === 'devtools' && (
          <DevToolsInspector
            traces={traces}
            currentIndex={currentTraceIndex}
            currentState={state}
            onJumpToState={handleJumpToState}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onExportJson={handleExportJson}
          />
        )}

        {activeTab === 'selectors' && (
          <SelectorPlayground
            state={state}
            onDispatch={dispatch}
            recomputationCount={recomputationCount}
            cacheHitCount={cacheHitCount}
          />
        )}

        {activeTab === 'frameworks' && <QyroFrameworkMatrix state={state} />}

        {activeTab === 'code' && <CodeRepositoryViewer onDownloadZip={handleDownloadZip} />}

        {activeTab === 'architecture' && <ArchitectureGuide />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">PyDux 3.0 Architecture</span>
            <span aria-hidden="true">·</span>
            <span>Agnostic state container for Qyro, PySide6, PyQt5, Tkinter, and Kivy</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setActiveTab('quickstart')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              QuickStart 101
            </button>
            <button
              onClick={() => setActiveTab('docs')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              API Reference
            </button>
            <button
              onClick={() => setActiveTab('simulator')}
              className="hover:text-slate-200 transition-colors cursor-pointer"
            >
              Simulator
            </button>
            <button
              onClick={handleDownloadZip}
              className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              Download Package (.zip)
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
