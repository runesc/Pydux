import React, { useState } from 'react';
import {
  Folder,
  FileCode,
  Download,
  Copy,
  Check,
  Code2,
  FileText,
  Search,
  CheckCircle2,
} from 'lucide-react';
import { PYTHON_CODEBASE } from '../data/pythonCodebase';
import { PythonFileItem } from '../types/pydux';

interface Props {
  onDownloadZip: () => void;
}

export const CodeRepositoryViewer: React.FC<Props> = ({ onDownloadZip }) => {
  const [selectedFile, setSelectedFile] = useState<PythonFileItem>(PYTHON_CODEBASE[2]); // store.py default
  const [copied, setCopied] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFiles = PYTHON_CODEBASE.filter(
    (file) =>
      file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineCount = selectedFile.content.split('\n').length;
  const byteCount = new Blob([selectedFile.content]).size;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
              <Code2 className="w-4 h-4" />
              <span>Production Python Source Tree</span>
              <span>·</span>
              <span className="text-slate-400">Pure Python 3.10+ &amp; Clean Architecture</span>
            </div>
            <h2 className="text-xl font-bold text-white">
              PyDux 3.0 Package Repository
            </h2>
          </div>

          <button
            onClick={onDownloadZip}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-sm cursor-pointer whitespace-nowrap"
          >
            <Download className="w-4 h-4" />
            <span>Download Full Package (.zip)</span>
          </button>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Column: File Tree (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-slate-800 bg-slate-950/60">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files or modules..."
                className="w-full bg-slate-900 border border-slate-700 rounded-md pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 max-h-[500px]">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => setSelectedFile(file)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start gap-2.5 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80 font-medium'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white border border-transparent'
                  }`}
                >
                  <FileCode className={`w-4 h-4 shrink-0 mt-0.5 ${isSelected ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <div className="min-w-0">
                    <div className="font-mono truncate">{file.path}</div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5 font-sans">
                      {file.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Code Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/90 rounded-xl border border-slate-800 flex flex-col overflow-hidden">
          {/* File Header */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 min-w-0">
              <FileCode className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-mono text-xs font-semibold text-white truncate">
                {selectedFile.path}
              </span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                ({lineCount} lines · {(byteCount / 1024).toFixed(1)} KB)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Code Box with Line Numbers */}
          <div className="flex-1 bg-slate-950 p-4 overflow-y-auto max-h-[500px] font-mono text-xs leading-relaxed flex">
            {/* Line numbers gutter */}
            <div className="select-none text-slate-600 text-right pr-4 border-r border-slate-800 mr-4 font-mono">
              {selectedFile.content.split('\n').map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code text */}
            <pre className="text-slate-200 overflow-x-auto flex-1 whitespace-pre">
              {selectedFile.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
