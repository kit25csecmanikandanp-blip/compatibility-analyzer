/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AnalysisRecord } from '../types/api';
import { computeSideBySideDiff, DiffLine } from '../lib/analyzer/textDiff';
import { 
  ArrowLeft, 
  Search, 
  ChevronUp, 
  ChevronDown, 
  Maximize2, 
  Layers, 
  FileCode,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface SideBySideDiffProps {
  record: AnalysisRecord;
  onBack: () => void;
}

export const SideBySideDiff: React.FC<SideBySideDiffProps> = ({
  record,
  onBack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'changes-only'>('all');

  // Compute diff lines
  const diffLines = useMemo(() => {
    return computeSideBySideDiff(record.v1SpecRaw, record.v2SpecRaw);
  }, [record.v1SpecRaw, record.v2SpecRaw]);

  // Filtered diff lines
  const filteredLines = useMemo(() => {
    return diffLines.filter(line => {
      if (filterType === 'changes-only' && line.type === 'unchanged') {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const olderMatch = line.contentOlder?.toLowerCase().includes(q);
      const newerMatch = line.contentNewer?.toLowerCase().includes(q);
      return olderMatch || newerMatch;
    });
  }, [diffLines, filterType, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    let added = 0;
    let removed = 0;
    let modified = 0;
    let unchanged = 0;
    diffLines.forEach(l => {
      if (l.type === 'added') added++;
      else if (l.type === 'removed') removed++;
      else if (l.type === 'modified') modified++;
      else unchanged++;
    });
    return { added, removed, modified, unchanged, totalChanges: added + removed + modified };
  }, [diffLines]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Header */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-purple-50 text-[#6C4DFF] hover:bg-purple-100 transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Side-by-Side Specification Diff
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comparing <span className="font-semibold text-slate-700">{record.v1Name}</span> vs{' '}
              <span className="font-semibold text-slate-700">{record.v2Name}</span>
            </p>
          </div>
        </div>

        {/* Change stats pills */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-700">
            - {stats.removed} Removed
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800">
            ~ {stats.modified} Modified
          </span>
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">
            + {stats.added} Added
          </span>
          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600">
            {stats.unchanged} Unchanged
          </span>
        </div>
      </div>

      {/* Diff Controls & Search Bar */}
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within spec lines..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 focus:border-[#6C4DFF] focus:ring-2 focus:ring-purple-100 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setFilterType(filterType === 'all' ? 'changes-only' : 'all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              filterType === 'changes-only'
                ? 'bg-purple-100 text-[#6C4DFF] border-purple-200'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {filterType === 'changes-only' ? 'Showing Changes Only' : 'Show All Lines'}
          </button>
        </div>
      </div>

      {/* Diff Columns Header */}
      <div className="bg-white rounded-t-3xl border-t border-x border-purple-100 overflow-hidden shadow-xs">
        <div className="grid grid-cols-2 bg-slate-100/90 border-b border-slate-200 text-xs font-bold text-slate-700 divide-x divide-slate-200">
          <div className="p-3.5 flex items-center justify-between">
            <span>Older Version: {record.v1Name}</span>
            <span className="text-[11px] text-slate-500 font-mono">baseline</span>
          </div>
          <div className="p-3.5 flex items-center justify-between">
            <span>Newer Version: {record.v2Name}</span>
            <span className="text-[11px] text-slate-500 font-mono">target</span>
          </div>
        </div>

        {/* Diff Content Viewport */}
        <div className="font-mono text-xs overflow-x-auto max-h-[700px] divide-y divide-slate-100">
          {filteredLines.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              No matching diff lines found for query "{searchQuery}".
            </div>
          ) : (
            filteredLines.map((line, idx) => {
              let bgLeft = 'bg-white';
              let bgRight = 'bg-white';
              let indicatorLeft = ' ';
              let indicatorRight = ' ';

              if (line.type === 'removed') {
                bgLeft = 'bg-red-50 text-red-900 font-medium';
                bgRight = 'bg-slate-50/50 text-slate-300';
                indicatorLeft = '-';
              } else if (line.type === 'added') {
                bgLeft = 'bg-slate-50/50 text-slate-300';
                bgRight = 'bg-green-50 text-green-900 font-medium';
                indicatorRight = '+';
              } else if (line.type === 'modified') {
                bgLeft = 'bg-amber-50/80 text-amber-900';
                bgRight = 'bg-amber-50/80 text-amber-900 font-medium';
                indicatorLeft = '~';
                indicatorRight = '~';
              }

              return (
                <div key={idx} className="grid grid-cols-2 divide-x divide-slate-200 hover:bg-purple-50/20 transition-colors">
                  {/* Left Column (Older) */}
                  <div className={`p-1.5 flex items-start gap-2 ${bgLeft} whitespace-pre-wrap break-all`}>
                    <span className="w-8 shrink-0 text-slate-400 select-none text-right pr-2">
                      {line.lineNumberOlder || ''}
                    </span>
                    <span className="w-3 shrink-0 select-none font-bold text-slate-400">
                      {indicatorLeft}
                    </span>
                    <span className="flex-1">
                      {line.contentOlder !== undefined ? line.contentOlder : ''}
                    </span>
                  </div>

                  {/* Right Column (Newer) */}
                  <div className={`p-1.5 flex items-start gap-2 ${bgRight} whitespace-pre-wrap break-all`}>
                    <span className="w-8 shrink-0 text-slate-400 select-none text-right pr-2">
                      {line.lineNumberNewer || ''}
                    </span>
                    <span className="w-3 shrink-0 select-none font-bold text-slate-400">
                      {indicatorRight}
                    </span>
                    <span className="flex-1">
                      {line.contentNewer !== undefined ? line.contentNewer : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
