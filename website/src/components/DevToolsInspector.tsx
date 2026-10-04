import React, { useState } from 'react';
import {
  Clock,
  RotateCcw,
  RotateCw,
  ChevronRight,
  Code,
  FileText,
  Download,
  Upload,
  Play,
  Pause,
  Layers,
  GitCommit,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { ActionTrace, AppState } from '../types/pydux';

interface Props {
  traces: ActionTrace[];
  currentIndex: number;
  currentState: AppState;
  onJumpToState: (index: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportJson: () => void;
}

export const DevToolsInspector: React.FC<Props> = ({
  traces,
  currentIndex,
  currentState,
  onJumpToState,
  onUndo,
  onRedo,
  onExportJson,
}) => {
  const [selectedTraceIndex, setSelectedTraceIndex] = useState<number>(
    currentIndex >= 0 ? currentIndex : traces.length - 1
  );
  const [activeView, setActiveView] = useState<'diff' | 'state' | 'action'>('diff');
  const [isPlaying, setIsPlaying] = useState(false);

  // Sync selected trace with current time-travel position
  const activeTrace = traces[selectedTraceIndex] || traces[traces.length - 1];

  const handlePlayReplay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }
    if (traces.length === 0) return;

    setIsPlaying(true);
    let step = 0;
    const interval = setInterval(() => {
      if (step < traces.length) {
        onJumpToState(step);
        setSelectedTraceIndex(step);
        step++;
      } else {
        clearInterval(interval);
        setIsPlaying(false);
      }
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* DevTools Header Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Clock className="w-3.5 h-3.5" />
              <span>PyDux State Tracking Addon</span>
              <span>·</span>
              <span className="text-slate-400">Time-Travel Engine & Diff Inspector</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              Action Timeline & State Mutator Inspector
            </h2>
          </div>

          {/* Time travel toolbar */}
          <div className="flex items-center gap-2">
            <button
              onClick={onUndo}
              disabled={currentIndex <= 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title="Undo state step"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>

            <button
              onClick={onRedo}
              disabled={currentIndex >= traces.length - 1}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors disabled:opacity-40 cursor-pointer"
              title="Redo state step"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Redo</span>
            </button>

            <button
              onClick={handlePlayReplay}
              disabled={traces.length === 0}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border transition-colors cursor-pointer disabled:opacity-40 ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-cyan-950 text-cyan-300 border-cyan-800 hover:bg-cyan-900'
              }`}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isPlaying ? 'Pause Replay' : 'Replay Trace'}</span>
            </button>

            <button
              onClick={onExportJson}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md border border-slate-700 transition-colors cursor-pointer"
              title="Export state history JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main DevTools Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[520px]">
        {/* Left Column: Action Timeline List (4 cols) */}
        <div className="lg:col-span-5 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Recorded Action History ({traces.length})
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              Active: #{currentIndex + 1}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 max-h-[500px]">
            {traces.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">
                No actions dispatched yet. Dispatch an action from the simulator!
              </div>
            ) : (
              traces.map((trace, idx) => {
                const isSelected = selectedTraceIndex === idx;
                const isCurrent = currentIndex === idx;

                return (
                  <div
                    key={trace.id}
                    onClick={() => {
                      setSelectedTraceIndex(idx);
                      onJumpToState(idx);
                    }}
                    className={`p-3 text-xs transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-l-2 border-cyan-400'
                        : isCurrent
                        ? 'bg-slate-800/40 border-l-2 border-slate-400'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-5 h-5 rounded flex items-center justify-center font-mono text-[10px] bg-slate-800 text-slate-400 shrink-0">
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <div className="font-mono font-semibold text-white truncate">
                          {trace.action.type}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">
                          {trace.changedPaths.length > 0 ? (
                            <span>{trace.changedPaths.slice(0, 2).join(', ')}</span>
                          ) : (
                            <span>No state change</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-[11px] text-slate-400 tabular-nums">
                        {trace.durationMs.toFixed(2)}ms
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJumpToState(idx);
                          setSelectedTraceIndex(idx);
                        }}
                        className={`text-[10px] px-1.5 py-0.5 rounded mt-0.5 font-medium transition-colors ${
                          isCurrent
                            ? 'bg-cyan-400 text-slate-950 font-semibold'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        {isCurrent ? 'Current' : 'Jump'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Inspector Details (Diff, State Tree, Action Raw) (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          {/* Sub-tabs */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveView('diff')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeView === 'diff'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                State Diff
              </button>
              <button
                onClick={() => setActiveView('state')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeView === 'state'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Full State Tree
              </button>
              <button
                onClick={() => setActiveView('action')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  activeView === 'action'
                    ? 'bg-slate-800 text-white font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Action Payload
              </button>
            </div>

            {activeTrace && (
              <span className="text-xs font-mono text-cyan-400">
                Action #{selectedTraceIndex + 1}: {activeTrace.action.type}
              </span>
            )}
          </div>

          {/* Inspector Body */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[460px] font-mono text-xs">
            {!activeTrace ? (
              <div className="p-8 text-center text-slate-400 font-sans text-sm">
                Select an action from the history list to inspect its mutations.
              </div>
            ) : activeView === 'diff' ? (
              <div className="space-y-3">
                <div className="text-xs font-sans text-slate-400 pb-2 border-b border-slate-800 flex items-center justify-between">
                  <span>Mutated Keys &amp; Values:</span>
                  <span className="text-cyan-400 font-mono">
                    {activeTrace.changedPaths.length} key mutations detected
                  </span>
                </div>

                {activeTrace.changedPaths.length === 0 ? (
                  <div className="p-4 text-slate-400 italic">
                    Identity action (state returned unmodified).
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {activeTrace.changedPaths.map((diff, i) => {
                      const isAdd = diff.startsWith('+');
                      const isDel = diff.startsWith('-');
                      const isMod = diff.startsWith('~');

                      return (
                        <div
                          key={i}
                          className={`p-2 rounded border font-mono ${
                            isAdd
                              ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-300'
                              : isDel
                              ? 'bg-rose-950/40 border-rose-800/80 text-rose-300'
                              : 'bg-cyan-950/40 border-cyan-800/80 text-cyan-300'
                          }`}
                        >
                          {diff}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : activeView === 'state' ? (
              <div>
                <div className="text-xs font-sans text-slate-400 pb-2 border-b border-slate-800 mb-3 flex items-center justify-between">
                  <span>Snapshot at Step #{selectedTraceIndex + 1}:</span>
                  <span className="text-slate-400 font-mono">JSON schema valid</span>
                </div>
                <pre className="text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                  {JSON.stringify(activeTrace.nextState, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <div className="text-xs font-sans text-slate-400 pb-2 border-b border-slate-800 mb-3">
                  Raw Action Object:
                </div>
                <pre className="text-slate-200 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto leading-relaxed">
                  {JSON.stringify(activeTrace.action, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
