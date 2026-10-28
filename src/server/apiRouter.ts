/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateFindingExplanation } from './aiService.ts';

export async function handleAiExplainRequest(body: any): Promise<{ success: boolean; explanation?: any; error?: string }> {
  try {
    const { finding, v1Name, v2Name } = body;
    if (!finding) {
      return { success: false, error: 'Finding payload is required.' };
    }

    const explanation = await generateFindingExplanation(
      finding,
      v1Name || 'Baseline API',
      v2Name || 'Target API'
    );
    return { success: true, explanation };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'AI explanation service failed.'
    };
  }
}
