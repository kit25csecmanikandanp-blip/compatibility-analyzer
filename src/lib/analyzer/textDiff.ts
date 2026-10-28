/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface DiffLine {
  lineNumberOlder?: number;
  lineNumberNewer?: number;
  contentOlder?: string;
  contentNewer?: string;
  type: 'unchanged' | 'modified' | 'removed' | 'added';
}

export function computeSideBySideDiff(text1: string, text2: string): DiffLine[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');

  // Longest Common Subsequence (LCS) matrix
  const m = lines1.length;
  const n = lines2.length;

  // For very large specs, limit line comparison to 2500 lines to preserve speed
  const maxLines = 2500;
  const clampedL1 = lines1.slice(0, maxLines);
  const clampedL2 = lines2.slice(0, maxLines);

  const dp: number[][] = Array.from({ length: clampedL1.length + 1 }, () =>
    new Uint16Array(clampedL2.length + 1) as any
  );

  for (let i = 0; i < clampedL1.length; i++) {
    for (let j = 0; j < clampedL2.length; j++) {
      if (clampedL1[i].trim() === clampedL2[j].trim()) {
        dp[i + 1][j + 1] = dp[i][j] + 1;
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }
  }

  const result: DiffLine[] = [];
  let i = clampedL1.length;
  let j = clampedL2.length;

  const stack: DiffLine[] = [];

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && clampedL1[i - 1].trim() === clampedL2[j - 1].trim()) {
      stack.push({
        lineNumberOlder: i,
        lineNumberNewer: j,
        contentOlder: clampedL1[i - 1],
        contentNewer: clampedL2[j - 1],
        type: 'unchanged'
      });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      stack.push({
        lineNumberNewer: j,
        contentNewer: clampedL2[j - 1],
        type: 'added'
      });
      j--;
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      stack.push({
        lineNumberOlder: i,
        contentOlder: clampedL1[i - 1],
        type: 'removed'
      });
      i--;
    }
  }

  // Reverse stack
  while (stack.length > 0) {
    result.push(stack.pop()!);
  }

  // Group adjacent removed and added lines into modified where appropriate
  const compacted: DiffLine[] = [];
  for (let k = 0; k < result.length; k++) {
    const curr = result[k];
    const next = result[k + 1];

    if (curr.type === 'removed' && next && next.type === 'added') {
      compacted.push({
        lineNumberOlder: curr.lineNumberOlder,
        lineNumberNewer: next.lineNumberNewer,
        contentOlder: curr.contentOlder,
        contentNewer: next.contentNewer,
        type: 'modified'
      });
      k++; // Skip next
    } else {
      compacted.push(curr);
    }
  }

  return compacted;
}
