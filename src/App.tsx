/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { UserProfile, AnalysisRecord, ApiFinding, AiExplanation } from './types/api';
import { getCurrentUser } from './lib/auth/authStore';
import { saveAnalysis, getAnalysesForUser } from './lib/history/historyStore';
import { SAMPLE_COMPARISONS } from './lib/samples';
import { parseApiSpec } from './lib/analyzer/parser';
import { analyzeCompatibility } from './lib/analyzer/diffEngine';
import { calculateCompatibilityScore } from './lib/analyzer/scoring';

import { Navbar } from './components/Navbar';
import { LandingPage } from './components/LandingPage';
import { AnalyzerView } from './components/AnalyzerView';
import { ResultsView } from './components/ResultsView';
import { SideBySideDiff } from './components/SideBySideDiff';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { AuthModal } from './components/AuthModal';
import { AIExplanationModal } from './components/AIExplanationModal';
import { Footer } from './components/Footer';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(getCurrentUser());
  const [currentTab, setCurrentTab] = useState<'home' | 'dashboard' | 'analyzer' | 'results' | 'history' | 'diff'>('home');

  // Auth modal state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');

  // Analysis result state
  const [activeRecord, setActiveRecord] = useState<AnalysisRecord | null>(null);
  const [selectedSampleId, setSelectedSampleId] = useState<string | undefined>(undefined);

  // AI Modal state
  const [aiModalFinding, setAiModalFinding] = useState<ApiFinding | null>(null);

  // Listen for auth state changes
  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getCurrentUser());
    };
    window.addEventListener('auth-state-change', handleAuthChange);
    return () => window.removeEventListener('auth-state-change', handleAuthChange);
  }, []);

  // Pre-seed an initial analysis for first-time visitors if none exists
  useEffect(() => {
    if (currentUser) {
      const history = getAnalysesForUser(currentUser.id);
      if (history.length === 0) {
        // Run sample 1 as initial record for the demo user
        try {
          const sample = SAMPLE_COMPARISONS[0];
          const p1 = parseApiSpec(sample.v1Spec);
          const p2 = parseApiSpec(sample.v2Spec);
          const findings = analyzeCompatibility(p1, p2);
          const summary = calculateCompatibilityScore(findings);
          const initialRecord: AnalysisRecord = {
            id: `seed_${Date.now()}`,
            userId: currentUser.id,
            createdAt: new Date().toISOString(),
            v1Name: sample.v1Name,
            v2Name: sample.v2Name,
            v1SpecRaw: sample.v1Spec,
            v2SpecRaw: sample.v2Spec,
            v1Format: sample.format,
            v2Format: sample.format,
            summary,
            findings,
            aiExplanations: {}
          };
          saveAnalysis(initialRecord);
        } catch (e) {
          console.error('Initial seeding error:', e);
        }
      }
    }
  }, [currentUser]);

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthInitialMode(mode);
    setAuthModalOpen(true);
  };

  const handleStartAnalysis = (sampleId?: string) => {
    setSelectedSampleId(sampleId);
    setCurrentTab('analyzer');
  };

  const handleAnalysisComplete = (record: AnalysisRecord) => {
    // If user is authenticated, save record under user account
    if (currentUser) {
      const userRecord = { ...record, userId: currentUser.id };
      saveAnalysis(userRecord);
      setActiveRecord(userRecord);
    } else {
      setActiveRecord(record);
    }
    setCurrentTab('results');
  };

  const handleOpenRecord = (record: AnalysisRecord) => {
    setActiveRecord(record);
    setCurrentTab('results');
  };

  const handleSaveAiExplanation = (findingId: string, explanation: AiExplanation) => {
    if (!activeRecord) return;
    const updated = {
      ...activeRecord,
      aiExplanations: {
        ...(activeRecord.aiExplanations || {}),
        [findingId]: explanation
      }
    };
    setActiveRecord(updated);
    if (currentUser && activeRecord.userId === currentUser.id) {
      saveAnalysis(updated);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5FF] text-[#0F172A]">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => {
          if (tab === 'dashboard' || tab === 'history') {
            if (!currentUser) {
              handleOpenAuth('login');
              return;
            }
          }
          setCurrentTab(tab);
        }}
        currentUser={currentUser}
        onOpenAuth={handleOpenAuth}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <LandingPage
            onStartAnalysis={handleStartAnalysis}
            onOpenAuth={handleOpenAuth}
            isAuthenticated={Boolean(currentUser)}
          />
        )}

        {currentTab === 'analyzer' && (
          <AnalyzerView
            userId={currentUser?.id}
            initialSampleId={selectedSampleId}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}

        {currentTab === 'results' && activeRecord && (
          <ResultsView
            record={activeRecord}
            currentUser={currentUser}
            onOpenDiff={() => setCurrentTab('diff')}
            onOpenAIPlaybook={(finding) => setAiModalFinding(finding)}
            onStartNewAnalysis={() => setCurrentTab('analyzer')}
            onOpenAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'diff' && activeRecord && (
          <SideBySideDiff
            record={activeRecord}
            onBack={() => setCurrentTab('results')}
          />
        )}

        {currentTab === 'dashboard' && currentUser && (
          <Dashboard
            currentUser={currentUser}
            onStartAnalysis={() => {
              setSelectedSampleId(undefined);
              setCurrentTab('analyzer');
            }}
            onOpenAnalysisRecord={handleOpenRecord}
            onNavigateHistory={() => setCurrentTab('history')}
          />
        )}

        {currentTab === 'history' && currentUser && (
          <HistoryView
            currentUser={currentUser}
            onOpenRecord={handleOpenRecord}
            onStartAnalysis={() => {
              setSelectedSampleId(undefined);
              setCurrentTab('analyzer');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        onSuccess={(user) => {
          setCurrentUser(user);
          // If was on home, head to dashboard
          if (currentTab === 'home') {
            setCurrentTab('dashboard');
          }
        }}
      />

      {/* AI Explanation / Deep Dive Playbook Modal */}
      {aiModalFinding && activeRecord && (
        <AIExplanationModal
          isOpen={Boolean(aiModalFinding)}
          onClose={() => setAiModalFinding(null)}
          finding={aiModalFinding}
          v1Name={activeRecord.v1Name}
          v2Name={activeRecord.v2Name}
          cachedExplanation={activeRecord.aiExplanations?.[aiModalFinding.id]}
          onSaveExplanation={handleSaveAiExplanation}
        />
      )}
    </div>
  );
}
