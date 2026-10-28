/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from '@google/genai';
import { ApiFinding, AiExplanation } from '../types/api.ts';

export async function generateFindingExplanation(
  finding: ApiFinding,
  v1Name: string,
  v2Name: string
): Promise<AiExplanation> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured.');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are a Principal API Architect analyzing breaking changes in microservices.
Examine this detected API difference between "${v1Name}" (Baseline) and "${v2Name}" (Target):

Finding Details:
- Title: ${finding.title}
- Severity: ${finding.severity}
- Category: ${finding.category}
- Method: ${finding.method || 'N/A'}
- Path: ${finding.path}
- Older Value: ${finding.olderValue || 'N/A'}
- Newer Value: ${finding.newerValue || 'N/A'}
- Description: ${finding.description}
- Current Impact Note: ${finding.impact}

Provide an authoritative, clear explanation formatted STRICTLY as a valid JSON object with the following schema (no markdown formatting, no code blocks):
{
  "simpleSummary": "A concise 1-2 sentence explanation of the change in clear plain English for engineering teams",
  "rootCauseImpact": "Detailed explanation of exactly how and why existing client applications (mobile, web, third-party) will break or experience faults",
  "migrationSteps": [
    "Step 1 actionable migration instructions for client engineers",
    "Step 2...",
    "Step 3..."
  ],
  "migrationChecklist": [
    { "task": "Checklist task description", "priority": "HIGH" },
    { "task": "Checklist task description", "priority": "MEDIUM" },
    { "task": "Checklist task description", "priority": "LOW" }
  ],
  "architecturalRisks": [
    "Specific production risk 1",
    "Specific production risk 2"
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json'
    }
  });

  const text = response.text || '';
  try {
    const parsed = JSON.parse(text);
    return {
      simpleSummary: parsed.simpleSummary || finding.description,
      rootCauseImpact: parsed.rootCauseImpact || finding.impact,
      migrationSteps: Array.isArray(parsed.migrationSteps) ? parsed.migrationSteps : [finding.recommendation],
      migrationChecklist: Array.isArray(parsed.migrationChecklist) ? parsed.migrationChecklist : [
        { task: `Update client calls to ${finding.path}`, priority: 'HIGH' }
      ],
      architecturalRisks: Array.isArray(parsed.architecturalRisks) ? parsed.architecturalRisks : [
        'Client requests may fail with HTTP 4xx or deserialization errors.'
      ]
    };
  } catch (err) {
    throw new Error('Failed parsing AI explanation response as JSON.');
  }
}
