/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  GitCompare, 
  ShieldAlert, 
  Zap, 
  FileCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Code2, 
  FileText, 
  Sliders,
  AlertTriangle,
  Layers,
  Terminal,
  Activity
} from 'lucide-react';
import { SAMPLE_COMPARISONS } from '../lib/samples';

interface LandingPageProps {
  onStartAnalysis: (sampleId?: string) => void;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  isAuthenticated: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartAnalysis,
  onOpenAuth,
  isAuthenticated
}) => {
  return (
    <div className="space-y-16 sm:space-y-24 pb-16">
      {/* Hero Section */}
      <section className="relative pt-10 sm:pt-16 pb-12 overflow-hidden">
        {/* Glow ambient background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-purple-200/50 via-blue-100/40 to-pink-100/30 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-purple-200 text-xs font-semibold text-[#6C4DFF] shadow-xs animate-in fade-in slide-in-from-bottom-2">
            <span className="flex h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            OpenAPI 3.0, 3.1 & Swagger 2.0 (JSON & YAML) Supported
          </div>

          {/* Main Hero Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Detect Breaking API Changes{' '}
            <span className="bg-gradient-to-r from-[#6C4DFF] via-[#3685FF] to-[#FF5BA6] bg-clip-text text-transparent">
              Before They Break
            </span>{' '}
            Your Application.
          </h1>

          {/* Short Description */}
          <p className="max-w-3xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
            Intelligent API Compatibility Analyzer is an automated contract intelligence engine that
            compares specifications across versions, classifies breaking risks, computes standardized
            compatibility scores, and generates AI migration playbooks.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
            <button
              onClick={() => onStartAnalysis()}
              className="px-7 py-3.5 rounded-2xl font-bold text-base text-white bg-gradient-to-r from-[#6C4DFF] via-[#3685FF] to-[#26D9D0] hover:opacity-95 shadow-lg shadow-purple-200/60 transition-all hover:scale-102 active:scale-98 flex items-center gap-2.5"
            >
              <GitCompare className="w-5 h-5" />
              Analyze API Versions
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              onClick={() => onStartAnalysis(SAMPLE_COMPARISONS[0].id)}
              className="px-6 py-3.5 rounded-2xl font-semibold text-base text-slate-700 bg-white border border-purple-200 hover:bg-purple-50/50 shadow-xs transition-all hover:scale-102 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-[#FF5BA6]" />
              Explore Sample Comparison
            </button>
          </div>

          {/* Quick Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-10 max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-purple-100 shadow-xs text-center">
              <p className="text-2xl font-extrabold text-[#6C4DFF]">100%</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Automated Spec Diffs</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-purple-100 shadow-xs text-center">
              <p className="text-2xl font-extrabold text-[#3685FF]">13+</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Breaking Categories</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-purple-100 shadow-xs text-center">
              <p className="text-2xl font-extrabold text-[#FF5BA6]">0 to 100</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Documented Scoring</p>
            </div>
            <div className="bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-purple-100 shadow-xs text-center">
              <p className="text-2xl font-extrabold text-[#26D9D0]">AI-Powered</p>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">Migration Checklist</p>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Comprehensive Contract Intelligence Features
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Engineered to catch subtle breaking changes that silently break web, mobile, and partner clients.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: API Comparison */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#6C4DFF] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <GitCompare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Deep Spec Comparison</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Examines paths, verbs, path variables, query parameters, request bodies, and polymorphic schemas between versions.
            </p>
          </div>

          {/* Card 2: Breaking-Change Detection */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-[#EF4444] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Breaking-Change Detection</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Detects removed endpoints, new mandatory parameters, altered datatypes, removed payload fields, and restricted enums.
            </p>
          </div>

          {/* Card 3: Compatibility Scoring */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-[#3685FF] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Compatibility Scoring</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Calculates a consistent 0-100 health index with transparent metric deductions for breaking, warning, and informational shifts.
            </p>
          </div>

          {/* Card 4: Report Generation */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-xs hover:shadow-md transition-shadow group">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#10B981] flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Executive Reports</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Export downloadable PDF audits and structured JSON data complete with root causes and remediation recommendations.
            </p>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl border border-purple-100 p-8 sm:p-12 shadow-sm">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="px-3 py-1 rounded-full bg-purple-50 text-xs font-bold text-[#6C4DFF] uppercase tracking-wider">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-3">
              How The Compatibility Analyzer Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#6C4DFF] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-200">
                1
              </div>
              <h4 className="text-base font-bold text-slate-900">Upload Specs</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Provide baseline (older) and target (newer) specifications in OpenAPI JSON or YAML format.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#3685FF] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-blue-200">
                2
              </div>
              <h4 className="text-base font-bold text-slate-900">Semantic Diff Engine</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                The engine normalizes specs and evaluates contract delta rules across all operations and models.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FF5BA6] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-pink-200">
                3
              </div>
              <h4 className="text-base font-bold text-slate-900">AI Explanations</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive plain-language failure explanations, production risk summaries, and migration checklists.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#26D9D0] text-slate-900 flex items-center justify-center font-bold text-sm shadow-md shadow-cyan-200">
                4
              </div>
              <h4 className="text-base font-bold text-slate-900">Export & Track</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Download formatted PDF reports and save historical audits securely into your user account.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Explorer Teaser */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-cyan-200 uppercase tracking-wider">
              Ready-to-Test Demonstration
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold">
              Explore A Real Microservice Evolution
            </h3>
            <p className="text-sm text-purple-100 leading-relaxed">
              Test drive the analyzer instantly with our pre-configured E-Commerce Orders microservice comparison.
              Watch how our engine catches removed DELETE operations, newly required tenant headers, and UUID migrations.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => onStartAnalysis(SAMPLE_COMPARISONS[0].id)}
                className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-slate-900 hover:bg-purple-50 transition-all hover:scale-102 flex items-center gap-2"
              >
                <Zap className="w-4 h-4 text-[#6C4DFF]" />
                Launch Sample Analysis
              </button>
              <button
                onClick={() => onStartAnalysis()}
                className="px-6 py-3 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white transition-all flex items-center gap-2"
              >
                Upload Custom Files
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
