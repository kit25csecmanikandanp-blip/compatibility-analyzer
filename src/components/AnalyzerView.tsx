/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SAMPLE_COMPARISONS } from '../lib/samples';
import { validateSpec, parseApiSpec } from '../lib/analyzer/parser';
import { analyzeCompatibility } from '../lib/analyzer/diffEngine';
import { calculateCompatibilityScore } from '../lib/analyzer/scoring';
import { AnalysisRecord } from '../types/api';
import { 
  Upload, 
  FileCode, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  ArrowRight, 
  Trash2, 
  RefreshCw,
  Layers,
  FileCheck,
  FileText,
  Sliders,
  ChevronRight
} from 'lucide-react';

interface AnalyzerViewProps {
  userId?: string;
  initialSampleId?: string;
  onAnalysisComplete: (record: AnalysisRecord) => void;
}

export const AnalyzerView: React.FC<AnalyzerViewProps> = ({
  userId,
  initialSampleId,
  onAnalysisComplete,
}) => {
  // Version Names
  const [v1Name, setV1Name] = useState('OrderService v1.4');
  const [v2Name, setV2Name] = useState('OrderService v2.0');

  // Spec Contents
  const [v1Raw, setV1Raw] = useState('');
  const [v2Raw, setV2Raw] = useState('');

  // Filenames (if uploaded)
  const [v1Filename, setV1Filename] = useState<string | null>(null);
  const [v2Filename, setV2Filename] = useState<string | null>(null);

  // Tab mode for editor: 'upload' | 'paste'
  const [activeTabV1, setActiveTabV1] = useState<'upload' | 'paste'>('paste');
  const [activeTabV2, setActiveTabV2] = useState<'upload' | 'paste'>('paste');

  // Validation state
  const [v1Validation, setV1Validation] = useState<{ isValid: boolean; error?: string; info?: string } | null>(null);
  const [v2Validation, setV2Validation] = useState<{ isValid: boolean; error?: string; info?: string } | null>(null);

  // Running state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');

  // Load initial sample if requested
  useEffect(() => {
    const sample = SAMPLE_COMPARISONS.find(s => s.id === initialSampleId) || SAMPLE_COMPARISONS[0];
    if (sample) {
      loadSample(sample.id);
    }
  }, [initialSampleId]);

  const loadSample = (sampleId: string) => {
    const s = SAMPLE_COMPARISONS.find(item => item.id === sampleId);
    if (!s) return;
    setV1Name(s.v1Name);
    setV2Name(s.v2Name);
    setV1Raw(s.v1Spec);
    setV2Raw(s.v2Spec);
    setV1Filename(s.format === 'json' ? 'orders-v1.json' : 'identity-v1.yaml');
    setV2Filename(s.format === 'json' ? 'orders-v2.json' : 'identity-v2.yaml');
    validateBoth(s.v1Spec, s.v2Spec);
  };

  const validateBoth = (content1: string, content2: string) => {
    if (content1.trim()) {
      const res1 = validateSpec(content1);
      setV1Validation(
        res1.isValid
          ? { isValid: true, info: `${res1.spec?.title} (${res1.spec?.specType.toUpperCase()}, ${Object.keys(res1.spec?.data.paths || {}).length} endpoints)` }
          : { isValid: false, error: res1.error }
      );
    } else {
      setV1Validation(null);
    }

    if (content2.trim()) {
      const res2 = validateSpec(content2);
      setV2Validation(
        res2.isValid
          ? { isValid: true, info: `${res2.spec?.title} (${res2.spec?.specType.toUpperCase()}, ${Object.keys(res2.spec?.data.paths || {}).length} endpoints)` }
          : { isValid: false, error: res2.error }
      );
    } else {
      setV2Validation(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'v1' | 'v2') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds the 10MB limit. Please upload a smaller specification file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (target === 'v1') {
        setV1Raw(text);
        setV1Filename(file.name);
        if (!v1Name || v1Name.startsWith('OrderService')) {
          setV1Name(file.name.replace(/\.[^/.]+$/, ''));
        }
        const res = validateSpec(text);
        setV1Validation(
          res.isValid
            ? { isValid: true, info: `${res.spec?.title} (${res.spec?.specType.toUpperCase()})` }
            : { isValid: false, error: res.error }
        );
      } else {
        setV2Raw(text);
        setV2Filename(file.name);
        if (!v2Name || v2Name.startsWith('OrderService')) {
          setV2Name(file.name.replace(/\.[^/.]+$/, ''));
        }
        const res = validateSpec(text);
        setV2Validation(
          res.isValid
            ? { isValid: true, info: `${res.spec?.title} (${res.spec?.specType.toUpperCase()})` }
            : { isValid: false, error: res.error }
        );
      }
    };
    reader.readAsText(file);
  };

  const handleRunAnalysis = async () => {
    if (!v1Raw.trim() || !v2Raw.trim()) {
      alert('Please provide both the older and newer API specifications.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisStep('Validating API specification syntaxes...');

    try {
      await new Promise(r => setTimeout(r, 250));
      const parsed1 = parseApiSpec(v1Raw);
      const parsed2 = parseApiSpec(v2Raw);

      setAnalysisStep('Evaluating routes, parameters, request bodies & response models...');
      await new Promise(r => setTimeout(r, 350));
      const findings = analyzeCompatibility(parsed1, parsed2);

      setAnalysisStep('Calculating weighted compatibility score and risk metrics...');
      await new Promise(r => setTimeout(r, 200));
      const summary = calculateCompatibilityScore(findings);

      const record: AnalysisRecord = {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: userId || 'anonymous',
        createdAt: new Date().toISOString(),
        v1Name: v1Name.trim() || parsed1.title || 'Version 1.0',
        v2Name: v2Name.trim() || parsed2.title || 'Version 2.0',
        v1SpecRaw: v1Raw,
        v2SpecRaw: v2Raw,
        v1Format: parsed1.format,
        v2Format: parsed2.format,
        summary,
        findings,
        aiExplanations: {}
      };

      onAnalysisComplete(record);
    } catch (err: any) {
      alert(`Analysis halted: ${err.message || 'Failed parsing specification.'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canAnalyze = v1Validation?.isValid && v2Validation?.isValid && !isAnalyzing;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner / Sample Picker */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-purple-100 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-xs font-bold text-[#6C4DFF] mb-2">
            <Layers className="w-3.5 h-3.5" />
            Interactive Comparison Engine
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Compare API Specifications
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Upload OpenAPI 3.x or Swagger 2.0 files (JSON/YAML) to detect contract shifts.
          </p>
        </div>

        {/* Sample Dropdown */}
        <div className="w-full md:w-auto flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Load Preset:</span>
          <select
            onChange={(e) => loadSample(e.target.value)}
            className="w-full md:w-64 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-[#F7F5FF] text-slate-800 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-[#6C4DFF]/30 cursor-pointer"
            defaultValue={SAMPLE_COMPARISONS[0].id}
          >
            {SAMPLE_COMPARISONS.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Side-by-Side Upload Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Baseline (Older) Spec */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#6C4DFF] flex items-center justify-center font-bold text-xs">
                v1
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Baseline Specification</h3>
                <p className="text-xs text-slate-500">Older / current production API</p>
              </div>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTabV1('paste')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTabV1 === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Code / JSON
              </button>
              <button
                type="button"
                onClick={() => setActiveTabV1('upload')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTabV1 === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          {/* Version Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Baseline Version Label
            </label>
            <input
              type="text"
              value={v1Name}
              onChange={(e) => setV1Name(e.target.value)}
              placeholder="e.g. OrderService v1.4"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-[#6C4DFF] focus:ring-2 focus:ring-purple-100 outline-none"
            />
          </div>

          {/* Upload or Editor */}
          {activeTabV1 === 'upload' ? (
            <div className="relative border-2 border-dashed border-purple-200 hover:border-[#6C4DFF] rounded-2xl p-6 text-center transition-colors bg-purple-50/20">
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={(e) => handleFileUpload(e, 'v1')}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-[#6C4DFF] mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                {v1Filename || 'Click or drag OpenAPI JSON / YAML file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports OpenAPI 3.x and Swagger 2.0 (up to 10MB)</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Paste raw specification text:</span>
                {v1Raw && (
                  <button
                    type="button"
                    onClick={() => {
                      setV1Raw('');
                      setV1Filename(null);
                      setV1Validation(null);
                    }}
                    className="text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <textarea
                rows={12}
                value={v1Raw}
                onChange={(e) => {
                  setV1Raw(e.target.value);
                  validateBoth(e.target.value, v2Raw);
                }}
                placeholder="Paste OpenAPI 3.0 / Swagger JSON or YAML here..."
                className="w-full font-mono text-xs p-3.5 rounded-xl border border-slate-200 focus:border-[#6C4DFF] focus:ring-2 focus:ring-purple-100 outline-none bg-slate-50 text-slate-800 leading-relaxed"
              />
            </div>
          )}

          {/* Validation Feedback */}
          {v1Validation && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              v1Validation.isValid
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {v1Validation.isValid ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="font-medium">Valid Specification: {v1Validation.info}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Validation Error: {v1Validation.error}</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Target (Newer) Spec */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-[#3685FF] flex items-center justify-center font-bold text-xs">
                v2
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">Target Specification</h3>
                <p className="text-xs text-slate-500">Newer / upcoming proposed API</p>
              </div>
            </div>

            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTabV2('paste')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTabV2 === 'paste' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Code / JSON
              </button>
              <button
                type="button"
                onClick={() => setActiveTabV2('upload')}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  activeTabV2 === 'upload' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Upload File
              </button>
            </div>
          </div>

          {/* Version Name Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Version Label
            </label>
            <input
              type="text"
              value={v2Name}
              onChange={(e) => setV2Name(e.target.value)}
              placeholder="e.g. OrderService v2.0"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 focus:border-[#3685FF] focus:ring-2 focus:ring-blue-100 outline-none"
            />
          </div>

          {/* Upload or Editor */}
          {activeTabV2 === 'upload' ? (
            <div className="relative border-2 border-dashed border-blue-200 hover:border-[#3685FF] rounded-2xl p-6 text-center transition-colors bg-blue-50/20">
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={(e) => handleFileUpload(e, 'v2')}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-[#3685FF] mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">
                {v2Filename || 'Click or drag OpenAPI JSON / YAML file here'}
              </p>
              <p className="text-xs text-slate-500 mt-1">Supports OpenAPI 3.x and Swagger 2.0 (up to 10MB)</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Paste raw specification text:</span>
                {v2Raw && (
                  <button
                    type="button"
                    onClick={() => {
                      setV2Raw('');
                      setV2Filename(null);
                      setV2Validation(null);
                    }}
                    className="text-red-500 hover:underline flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
              <textarea
                rows={12}
                value={v2Raw}
                onChange={(e) => {
                  setV2Raw(e.target.value);
                  validateBoth(v1Raw, e.target.value);
                }}
                placeholder="Paste OpenAPI 3.0 / Swagger JSON or YAML here..."
                className="w-full font-mono text-xs p-3.5 rounded-xl border border-slate-200 focus:border-[#3685FF] focus:ring-2 focus:ring-blue-100 outline-none bg-slate-50 text-slate-800 leading-relaxed"
              />
            </div>
          )}

          {/* Validation Feedback */}
          {v2Validation && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              v2Validation.isValid
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {v2Validation.isValid ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                  <span className="font-medium">Valid Specification: {v2Validation.info}</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Validation Error: {v2Validation.error}</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Prominent Action Button & Progress Indicator */}
      <div className="bg-white rounded-3xl border border-purple-100 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="font-bold text-slate-900 text-sm">Ready to Compare Contracts</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            The analyzer will evaluate semantic differences across 13 breaking categories.
          </p>
        </div>

        <button
          onClick={handleRunAnalysis}
          disabled={!canAnalyze}
          className="w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-[#6C4DFF] via-[#3685FF] to-[#26D9D0] hover:opacity-95 shadow-lg shadow-purple-200 transition-all hover:scale-102 active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-white" />
              <span>Analyzing Compatibility...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>Analyze Compatibility</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Step loading feedback */}
      {isAnalyzing && (
        <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 text-center animate-pulse">
          <p className="text-xs font-bold text-[#6C4DFF] uppercase tracking-wider">Processing Pipeline</p>
          <p className="text-sm font-semibold text-slate-800 mt-1">{analysisStep}</p>
        </div>
      )}
    </div>
  );
};
