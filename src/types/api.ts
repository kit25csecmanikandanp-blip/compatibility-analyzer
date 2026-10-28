/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeverityLevel = 'BREAKING' | 'POTENTIALLY_BREAKING' | 'NON_BREAKING' | 'INFORMATIONAL';

export type ChangeCategory =
  | 'ENDPOINT_REMOVED'
  | 'ENDPOINT_ADDED'
  | 'METHOD_REMOVED'
  | 'METHOD_ADDED'
  | 'PARAM_REMOVED'
  | 'PARAM_REQUIRED_ADDED'
  | 'PARAM_OPTIONAL_ADDED'
  | 'PARAM_TYPE_CHANGED'
  | 'RESPONSE_SCHEMA_CHANGED'
  | 'RESPONSE_FIELD_REMOVED'
  | 'RESPONSE_FIELD_ADDED'
  | 'REQUIRED_FIELD_CHANGED'
  | 'AUTH_CHANGED'
  | 'STATUS_CODE_CHANGED'
  | 'REQUEST_BODY_CHANGED'
  | 'ENUM_RESTRICTED'
  | 'SECURITY_WARNING';

export interface ApiFinding {
  id: string;
  category: ChangeCategory;
  severity: SeverityLevel;
  path: string;
  method?: string;
  title: string;
  description: string;
  olderValue?: string;
  newerValue?: string;
  impact: string;
  recommendation: string;
  componentLocation?: string; // e.g. "paths./users.get.parameters[0]"
}

export interface CompatibilitySummary {
  overallScore: number; // 0 to 100
  status: 'COMPATIBLE' | 'WARNING' | 'BREAKING_DETECTED' | 'CRITICAL';
  totalBreaking: number;
  totalPotentiallyBreaking: number;
  totalNonBreaking: number;
  totalInformational: number;
  deductionBreakdown: {
    breakingDeductions: number;
    potentialDeductions: number;
    infoDeductions: number;
  };
}

export interface AiExplanation {
  simpleSummary: string;
  rootCauseImpact: string;
  migrationSteps: string[];
  migrationChecklist: { task: string; priority: 'HIGH' | 'MEDIUM' | 'LOW' }[];
  architecturalRisks: string[];
}

export interface AnalysisRecord {
  id: string;
  userId: string;
  createdAt: string;
  v1Name: string;
  v2Name: string;
  v1SpecRaw: string;
  v2SpecRaw: string;
  v1Format: 'json' | 'yaml';
  v2Format: 'json' | 'yaml';
  summary: CompatibilitySummary;
  findings: ApiFinding[];
  aiExplanations?: Record<string, AiExplanation>;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}
