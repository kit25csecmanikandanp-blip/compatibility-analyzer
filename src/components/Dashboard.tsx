/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { AnalysisRecord, UserProfile } from '../types/api';
import { getAnalysesForUser } from '../lib/history/historyStore';
import { 
  GitCompare, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  Plus, 
  Sparkles, 
  Activity, 
  ChevronRight,
  TrendingUp,
  FileText
} from 'lucide-react';

interface DashboardProps {
  currentUser: UserProfile;
  onStartAnalysis: () => void;
  onOpenAnalysisRecord: (record: AnalysisRecord) => void;
  onNavigateHistory: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentUser,
  onStartAnalysis,
  onOpenAnalysisRecord,
  onNavigateHistory,
}) => {
  const userAnalyses = useMemo(() => {
    return getAnalysesForUser(currentUser.id);
  }, [currentUser.id]);

  // Compute live aggregates across user's real analyses
  const aggregates = useMemo(() => {
    const totalAnalyses = userAnalyses.length;
    let totalBreaking = 0;
    let totalWarnings = 0;
    let totalCompatible = 0;
    let totalScoreSum = 0;

    userAnalyses.forEach(a => {
      totalBreaking += a.summary.totalBreaking;
      totalWarnings += a.summary.totalPotentiallyBreaking;
      totalCompatible += a.summary.totalNonBreaking;
      totalScoreSum += a.summary.overallScore;
    });

    const avgScore = totalAnalyses > 0 ? Math.round(totalScoreSum / totalAnalyses) : 0;
    const totalAllChanges = totalBreaking + totalWarnings + totalCompatible;

    const breakingPct = totalAllChanges > 0 ? Math.round((totalBreaking / totalAllChanges) * 100) : 0;
    const warningsPct = totalAllChanges > 0 ? Math.round((totalWarnings / totalAllChanges) * 100) : 0;
    const compatiblePct = totalAllChanges > 0 ? Math.max(0, 100 - breakingPct - warningsPct) : 0;

    return {
      totalAnalyses,
      totalBreaking,
      totalWarnings,
      totalCompatible,
      avgScore,
      totalAllChanges,
      breakingPct,
      warningsPct,
      compatiblePct
    };
  }, [userAnalyses]);

  const latestAnalysis = userAnalyses[0] || null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#6C4DFF] via-[#3685FF] to-[#26D9D0] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
            Developer Workspace
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Welcome back, {currentUser.name} 👋
          </h1>
          <p className="text-sm text-purple-100 mt-1 max-w-xl">
            Contract compatibility dashboard. Real-time metrics computed directly from your saved API comparisons.
          </p>
        </div>

        <button
          onClick={onStartAnalysis}
          className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-white text-slate-900 hover:bg-purple-50 shadow-lg shadow-purple-900/20 transition-all hover:scale-102 flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4 text-[#6C4DFF]" />
          Start New Analysis
        </button>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Analyses */}
        <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Total Audits
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#6C4DFF] flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-slate-900">{aggregates.totalAnalyses}</p>
            <p className="text-xs text-slate-500 mt-1">Comparisons evaluated</p>
          </div>
        </div>

        {/* Breaking Changes Detected */}
        <div className="bg-white rounded-3xl border border-red-100 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Breaking Shifts
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-red-600">{aggregates.totalBreaking}</p>
            <p className="text-xs text-slate-500 mt-1">Contract-breaking changes</p>
          </div>
        </div>

        {/* Potential Incompatibilities */}
        <div className="bg-white rounded-3xl border border-amber-100 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Warnings Identified
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-amber-600">{aggregates.totalWarnings}</p>
            <p className="text-xs text-slate-500 mt-1">Conditional client risks</p>
          </div>
        </div>

        {/* Compatible Changes */}
        <div className="bg-white rounded-3xl border border-green-100 p-6 shadow-xs flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Compatible Changes
            </span>
            <div className="w-9 h-9 rounded-xl bg-green-100 text-green-700 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-extrabold text-green-600">{aggregates.totalCompatible}</p>
            <p className="text-xs text-slate-500 mt-1">Safe additive improvements</p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Distribution Chart & Latest Comparison Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Distribution of Detected Changes Chart */}
        <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Distribution of Detected Changes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown across your saved specification versions
            </p>
          </div>

          {aggregates.totalAllChanges > 0 ? (
            <div className="space-y-4">
              {/* Stacked Progress Bar */}
              <div className="h-6 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                <div
                  style={{ width: `${aggregates.breakingPct}%` }}
                  className="bg-red-500 h-full transition-all duration-500"
                  title={`Breaking: ${aggregates.breakingPct}%`}
                />
                <div
                  style={{ width: `${aggregates.warningsPct}%` }}
                  className="bg-amber-400 h-full transition-all duration-500"
                  title={`Warnings: ${aggregates.warningsPct}%`}
                />
                <div
                  style={{ width: `${aggregates.compatiblePct}%` }}
                  className="bg-emerald-500 h-full transition-all duration-500"
                  title={`Compatible: ${aggregates.compatiblePct}%`}
                />
              </div>

              {/* Legend with exact numbers & percentages */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-3 bg-red-50 rounded-2xl border border-red-100">
                  <span className="block font-extrabold text-red-700 text-base">
                    {aggregates.breakingPct}%
                  </span>
                  <span className="text-slate-600 font-medium">Breaking ({aggregates.totalBreaking})</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                  <span className="block font-extrabold text-amber-700 text-base">
                    {aggregates.warningsPct}%
                  </span>
                  <span className="text-slate-600 font-medium">Warnings ({aggregates.totalWarnings})</span>
                </div>
                <div className="p-3 bg-green-50 rounded-2xl border border-green-100">
                  <span className="block font-extrabold text-green-700 text-base">
                    {aggregates.compatiblePct}%
                  </span>
                  <span className="text-slate-600 font-medium">Compatible ({aggregates.totalCompatible})</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              Run your first API comparison to generate distribution analytics.
            </div>
          )}
        </div>

        {/* Latest Comparison Summary Card */}
        <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
                  Latest Comparison Summary
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Most recent contract delta evaluated
                </p>
              </div>

              {latestAnalysis && (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-purple-50 text-[#6C4DFF] border border-purple-200">
                  Score: {latestAnalysis.summary.overallScore} / 100
                </span>
              )}
            </div>

            {latestAnalysis ? (
              <div className="mt-4 p-4 rounded-2xl bg-[#F7F5FF] border border-purple-100 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                  <span>Baseline: {latestAnalysis.v1Name}</span>
                  <span className="text-slate-400">vs</span>
                  <span>Target: {latestAnalysis.v2Name}</span>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="text-red-600 font-bold">
                    {latestAnalysis.summary.totalBreaking} Breaking
                  </span>
                  <span>•</span>
                  <span className="text-amber-600 font-bold">
                    {latestAnalysis.summary.totalPotentiallyBreaking} Warnings
                  </span>
                  <span>•</span>
                  <span className="text-green-600 font-bold">
                    {latestAnalysis.summary.totalNonBreaking} Compatible
                  </span>
                </div>

                <p className="text-xs text-slate-500">
                  Audited on {new Date(latestAnalysis.createdAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <div className="mt-4 py-8 text-center text-slate-400 text-xs">
                No recent comparison records found.
              </div>
            )}
          </div>

          {latestAnalysis ? (
            <button
              onClick={() => onOpenAnalysisRecord(latestAnalysis)}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-[#6C4DFF] bg-purple-50 hover:bg-purple-100 transition-colors flex items-center justify-center gap-1.5"
            >
              Re-examine Full Results
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onStartAnalysis}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-[#6C4DFF] hover:opacity-95 transition-all"
            >
              Run First Analysis
            </button>
          )}
        </div>
      </div>

      {/* Recent Analysis History Table */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-xs space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900">
              Recent Analysis Records
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Securely stored under your account: {currentUser.email}
            </p>
          </div>

          {userAnalyses.length > 0 && (
            <button
              onClick={onNavigateHistory}
              className="text-xs font-bold text-[#6C4DFF] hover:underline flex items-center gap-1"
            >
              View Full History
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {userAnalyses.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs space-y-3">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No previous comparisons yet</p>
            <button
              onClick={onStartAnalysis}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#6C4DFF]"
            >
              Start Analysis Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Versions Compared</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Breaking</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {userAnalyses.slice(0, 5).map((a) => (
                  <tr key={a.id} className="hover:bg-purple-50/20 transition-colors">
                    <td className="py-3.5 font-bold text-slate-800">
                      {a.v1Name} <span className="text-slate-400 font-normal">→</span> {a.v2Name}
                    </td>
                    <td className="py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                        a.summary.status === 'COMPATIBLE'
                          ? 'bg-green-100 text-green-700'
                          : a.summary.status === 'WARNING'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {a.summary.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 font-extrabold text-slate-900">
                      {a.summary.overallScore} / 100
                    </td>
                    <td className="py-3.5 font-bold text-red-600">
                      {a.summary.totalBreaking}
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(a.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      <button
                        onClick={() => onOpenAnalysisRecord(a)}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-[#6C4DFF] hover:bg-purple-50 transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
