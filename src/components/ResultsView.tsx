/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AnalysisRecord, ApiFinding, SeverityLevel, ChangeCategory, AiExplanation } from '../types/api';
import { generatePdfReport, downloadJsonReport } from '../lib/reports/pdfGenerator';
import { saveAnalysis } from '../lib/history/historyStore';
import { 
  GitCompare, 
  Download, 
  FileText, 
  Sparkles, 
  Search, 
  Filter, 
  ArrowUpDown, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Info, 
  FileCode, 
  Layers, 
  Check, 
  Bookmark,
  ChevronRight,
  ExternalLink,
  Code
} from 'lucide-react';

interface ResultsViewProps {
  record: AnalysisRecord;
  currentUser: { id: string; name: string } | null;
  onOpenDiff: () => void;
  onOpenAIPlaybook: (finding: ApiFinding) => void;
  onStartNewAnalysis: () => void;
  onOpenAuth: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  record,
  currentUser,
  onOpenDiff,
  onOpenAIPlaybook,
  onStartNewAnalysis,
  onOpenAuth,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'severity-desc' | 'path-asc' | 'category'>('severity-desc');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Filter findings
  const filteredFindings = useMemo(() => {
    let list = [...record.findings];

    if (severityFilter !== 'ALL') {
      list = list.filter(f => f.severity === severityFilter);
    }

    if (methodFilter !== 'ALL') {
      list = list.filter(f => f.method === methodFilter);
    }

    if (categoryFilter !== 'ALL') {
      list = list.filter(f => f.category === categoryFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(f => 
        f.path.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        (f.method && f.method.toLowerCase().includes(q))
      );
    }

    // Sort
    if (sortBy === 'severity-desc') {
      const rank: Record<SeverityLevel, number> = {
        BREAKING: 4,
        POTENTIALLY_BREAKING: 3,
        NON_BREAKING: 2,
        INFORMATIONAL: 1
      };
      list.sort((a, b) => rank[b.severity] - rank[a.severity]);
    } else if (sortBy === 'path-asc') {
      list.sort((a, b) => a.path.localeCompare(b.path));
    } else if (sortBy === 'category') {
      list.sort((a, b) => a.category.localeCompare(b.category));
    }

    return list;
  }, [record.findings, severityFilter, methodFilter, categoryFilter, searchQuery, sortBy]);

  // Extract unique methods and categories for filter dropdowns
  const availableMethods = useMemo(() => {
    const set = new Set<string>();
    record.findings.forEach(f => {
      if (f.method) set.add(f.method);
    });
    return Array.from(set).sort();
  }, [record.findings]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    record.findings.forEach(f => {
      set.add(f.category);
    });
    return Array.from(set).sort();
  }, [record.findings]);

  const handleSaveToHistory = () => {
    if (!currentUser) {
      onOpenAuth();
      return;
    }
    const toSave: AnalysisRecord = {
      ...record,
      userId: currentUser.id
    };
    saveAnalysis(toSave);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-[#10B981] bg-emerald-50 border-emerald-200';
    if (score >= 70) return 'text-[#3685FF] bg-blue-50 border-blue-200';
    if (score >= 45) return 'text-[#F59E0B] bg-amber-50 border-amber-200';
    return 'text-[#EF4444] bg-red-50 border-red-200';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPATIBLE':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Fully Compatible
          </span>
        );
      case 'WARNING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Minor Incompatibilities
          </span>
        );
      case 'BREAKING_DETECTED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Breaking Changes Detected
          </span>
        );
      case 'CRITICAL':
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5" /> Critical Contract Incompatibility
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Action & Version Overview Bar */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            {getStatusBadge(record.summary.status)}
            <span className="text-xs text-slate-500">
              Evaluated {new Date(record.createdAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Compatibility Audit Results
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Comparing Baseline <span className="font-bold text-slate-800">{record.v1Name}</span> against Target <span className="font-bold text-slate-800">{record.v2Name}</span>
          </p>
        </div>

        {/* Global Action CTAs */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenDiff}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-purple-50 hover:bg-purple-100/70 border border-purple-200 transition-colors flex items-center gap-1.5"
          >
            <Layers className="w-4 h-4 text-[#6C4DFF]" />
            Side-by-Side Diff
          </button>

          <button
            onClick={() => generatePdfReport(record)}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Download PDF
          </button>

          <button
            onClick={() => downloadJsonReport(record)}
            className="px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors flex items-center gap-1.5"
            title="Download JSON export"
          >
            <Code className="w-4 h-4 text-slate-600" />
            JSON
          </button>

          <button
            onClick={handleSaveToHistory}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
              savedSuccess
                ? 'bg-green-100 text-green-800'
                : 'bg-white hover:bg-purple-50 text-[#6C4DFF] border border-purple-200'
            }`}
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-green-600" />
                Saved to History
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                Save Audit
              </>
            )}
          </button>
        </div>
      </div>

      {/* Score and Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {/* Score Card (Col span 2) */}
        <div className="md:col-span-2 bg-white rounded-3xl border border-purple-100 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Overall Health Index
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">Compatibility Score</h3>
            </div>
            <div className={`px-4 py-2 rounded-2xl border font-extrabold text-2xl ${getScoreColor(record.summary.overallScore)}`}>
              {record.summary.overallScore} <span className="text-xs text-slate-400 font-normal">/ 100</span>
            </div>
          </div>

          <div className="space-y-2 mt-4 pt-4 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Standard Base:</span>
              <span className="font-semibold text-slate-800">100 pts</span>
            </div>
            <div className="flex justify-between text-red-600">
              <span>Breaking Deductions ({record.summary.totalBreaking} × 15):</span>
              <span className="font-semibold">-{record.summary.deductionBreakdown.breakingDeductions} pts</span>
            </div>
            <div className="flex justify-between text-amber-600">
              <span>Potential Deductions ({record.summary.totalPotentiallyBreaking} × 5):</span>
              <span className="font-semibold">-{record.summary.deductionBreakdown.potentialDeductions} pts</span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Informational Deductions ({record.summary.totalInformational} × 1):</span>
              <span className="font-semibold">-{record.summary.deductionBreakdown.infoDeductions} pts</span>
            </div>
          </div>
        </div>

        {/* Severity Metrics (Col span 3) */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Breaking */}
          <div className="bg-white rounded-3xl border border-red-100 p-5 shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-2">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-red-600">{record.summary.totalBreaking}</p>
              <p className="text-xs font-bold text-slate-700 mt-1">Breaking</p>
              <p className="text-[11px] text-slate-500">Will break clients</p>
            </div>
          </div>

          {/* Potentially Breaking */}
          <div className="bg-white rounded-3xl border border-amber-100 p-5 shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-amber-700">{record.summary.totalPotentiallyBreaking}</p>
              <p className="text-xs font-bold text-slate-700 mt-1">Potential</p>
              <p className="text-[11px] text-slate-500">Conditional risk</p>
            </div>
          </div>

          {/* Compatible */}
          <div className="bg-white rounded-3xl border border-green-100 p-5 shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-green-600">{record.summary.totalNonBreaking}</p>
              <p className="text-xs font-bold text-slate-700 mt-1">Compatible</p>
              <p className="text-[11px] text-slate-500">Safe additions</p>
            </div>
          </div>

          {/* Informational */}
          <div className="bg-white rounded-3xl border border-blue-100 p-5 shadow-xs flex flex-col justify-between">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-blue-600">{record.summary.totalInformational}</p>
              <p className="text-xs font-bold text-slate-700 mt-1">Informational</p>
              <p className="text-[11px] text-slate-500">Spec differences</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by path, title, or keyword..."
              className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 focus:border-[#6C4DFF] focus:ring-2 focus:ring-purple-100 outline-none"
            />
          </div>

          {/* Quick Severity Pill Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {['ALL', 'BREAKING', 'POTENTIALLY_BREAKING', 'NON_BREAKING', 'INFORMATIONAL'].map(sev => {
              const label = sev === 'ALL' ? 'All Findings' : sev.replace('_', ' ');
              const active = severityFilter === sev;
              return (
                <button
                  key={sev}
                  onClick={() => setSeverityFilter(sev)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                    active
                      ? 'bg-[#6C4DFF] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filters: Method, Category, Sorting */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Method Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500">Method:</span>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">All Methods</option>
              {availableMethods.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-500">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-slate-700 bg-white max-w-[220px] truncate"
            >
              <option value="ALL">All Categories</option>
              {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1 rounded-lg border border-slate-200 font-semibold text-slate-700 bg-white"
            >
              <option value="severity-desc">Severity (High to Low)</option>
              <option value="path-asc">Path (A-Z)</option>
              <option value="category">Category</option>
            </select>
          </div>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-extrabold text-lg text-slate-900">
            Detected Differences ({filteredFindings.length})
          </h3>
          <span className="text-xs text-slate-500">
            Click 'AI Deep Dive' on any card for remediation playbooks
          </span>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center text-slate-500 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
            <p className="font-bold text-slate-800">No matching contract differences found.</p>
            <p className="text-xs">Adjust your search query or filter tags to reveal items.</p>
          </div>
        ) : (
          filteredFindings.map((finding) => {
            const isBreaking = finding.severity === 'BREAKING';
            const isPotential = finding.severity === 'POTENTIALLY_BREAKING';
            const isNonBreaking = finding.severity === 'NON_BREAKING';

            let badgeBg = 'bg-blue-100 text-blue-700 border-blue-200';
            if (isBreaking) badgeBg = 'bg-red-100 text-red-700 border-red-200';
            else if (isPotential) badgeBg = 'bg-amber-100 text-amber-800 border-amber-200';
            else if (isNonBreaking) badgeBg = 'bg-green-100 text-green-700 border-green-200';

            return (
              <div
                key={finding.id}
                className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs hover:shadow-md transition-shadow space-y-4"
              >
                {/* Header: Badges & Path */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Severity Badge */}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${badgeBg}`}>
                      {finding.severity.replace('_', ' ')}
                    </span>

                    {/* Method Tag */}
                    {finding.method && (
                      <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800">
                        {finding.method}
                      </span>
                    )}

                    {/* Path */}
                    <span className="font-mono text-xs sm:text-sm font-bold text-slate-900">
                      {finding.path}
                    </span>

                    {/* Category Label */}
                    <span className="text-[11px] font-semibold text-slate-500 px-2 py-0.5 bg-slate-50 rounded-md">
                      {finding.category}
                    </span>
                  </div>

                  {/* AI Button CTA */}
                  <button
                    onClick={() => onOpenAIPlaybook(finding)}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#6C4DFF] to-[#3685FF] hover:opacity-95 shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
                    AI Deep Dive
                  </button>
                </div>

                {/* Finding Title & Description */}
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {finding.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {finding.description}
                  </p>
                </div>

                {/* Values Comparison Strip */}
                {(finding.olderValue || finding.newerValue) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-[#F7F5FF] p-3.5 rounded-2xl border border-purple-50 text-xs font-mono">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Older Baseline ({record.v1Name})
                      </span>
                      <span className="text-slate-700 bg-white px-2 py-1 rounded-md border border-purple-100 block truncate">
                        {finding.olderValue || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Newer Target ({record.v2Name})
                      </span>
                      <span className="text-slate-900 bg-white px-2 py-1 rounded-md border border-purple-100 font-semibold block truncate">
                        {finding.newerValue || 'N/A'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Impact & Recommended Solution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-red-50/50 border border-red-100">
                    <span className="font-bold text-red-700 block mb-0.5">Potential Impact:</span>
                    <p className="text-slate-700 leading-relaxed">{finding.impact}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-green-50/50 border border-green-100">
                    <span className="font-bold text-green-700 block mb-0.5">Recommended Remediation:</span>
                    <p className="text-slate-700 leading-relaxed">{finding.recommendation}</p>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
