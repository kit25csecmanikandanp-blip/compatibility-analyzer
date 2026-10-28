/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as yaml from 'js-yaml';

export interface ParsedSpec {
  raw: string;
  format: 'json' | 'yaml';
  data: any;
  version: string;
  title: string;
  specType: 'openapi_3' | 'swagger_2' | 'unknown';
}

export function parseApiSpec(rawContent: string): ParsedSpec {
  const trimmed = rawContent.trim();
  if (!trimmed) {
    throw new Error('API specification content cannot be empty.');
  }

  let data: any = null;
  let format: 'json' | 'yaml' = 'json';

  // Try JSON first if it looks like JSON
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      data = JSON.parse(trimmed);
      format = 'json';
    } catch (jsonErr: any) {
      // Fallback to YAML in case of trailing commas or yaml formatted like json
      try {
        data = yaml.load(trimmed);
        format = 'yaml';
      } catch (yamlErr: any) {
        throw new Error(`Invalid JSON specification: ${jsonErr.message}`);
      }
    }
  } else {
    // Try YAML
    try {
      data = yaml.load(trimmed);
      format = 'yaml';
    } catch (yamlErr: any) {
      throw new Error(`Invalid YAML specification: ${yamlErr.message}`);
    }
  }

  if (!data || typeof data !== 'object') {
    throw new Error('Specification must be a valid JSON or YAML object.');
  }

  let specType: 'openapi_3' | 'swagger_2' | 'unknown' = 'unknown';
  if (typeof data.openapi === 'string' && data.openapi.startsWith('3.')) {
    specType = 'openapi_3';
  } else if (typeof data.swagger === 'string' && data.swagger.startsWith('2.')) {
    specType = 'swagger_2';
  } else if (data.paths) {
    specType = 'openapi_3'; // default assumed if paths exist
  } else {
    throw new Error('Unrecognized API specification format. Must contain valid "openapi: 3.x" or "swagger: 2.0" with paths.');
  }

  const title = data.info?.title || 'API Specification';
  const version = data.info?.version || '1.0.0';

  return {
    raw: trimmed,
    format,
    data,
    title,
    version,
    specType
  };
}

export function validateSpec(rawContent: string): { isValid: boolean; error?: string; spec?: ParsedSpec } {
  try {
    const spec = parseApiSpec(rawContent);
    return { isValid: true, spec };
  } catch (err: any) {
    return { isValid: false, error: err.message || 'Validation failed.' };
  }
}
