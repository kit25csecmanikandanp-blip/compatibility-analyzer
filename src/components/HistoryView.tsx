/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { AnalysisRecord, UserProfile } from '../types/api';
import { getAnalysesForUser, deleteAnalysis } from '../lib/history/historyStore';
import { generatePdfReport } from '../lib/reports/pdfGenerator';
import { 
  History, 
  Search, 
  Trash2, 
  ExternalLink, 
  Download, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Calendar, 
  Layers, 
  ChevronRight,
  AlertCircle
} from 'lucide-react';

interface HistoryViewProps {
  currentUser: UserProfile;
  onOpenRecord: (record: AnalysisRecord) => void;
  onStartAnalysis: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  currentUser,
  onOpenRecord,
  onStartAnalysis,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [deleteCandidate, setDeleteCandidate] = useState<AnalysisRecord | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const analyses = useMemo(() => {
    return getAnalysesForUser(currentUser.id);
  }, [currentUser.id, reloadTrigger]);

  const filteredAnalyses = useMemo(() => {
    return analyses.filter(a => {
      if (statusFilter !== 'ALL' && a.summary.status !== statusFilter) {
        return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        a.v1Name.toLowerCase().includes(q) ||
        a.v2Name.toLowerCase().includes(q) ||
        a.findings.some(f => f.path.toLowerCase().includes(q))
      );
    });
  }, [analyses, statusFilter, searchQuery]);

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    deleteAnalysis(currentUser.id, deleteCandidate.id);
    setDeleteCandidate(null);
    setReloadTrigger(prev => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-xs font-bold text-[#6C4DFF] mb-2">
            <History className="w-3.5 h-3.5" />
            Audit Repository
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Analysis History
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Historical comparisons saved under {currentUser.email}
          </p>
        </div>

        <button
          onClick={onStartAnalysis}
          className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-gradient-to-r from-[#6C4DFF] to-[#3685FF] hover:opacity-95 shadow-md shadow-purple-200 transition-all"
        >
          New Analysis
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-purple-100 p-4 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by API name or endpoint..."
            className="w-full pl-10 pr-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 focus:border-[#6C4DFF] focus:ring-2 focus:ring-purple-100 outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-200 text-slate-700 bg-white"
          >
            <option value="ALL">All Outcomes</option>
            <option value="COMPATIBLE">Fully Compatible</option>
            <option value="WARNING">Minor Warnings</option>
            <option value="BREAKING_DETECTED">Breaking Detected</option>
            <option value="CRITICAL">Critical Incompatibilities</option>
          </select>
        </div>
      </div>

      {/* History Items Grid */}
      {filteredAnalyses.length === 0 ? (
        <div className="bg-white rounded-3xl border border-purple-100 p-12 text-center text-slate-400 space-y-3">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="font-bold text-slate-700 text-sm">No analysis history found.</p>
          <p className="text-xs max-w-sm mx-auto">
            {searchQuery
              ? 'Try clearing your search term or changing your status filter.'
              : 'Run your first API specification comparison and save it to keep records.'}
          </p>
          <button
            onClick={onStartAnalysis}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6C4DFF]"
          >
            Start Comparison
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAnalyses.map((record) => {
            const isBreaking = record.summary.totalBreaking > 0;
            return (
              <div
                key={record.id}
                className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                      record.summary.status === 'COMPATIBLE'
                        ? 'bg-green-100 text-green-700'
                        : record.summary.status === 'WARNING'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {record.summary.status.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(record.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                    {record.v1Name} <span className="text-slate-400 font-normal">→</span> {record.v2Name}
                  </h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                    <span className="font-bold text-slate-900">
                      Score: {record.summary.overallScore}/100
                    </span>
                    <span>•</span>
                    <span className="text-red-600 font-semibold">
                      {record.summary.totalBreaking} Breaking
                    </span>
                    <span>•</span>
                    <span className="text-amber-600 font-semibold">
                      {record.summary.totalPotentiallyBreaking} Warnings
                    </span>
                    <span>•</span>
                    <span className="text-green-600 font-semibold">
                      {record.summary.totalNonBreaking} Compatible
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => generatePdfReport(record)}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteCandidate(record)}
                    className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onOpenRecord(record)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#6C4DFF] bg-purple-50 hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                  >
                    Open Analysis
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog Before Deleting */}
      {deleteCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-red-100 space-y-4">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Delete Analysis Record?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to permanently delete the comparison between{' '}
                <span className="font-bold text-slate-700">{deleteCandidate.v1Name}</span> and{' '}
                <span className="font-bold text-slate-700">{deleteCandidate.v2Name}</span>?
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setDeleteCandidate(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
