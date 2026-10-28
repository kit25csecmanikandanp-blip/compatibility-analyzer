/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AnalysisRecord } from '../../types/api';

const HISTORY_PREFIX = 'api_compat_analyzer_history_user_';

export function getAnalysesForUser(userId: string): AnalysisRecord[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(`${HISTORY_PREFIX}${userId}`);
    if (!raw) return [];
    const list: AnalysisRecord[] = JSON.parse(raw);
    return Array.isArray(list) ? list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  } catch (err) {
    console.error('Failed reading user history:', err);
    return [];
  }
}

export function saveAnalysis(record: AnalysisRecord): void {
  if (!record.userId) return;
  try {
    const existing = getAnalysesForUser(record.userId);
    // Replace if existing ID exists, otherwise prepend
    const filtered = existing.filter(r => r.id !== record.id);
    filtered.unshift(record);
    localStorage.setItem(`${HISTORY_PREFIX}${record.userId}`, JSON.stringify(filtered));
    window.dispatchEvent(new Event('analysis-history-change'));
  } catch (err) {
    console.error('Failed saving analysis record:', err);
  }
}

export function deleteAnalysis(userId: string, recordId: string): void {
  if (!userId || !recordId) return;
  try {
    const existing = getAnalysesForUser(userId);
    const updated = existing.filter(r => r.id !== recordId);
    localStorage.setItem(`${HISTORY_PREFIX}${userId}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('analysis-history-change'));
  } catch (err) {
    console.error('Failed deleting analysis record:', err);
  }
}

export function getAnalysisById(userId: string, recordId: string): AnalysisRecord | null {
  const list = getAnalysesForUser(userId);
  return list.find(r => r.id === recordId) || null;
}
