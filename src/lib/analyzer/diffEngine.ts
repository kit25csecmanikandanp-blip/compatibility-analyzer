/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiFinding } from '../../types/api.ts';
import { ParsedSpec } from './parser.ts';

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];

function resolveRef(schema: any, rootDoc: any, depth = 0): any {
  if (depth > 5) return schema; // prevent infinite loops
  if (schema && typeof schema === 'object' && schema.$ref) {
    const ref = schema.$ref as string;
    if (ref.startsWith('#/')) {
      const parts = ref.substring(2).split('/');
      let current = rootDoc;
      for (const part of parts) {
        if (!current) break;
        current = current[part];
      }
      if (current) {
        return resolveRef(current, rootDoc, depth + 1);
      }
    }
  }
  return schema;
}

export function analyzeCompatibility(v1Parsed: ParsedSpec, v2Parsed: ParsedSpec): ApiFinding[] {
  const findings: ApiFinding[] = [];
  const v1 = v1Parsed.data;
  const v2 = v2Parsed.data;

  const v1Paths = v1.paths || {};
  const v2Paths = v2.paths || {};

  let findingCounter = 1;
  const addFinding = (f: Omit<ApiFinding, 'id'>) => {
    findings.push({
      id: `diff-${findingCounter++}`,
      ...f
    });
  };

  // 1. Endpoints & Methods Comparison
  for (const pathKey of Object.keys(v1Paths)) {
    const v1PathItem = v1Paths[pathKey];
    const v2PathItem = v2Paths[pathKey];

    if (!v2PathItem) {
      addFinding({
        category: 'ENDPOINT_REMOVED',
        severity: 'BREAKING',
        path: pathKey,
        title: `Endpoint '${pathKey}' was completely removed`,
        description: `The path '${pathKey}' exists in ${v1Parsed.title} (v${v1Parsed.version}) but is entirely missing in ${v2Parsed.title} (v${v2Parsed.version}).`,
        olderValue: `Endpoint available with methods: ${Object.keys(v1PathItem).filter(m => HTTP_METHODS.includes(m.toLowerCase())).map(m => m.toUpperCase()).join(', ')}`,
        newerValue: 'Endpoint not found (404 Not Found)',
        impact: 'Any existing client application calling this endpoint will immediately receive HTTP 404 Not Found and fail.',
        recommendation: `Provide a graceful deprecation window, redirect via HTTP 301/308, or document the replacement route for '${pathKey}'.`,
        componentLocation: `paths['${pathKey}']`
      });
      continue;
    }

    // Check removed or changed HTTP methods on existing path
    for (const method of HTTP_METHODS) {
      const v1Op = v1PathItem[method];
      const v2Op = v2PathItem[method];

      if (v1Op && !v2Op) {
        addFinding({
          category: 'METHOD_REMOVED',
          severity: 'BREAKING',
          path: pathKey,
          method: method.toUpperCase(),
          title: `HTTP Method ${method.toUpperCase()} removed on '${pathKey}'`,
          description: `The operation ${method.toUpperCase()} ${pathKey} was removed in the newer API specification.`,
          olderValue: `Supported (${method.toUpperCase()})`,
          newerValue: 'Method Not Allowed (405)',
          impact: `Clients invoking ${method.toUpperCase()} on '${pathKey}' will receive HTTP 405 Method Not Allowed.`,
          recommendation: `Restore the ${method.toUpperCase()} handler or create a compatibility layer that proxies to the new API structure.`,
          componentLocation: `paths['${pathKey}'].${method}`
        });
        continue;
      }

      if (!v1Op && v2Op) {
        addFinding({
          category: 'METHOD_ADDED',
          severity: 'NON_BREAKING',
          path: pathKey,
          method: method.toUpperCase(),
          title: `New HTTP Method ${method.toUpperCase()} added to '${pathKey}'`,
          description: `The newer specification introduces support for ${method.toUpperCase()} on '${pathKey}'.`,
          olderValue: 'Not supported',
          newerValue: `Supported (${method.toUpperCase()})`,
          impact: 'Backward compatible. Existing clients are unaffected; new clients can take advantage of the operation.',
          recommendation: 'Document the new capability in your API changelog.',
          componentLocation: `paths['${pathKey}'].${method}`
        });
        continue;
      }

      if (v1Op && v2Op) {
        // Detailed operation inspection: parameters, request bodies, responses, security
        inspectOperationDifferences(
          pathKey,
          method.toUpperCase(),
          v1Op,
          v2Op,
          v1,
          v2,
          v1PathItem.parameters || [],
          v2PathItem.parameters || [],
          addFinding
        );
      }
    }
  }

  // 2. Newly Added Endpoints
  for (const pathKey of Object.keys(v2Paths)) {
    if (!v1Paths[pathKey]) {
      const methods = Object.keys(v2Paths[pathKey])
        .filter(m => HTTP_METHODS.includes(m.toLowerCase()))
        .map(m => m.toUpperCase());
      addFinding({
        category: 'ENDPOINT_ADDED',
        severity: 'NON_BREAKING',
        path: pathKey,
        title: `New endpoint '${pathKey}' introduced`,
        description: `A brand-new path was added supporting methods: ${methods.join(', ')}.`,
        olderValue: 'Endpoint did not exist',
        newerValue: `Available (${methods.join(', ')})`,
        impact: 'Safe addition. No breaking impact on legacy consumers.',
        recommendation: 'Ensure standard authorization, rate limiting, and monitoring are active on the new endpoint.',
        componentLocation: `paths['${pathKey}']`
      });
    }
  }

  // 3. Global Security / Authentication Changes
  inspectGlobalSecurity(v1, v2, addFinding);

  return findings;
}

function inspectOperationDifferences(
  path: string,
  method: string,
  v1Op: any,
  v2Op: any,
  v1Doc: any,
  v2Doc: any,
  v1PathParams: any[],
  v2PathParams: any[],
  addFinding: (f: Omit<ApiFinding, 'id'>) => void
) {
  // Combine path-level and operation-level parameters
  const v1Params: any[] = [...v1PathParams, ...(v1Op.parameters || [])];
  const v2Params: any[] = [...v2PathParams, ...(v2Op.parameters || [])];

  const getParamKey = (p: any) => `${p.in || 'query'}:${p.name}`;
  const v1ParamMap = new Map<string, any>();
  const v2ParamMap = new Map<string, any>();

  for (const p of v1Params) {
    const resolved = resolveRef(p, v1Doc);
    if (resolved && resolved.name) v1ParamMap.set(getParamKey(resolved), resolved);
  }
  for (const p of v2Params) {
    const resolved = resolveRef(p, v2Doc);
    if (resolved && resolved.name) v2ParamMap.set(getParamKey(resolved), resolved);
  }

  // A. Check Removed Parameters
  for (const [key, p1] of v1ParamMap.entries()) {
    const p2 = v2ParamMap.get(key);
    if (!p2) {
      const isPath = p1.in === 'path';
      const isReq = Boolean(p1.required);
      addFinding({
        category: 'PARAM_REMOVED',
        severity: isPath || isReq ? 'BREAKING' : 'POTENTIALLY_BREAKING',
        path,
        method,
        title: `Parameter '${p1.name}' (${p1.in}) was removed`,
        description: `Parameter '${p1.name}' located in ${p1.in} was removed from ${method} ${path}.`,
        olderValue: `${p1.in} parameter '${p1.name}' (${isReq ? 'required' : 'optional'}, type: ${p1.schema?.type || p1.type || 'unspecified'})`,
        newerValue: 'Removed',
        impact: isReq
          ? 'High: Clients constructing requests with this required parameter will see ignored inputs or mismatch errors.'
          : 'Medium: Existing clients transmitting this query/header parameter may find their filters, pagination, or sorting silently ignored.',
        recommendation: `Consider accepting '${p1.name}' as a deprecated parameter with an informative deprecation header (Sunset header) for at least 6 months.`,
        componentLocation: `paths['${path}'].${method.toLowerCase()}.parameters[${p1.name}]`
      });
    } else {
      // Check parameter type change
      const t1 = p1.schema?.type || p1.type;
      const t2 = p2.schema?.type || p2.type;
      if (t1 && t2 && t1 !== t2) {
        addFinding({
          category: 'PARAM_TYPE_CHANGED',
          severity: 'BREAKING',
          path,
          method,
          title: `Type changed for parameter '${p1.name}' (${p1.in})`,
          description: `The data type of parameter '${p1.name}' was changed from '${t1}' to '${t2}'.`,
          olderValue: `Type: ${t1}`,
          newerValue: `Type: ${t2}`,
          impact: `Clients transmitting values formatted as '${t1}' (e.g. integer vs string / UUID) will trigger schema validation rejection (HTTP 400 Bad Request).`,
          recommendation: `Allow flexible coercion if possible, or accept both types using oneOf/anyOf schemas to preserve backward compatibility.`,
          componentLocation: `paths['${path}'].${method.toLowerCase()}.parameters[${p1.name}].type`
        });
      }

      // Check if parameter became required
      if (!p1.required && p2.required) {
        addFinding({
          category: 'PARAM_REQUIRED_ADDED',
          severity: 'BREAKING',
          path,
          method,
          title: `Parameter '${p1.name}' became mandatory (required: true)`,
          description: `The parameter '${p1.name}' in ${p1.in} was optional in version 1, but is now strictly required in version 2.`,
          olderValue: 'optional (required: false)',
          newerValue: 'required: true',
          impact: 'All existing clients that currently omit this parameter will immediately fail with HTTP 400 or 422 Unprocessable Entity.',
          recommendation: 'Provide a server-side default value or keep the parameter optional with fallback logic.',
          componentLocation: `paths['${path}'].${method.toLowerCase()}.parameters[${p1.name}].required`
        });
      }

      // Check enum restrictions
      const enum1 = p1.schema?.enum || p1.enum;
      const enum2 = p2.schema?.enum || p2.enum;
      if (Array.isArray(enum1) && Array.isArray(enum2)) {
        const removedEnumValues = enum1.filter(val => !enum2.includes(val));
        if (removedEnumValues.length > 0) {
          addFinding({
            category: 'ENUM_RESTRICTED',
            severity: 'BREAKING',
            path,
            method,
            title: `Allowed enum values restricted for parameter '${p1.name}'`,
            description: `Values [${removedEnumValues.map(v => `"${v}"`).join(', ')}] were removed from the allowed enum list.`,
            olderValue: `Allowed: [${enum1.join(', ')}]`,
            newerValue: `Allowed: [${enum2.join(', ')}]`,
            impact: `Legacy client applications sending values like "${removedEnumValues[0]}" will be rejected with validation errors.`,
            recommendation: 'Keep legacy enum values active or map deprecated values internally onto modern equivalents.',
            componentLocation: `paths['${path}'].${method.toLowerCase()}.parameters[${p1.name}].enum`
          });
        }
      }
    }
  }

  // B. Check Newly Added Parameters
  for (const [key, p2] of v2ParamMap.entries()) {
    if (!v1ParamMap.has(key)) {
      if (p2.required) {
        addFinding({
          category: 'PARAM_REQUIRED_ADDED',
          severity: 'BREAKING',
          path,
          method,
          title: `Brand new required parameter '${p2.name}' (${p2.in}) added`,
          description: `A newly introduced parameter '${p2.name}' is marked as required: true. Existing consumers are unaware of it.`,
          olderValue: 'Parameter did not exist',
          newerValue: `Required ${p2.in} parameter '${p2.name}'`,
          impact: 'CRITICAL: Breaks 100% of existing client requests unless they are updated to supply this new parameter.',
          recommendation: 'Make new parameters optional or provide a default fallback value on the API server.',
          componentLocation: `paths['${path}'].${method.toLowerCase()}.parameters[${p2.name}]`
        });
      } else {
        addFinding({
          category: 'PARAM_OPTIONAL_ADDED',
          severity: 'NON_BREAKING',
          path,
          method,
          title: `New optional parameter '${p2.name}' (${p2.in}) added`,
          description: `An optional parameter was introduced to enhance functionality without breaking existing calls.`,
          olderValue: 'None',
          newerValue: `Optional ${p2.in} parameter`,
          impact: 'Zero breaking impact. Existing clients can adopt this parameter when ready.',
          recommendation: 'Highlight the new query/header parameter in the release notes.',
          componentLocation: `paths['${path}'].${method.toLowerCase()}.parameters[${p2.name}]`
        });
      }
    }
  }

  // C. Check Request Body Differences
  inspectRequestBody(path, method, v1Op, v2Op, v1Doc, v2Doc, addFinding);

  // D. Check Response Differences
  inspectResponses(path, method, v1Op, v2Op, v1Doc, v2Doc, addFinding);

  // E. Check Security / Authentication on Operation
  inspectOperationSecurity(path, method, v1Op, v2Op, addFinding);
}

function inspectRequestBody(
  path: string,
  method: string,
  v1Op: any,
  v2Op: any,
  v1Doc: any,
  v2Doc: any,
  addFinding: (f: Omit<ApiFinding, 'id'>) => void
) {
  // Support both OpenAPI 3.x requestBody and Swagger 2.0 body parameter
  const getReqBody = (op: any, doc: any) => {
    if (op.requestBody) {
      const rb = resolveRef(op.requestBody, doc);
      const content = rb.content || {};
      const firstContentType = Object.keys(content)[0] || 'application/json';
      const schema = content[firstContentType]?.schema ? resolveRef(content[firstContentType].schema, doc) : null;
      return { required: Boolean(rb.required), contentType: firstContentType, schema };
    }
    // Swagger 2.0 body param
    if (Array.isArray(op.parameters)) {
      const bodyParam = op.parameters.find((p: any) => p.in === 'body');
      if (bodyParam) {
        const resolved = resolveRef(bodyParam, doc);
        return {
          required: Boolean(resolved.required),
          contentType: op.consumes?.[0] || 'application/json',
          schema: resolveRef(resolved.schema, doc)
        };
      }
    }
    return null;
  };

  const rb1 = getReqBody(v1Op, v1Doc);
  const rb2 = getReqBody(v2Op, v2Doc);

  if (!rb1 && rb2 && rb2.required) {
    addFinding({
      category: 'REQUEST_BODY_CHANGED',
      severity: 'BREAKING',
      path,
      method,
      title: `Mandatory request payload now required on ${method} ${path}`,
      description: `Version 1 accepted requests without a payload body, but Version 2 requires an '${rb2.contentType}' payload body.`,
      olderValue: 'No request body required',
      newerValue: `Mandatory request body (${rb2.contentType})`,
      impact: 'Any existing client calling this endpoint without a body will fail with HTTP 400 or HTTP 415.',
      recommendation: 'Allow requests with empty body or support sensible default entities.',
      componentLocation: `paths['${path}'].${method.toLowerCase()}.requestBody`
    });
  }

  if (rb1 && rb2) {
    if (rb1.contentType !== rb2.contentType && !rb2.contentType.includes('*/*')) {
      addFinding({
        category: 'REQUEST_BODY_CHANGED',
        severity: 'BREAKING',
        path,
        method,
        title: `Request Content-Type changed from '${rb1.contentType}' to '${rb2.contentType}'`,
        description: `The accepted media format for the request body has shifted.`,
        olderValue: rb1.contentType,
        newerValue: rb2.contentType,
        impact: `Clients sending Content-Type: ${rb1.contentType} will receive HTTP 415 Unsupported Media Type.`,
        recommendation: `Support multiple content types (e.g. both application/json and ${rb2.contentType}) simultaneously.`,
        componentLocation: `paths['${path}'].${method.toLowerCase()}.requestBody.content`
      });
    }

    // Inspect Schema property changes inside Request Body
    if (rb1.schema && rb2.schema) {
      inspectSchemaProperties(
        path,
        method,
        'requestBody',
        rb1.schema,
        rb2.schema,
        v1Doc,
        v2Doc,
        addFinding
      );
    }
  }
}

function inspectResponses(
  path: string,
  method: string,
  v1Op: any,
  v2Op: any,
  v1Doc: any,
  v2Doc: any,
  addFinding: (f: Omit<ApiFinding, 'id'>) => void
) {
  const v1Resp = v1Op.responses || {};
  const v2Resp = v2Op.responses || {};

  // Check removed response status codes
  for (const status of Object.keys(v1Resp)) {
    if (!v2Resp[status]) {
      const isSuccess = status.startsWith('2');
      addFinding({
        category: 'STATUS_CODE_CHANGED',
        severity: isSuccess ? 'BREAKING' : 'POTENTIALLY_BREAKING',
        path,
        method,
        title: `HTTP ${status} response code removed`,
        description: `Version 1 documented an HTTP ${status} response, but this status code is missing in Version 2.`,
        olderValue: `Response code ${status} documented`,
        newerValue: 'Not documented in v2',
        impact: isSuccess
          ? `High: Client SDKs or code checking 'if (res.status === ${status})' will branch into unhandled error states.`
          : `Medium: Clients handling error code ${status} may receive alternative status codes.`,
        recommendation: `Retain backward compatible response codes or ensure error mappings remain consistent.`,
        componentLocation: `paths['${path}'].${method.toLowerCase()}.responses['${status}']`
      });
    }
  }

  // Inspect 200/201 response schemas
  const primaryStatuses = ['200', '201', 'default'];
  for (const st of primaryStatuses) {
    if (v1Resp[st] && v2Resp[st]) {
      const r1 = resolveRef(v1Resp[st], v1Doc);
      const r2 = resolveRef(v2Resp[st], v2Doc);

      const getSchema = (r: any, doc: any) => {
        if (r.content) {
          const firstKey = Object.keys(r.content)[0];
          return r.content[firstKey]?.schema ? resolveRef(r.content[firstKey].schema, doc) : null;
        }
        if (r.schema) {
          return resolveRef(r.schema, doc);
        }
        return null;
      };

      const s1 = getSchema(r1, v1Doc);
      const s2 = getSchema(r2, v2Doc);

      if (s1 && s2) {
        inspectSchemaProperties(
          path,
          method,
          `response-${st}`,
          s1,
          s2,
          v1Doc,
          v2Doc,
          addFinding
        );
      }
    }
  }
}

function inspectSchemaProperties(
  path: string,
  method: string,
  context: 'requestBody' | string,
  s1Raw: any,
  s2Raw: any,
  doc1: any,
  doc2: any,
  addFinding: (f: Omit<ApiFinding, 'id'>) => void
) {
  const s1 = resolveRef(s1Raw, doc1);
  const s2 = resolveRef(s2Raw, doc2);

  // Check top-level type change
  const type1 = s1.type || (s1.properties ? 'object' : undefined);
  const type2 = s2.type || (s2.properties ? 'object' : undefined);

  if (type1 && type2 && type1 !== type2) {
    addFinding({
      category: 'RESPONSE_SCHEMA_CHANGED',
      severity: 'BREAKING',
      path,
      method,
      title: `Root schema type changed in ${context}`,
      description: `Payload structure transformed from '${type1}' to '${type2}'.`,
      olderValue: `Type: ${type1}`,
      newerValue: `Type: ${type2}`,
      impact: 'Fatal: Strict deserializers and typed clients (Java, Swift, TypeScript, C#) will throw fatal parse exceptions.',
      recommendation: 'Introduce a new major version route or maintain legacy payload envelope.',
      componentLocation: `paths['${path}'].${method.toLowerCase()}.${context}.schema.type`
    });
    return;
  }

  const p1 = s1.properties || {};
  const p2 = s2.properties || {};
  const req1: string[] = s1.required || [];
  const req2: string[] = s2.required || [];

  const isResponse = context.startsWith('response');

  // Check removed properties
  for (const propName of Object.keys(p1)) {
    if (!p2[propName]) {
      if (isResponse) {
        addFinding({
          category: 'RESPONSE_FIELD_REMOVED',
          severity: 'BREAKING',
          path,
          method,
          title: `Field '${propName}' removed from ${context}`,
          description: `The property '${propName}' was eliminated from the output response payload.`,
          olderValue: `Present in response (type: ${p1[propName]?.type || 'object'})`,
          newerValue: 'Field removed',
          impact: `Any client application relying on 'response.${propName}' will now read 'undefined' or null, causing crashes.`,
          recommendation: `Retain '${propName}' in the payload marked as deprecated, or return an empty/null placeholder instead of dropping the key.`,
          componentLocation: `paths['${path}'].${method.toLowerCase()}.${context}.properties['${propName}']`
        });
      } else {
        // In request body, removing a field is generally potentially breaking if clients still send it and strict validation rejects unexpected fields
        addFinding({
          category: 'REQUEST_BODY_CHANGED',
          severity: 'POTENTIALLY_BREAKING',
          path,
          method,
          title: `Property '${propName}' removed from request schema`,
          description: `The input field '${propName}' is no longer declared in the request schema.`,
          olderValue: `Supported property '${propName}'`,
          newerValue: 'Not declared',
          impact: 'If the server has additionalProperties: false, requests sending this legacy field will be rejected with 400 Bad Request.',
          recommendation: 'Allow additionalProperties: true during transitional migrations.',
          componentLocation: `paths['${path}'].${method.toLowerCase()}.requestBody.properties['${propName}']`
        });
      }
    } else {
      // Property exists in both: check property type change
      const prop1Type = p1[propName]?.type;
      const prop2Type = p2[propName]?.type;
      if (prop1Type && prop2Type && prop1Type !== prop2Type) {
        addFinding({
          category: 'RESPONSE_SCHEMA_CHANGED',
          severity: 'BREAKING',
          path,
          method,
          title: `Property '${propName}' type changed (${prop1Type} -> ${prop2Type}) in ${context}`,
          description: `Field '${propName}' changed fundamental datatype from '${prop1Type}' to '${prop2Type}'.`,
          olderValue: `Type: ${prop1Type}`,
          newerValue: `Type: ${prop2Type}`,
          impact: `Strongly typed client parsers expecting ${prop1Type} will encounter JSON decoding errors.`,
          recommendation: `Retain old field and introduce a new field name (e.g. '${propName}_v2' or '${propName}Id') or allow union types.`,
          componentLocation: `paths['${path}'].${method.toLowerCase()}.${context}.properties['${propName}'].type`
        });
      }
    }
  }

  // Check added properties
  for (const propName of Object.keys(p2)) {
    if (!p1[propName]) {
      if (isResponse) {
        addFinding({
          category: 'RESPONSE_FIELD_ADDED',
          severity: 'NON_BREAKING',
          path,
          method,
          title: `New field '${propName}' added to ${context}`,
          description: `A new property '${propName}' (${p2[propName]?.type || 'object'}) was added to the response.`,
          olderValue: 'Field did not exist',
          newerValue: `Added: '${propName}'`,
          impact: 'Non-breaking for standard clients. (Note: rigidly configured XML/JSON schemas with forbidden unknown keys may require schema relaxation).',
          recommendation: 'Document the new field in your release highlights.',
          componentLocation: `paths['${path}'].${method.toLowerCase()}.${context}.properties['${propName}']`
        });
      } else {
        // Request body: check if newly added property is required
        if (req2.includes(propName) && !req1.includes(propName)) {
          addFinding({
            category: 'REQUIRED_FIELD_CHANGED',
            severity: 'BREAKING',
            path,
            method,
            title: `New required field '${propName}' added to request body`,
            description: `The request schema now demands '${propName}' which older client apps never send.`,
            olderValue: 'Field did not exist',
            newerValue: `Required field '${propName}'`,
            impact: 'Breaking: All existing clients sending payloads without this new property will get HTTP 400 Bad Request.',
            recommendation: 'Make the field optional with a sensible default value for backward compatibility.',
            componentLocation: `paths['${path}'].${method.toLowerCase()}.requestBody.required`
          });
        }
      }
    }
  }

  // Check existing fields that turned from optional to required in request
  if (!isResponse) {
    for (const reqField of req2) {
      if (!req1.includes(reqField) && p1[reqField]) {
        addFinding({
          category: 'REQUIRED_FIELD_CHANGED',
          severity: 'BREAKING',
          path,
          method,
          title: `Request property '${reqField}' became required`,
          description: `The field '${reqField}' was previously optional, but is now marked as required in the schema.`,
          olderValue: 'Optional (required: false)',
          newerValue: 'Required (required: true)',
          impact: 'Any legacy client sending a payload omitting this field will be rejected with HTTP 400.',
          recommendation: 'Keep the field optional and handle missing values server-side.',
          componentLocation: `paths['${path}'].${method.toLowerCase()}.requestBody.required`
        });
      }
    }
  }
}

function inspectOperationSecurity(
  path: string,
  method: string,
  v1Op: any,
  v2Op: any,
  addFinding: (f: Omit<ApiFinding, 'id'>) => void
) {
  const s1 = v1Op.security;
  const s2 = v2Op.security;

  if (!s1 && s2 && s2.length > 0) {
    addFinding({
      category: 'AUTH_CHANGED',
      severity: 'BREAKING',
      path,
      method,
      title: `Authentication now enforced on ${method} ${path}`,
      description: `Version 1 was public/unauthenticated, while Version 2 enforces security schemes: ${JSON.stringify(s2)}.`,
      olderValue: 'Public endpoint (no auth required)',
      newerValue: `Enforces authentication: ${s2.map((s: any) => Object.keys(s).join(', ')).join('; ')}`,
      impact: 'Unauthenticated requests from existing clients will fail immediately with HTTP 401 Unauthorized.',
      recommendation: 'Provide an unauthenticated grace period or dual endpoints during migration.',
      componentLocation: `paths['${path}'].${method.toLowerCase()}.security`
    });
  }
}

function inspectGlobalSecurity(
  v1: any,
  v2: any,
  addFinding: (f: Omit<ApiFinding, 'id'>) => void
) {
  const g1 = v1.security || [];
  const g2 = v2.security || [];

  if (g1.length === 0 && g2.length > 0) {
    addFinding({
      category: 'AUTH_CHANGED',
      severity: 'BREAKING',
      path: 'Global',
      title: 'Global authentication enforcement added',
      description: 'The newer API version enforces global security schemes where the older version had none.',
      olderValue: 'No global security',
      newerValue: `Global schemes: ${JSON.stringify(g2)}`,
      impact: 'Any client that does not include authorization headers across all endpoints will be denied access with HTTP 401.',
      recommendation: 'Verify that public healthcheck and discovery endpoints override global security with security: [].',
      componentLocation: 'security'
    });
  }
}
