/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ApiFinding, AiExplanation } from '../types/api';
import { getFallbackExplanation } from '../lib/analyzer/ruleBasedExplainer';
import { 
  X, 
  Sparkles, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  ArrowRight, 
  ShieldAlert, 
  Lightbulb, 
  CheckCircle2,
  Cpu,
  RefreshCw
} from 'lucide-react';

interface AIExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  finding: ApiFinding | null;
  v1Name: string;
  v2Name: string;
  cachedExplanation?: AiExplanation;
  onSaveExplanation: (findingId: string, explanation: AiExplanation) => void;
}

export const AIExplanationModal: React.FC<AIExplanationModalProps> = ({
  isOpen,
  onClose,
  finding,
  v1Name,
  v2Name,
  cachedExplanation,
  onSaveExplanation,
}) => {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<AiExplanation | null>(cachedExplanation || null);
  const [checkedTasks, setCheckedTasks] = useState<Record<number, boolean>>({});
  const [isAiPowered, setIsAiPowered] = useState(false);

  useEffect(() => {
    if (isOpen && finding) {
      if (cachedExplanation) {
        setExplanation(cachedExplanation);
        setIsAiPowered(true);
      } else {
        fetchExplanation();
      }
    }
  }, [isOpen, finding]);

  const fetchExplanation = async () => {
    if (!finding) return;
    setLoading(true);

    try {
      // Call backend route
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding,
          v1Name,
          v2Name
        })
      });

      if (!res.ok) {
        throw new Error(`Backend returned status ${res.status}`);
      }

      const data = await res.json();
      if (data.success && data.explanation) {
        setExplanation(data.explanation);
        setIsAiPowered(true);
        onSaveExplanation(finding.id, data.explanation);
      } else {
        throw new Error(data.error || 'Server could not complete AI reasoning');
      }
    } catch (err) {
      // Graceful fallback to deterministic domain explainer
      console.warn('AI Explanation fallback engaged:', err);
      const fallback = getFallbackExplanation(finding, v1Name, v2Name);
      setExplanation(fallback);
      setIsAiPowered(false);
      onSaveExplanation(finding.id, fallback);
    } finally {
      setLoading(false);
    }
  };

  const toggleCheck = (idx: number) => {
    setCheckedTasks(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (!isOpen || !finding) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-purple-100 flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#6C4DFF] via-[#3685FF] to-[#26D9D0] p-6 text-white shrink-0 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-200" />
              {isAiPowered ? 'Gemini AI Semantic Analysis' : 'Architecture Analysis & Migration Playbook'}
            </span>
            <span className="text-xs text-purple-100 font-mono">
              {finding.method ? `[${finding.method}] ` : ''}{finding.path}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            {finding.title}
          </h2>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <RefreshCw className="w-8 h-8 text-[#6C4DFF] animate-spin mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                Analyzing breaking contract shift with Gemini AI...
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Synthesizing failure modes, backward compatibility impacts, and migration tasks for client developers.
              </p>
            </div>
          ) : explanation ? (
            <>
              {/* Section 1: Simple Language Summary */}
              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <Lightbulb className="w-4 h-4 text-[#6C4DFF]" />
                  <h4 className="text-xs font-bold text-[#6C4DFF] uppercase tracking-wider">
                    Executive Summary (Simple Language)
                  </h4>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {explanation.simpleSummary}
                </p>
              </div>

              {/* Section 2: Root Cause & Client Impact */}
              <div className="p-4 rounded-2xl bg-red-50/60 border border-red-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <h4 className="text-xs font-bold text-red-700 uppercase tracking-wider">
                    Exact Failure Mode & Impact on Existing Clients
                  </h4>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed">
                  {explanation.rootCauseImpact}
                </p>
              </div>

              {/* Section 3: Recommended Migration Steps */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
                  Step-by-Step Developer Remediation
                </h4>
                <div className="space-y-2.5">
                  {explanation.migrationSteps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-sm text-slate-800">
                      <div className="w-6 h-6 rounded-lg bg-[#3685FF] text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <p className="leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Interactive Migration Checklist */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-[#10B981]" />
                    Interactive Migration Checklist
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Click items as you complete them
                  </span>
                </div>

                <div className="space-y-2">
                  {explanation.migrationChecklist.map((item, idx) => {
                    const isChecked = Boolean(checkedTasks[idx]);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleCheck(idx)}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none ${
                          isChecked
                            ? 'bg-green-50/50 border-green-200 text-slate-500 line-through'
                            : 'bg-white border-slate-200 text-slate-800 hover:border-purple-200'
                        }`}
                      >
                        <div className="mt-0.5">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#10B981]" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                          <span className="text-sm font-medium">{item.task}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                            item.priority === 'HIGH'
                              ? 'bg-red-100 text-red-700'
                              : item.priority === 'MEDIUM'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {item.priority}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Section 5: Key Architectural Risks */}
              {explanation.architecturalRisks?.length > 0 && (
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                      Key Architectural Risks
                    </h4>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-xs sm:text-sm text-slate-800">
                    {explanation.architecturalRisks.map((risk, idx) => (
                      <li key={idx} className="leading-relaxed">{risk}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center shrink-0">
          <span className="text-xs text-slate-500">
            Intelligent API Contract Governance
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
          >
            Close Playbook
          </button>
        </div>
      </div>
    </div>
  );
};
