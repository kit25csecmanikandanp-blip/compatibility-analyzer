/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GitCompare, ShieldCheck, Code, Layers } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-purple-100 py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3 text-center md:text-left">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6C4DFF] to-[#3685FF] flex items-center justify-center text-white shadow-xs">
              <GitCompare className="w-4 h-4" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-slate-900">
                Intelligent API Compatibility Analyzer
              </p>
              <p className="text-xs text-slate-500">
                Automated Breaking-Change & Schema Evolution Intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <ShieldCheck className="w-3.5 h-3.5 text-green-600" />
              Contract Safety Guard
            </span>
            <span>•</span>
            <span className="font-mono">OpenAPI 3.x / Swagger 2.0</span>
            <span>•</span>
            <span>College CSE Project Demonstration</span>
          </div>

          <div className="text-xs text-slate-400 text-center md:text-right">
            © {new Date().getFullYear()} API Compatibility Analyzer. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
