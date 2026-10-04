import React from 'react';
import { Download, Zap, RefreshCw, Rocket, BookOpen } from 'lucide-react';

export type ActiveTab =
  | 'quickstart'
  | 'docs'
  | 'simulator'
  | 'devtools'
  | 'selectors'
  | 'frameworks'
  | 'code'
  | 'architecture';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onDownloadZip: () => void;
  onRunStressTest: () => void;
  isStressTesting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onDownloadZip,
  onRunStressTest,
  isStressTesting,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-mono font-bold text-sm shadow-sm">
            Px
          </div>
          <button
            onClick={() => setActiveTab('quickstart')}
            className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors cursor-pointer text-left"
          >
            PyDux 3.0
          </button>
        </div>

        {/* Zone 2: Clean text navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-300">
          <button
            onClick={() => setActiveTab('quickstart')}
            className={`transition-colors cursor-pointer pb-0.5 flex items-center gap-1.5 ${
              activeTab === 'quickstart'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>QuickStart 101</span>
          </button>
          <button
            onClick={() => setActiveTab('docs')}
            className={`transition-colors cursor-pointer pb-0.5 flex items-center gap-1.5 ${
              activeTab === 'docs'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>API Docs</span>
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'simulator'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Render Simulator
          </button>
          <button
            onClick={() => setActiveTab('devtools')}
            className={`transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'devtools'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Time-Travel DevTools
          </button>
          <button
            onClick={() => setActiveTab('selectors')}
            className={`transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'selectors'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Selectors
          </button>
          <button
            onClick={() => setActiveTab('frameworks')}
            className={`transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'frameworks'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Qyro &amp; Toolkits
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'code'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Source Tree
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`transition-colors cursor-pointer pb-0.5 ${
              activeTab === 'architecture'
                ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                : 'hover:text-white'
            }`}
          >
            Whitepaper
          </button>
        </nav>

        {/* Zone 3: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRunStressTest}
            disabled={isStressTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-300 bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800/80 rounded-lg transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
            title="Dispatch 25 rapid updates to see the 75%+ render reduction"
          >
            {isStressTesting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span className="hidden sm:inline">Stress Test</span>
          </button>

          <button
            onClick={onDownloadZip}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors whitespace-nowrap shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .zip</span>
          </button>
        </div>
      </div>

      {/* Mobile Nav Drawer */}
      <div className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 bg-slate-950 border-t border-slate-800 text-xs">
        {[
          { id: 'quickstart', label: 'QuickStart 101' },
          { id: 'docs', label: 'API Docs' },
          { id: 'simulator', label: 'Simulator' },
          { id: 'devtools', label: 'DevTools' },
          { id: 'selectors', label: 'Selectors' },
          { id: 'frameworks', label: 'Qyro / UI' },
          { id: 'code', label: 'Code' },
          { id: 'architecture', label: 'Whitepaper' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as ActiveTab)}
            className={`px-3 py-1 rounded-md whitespace-nowrap ${
              activeTab === item.id
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </header>
  );
};
