/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ApiFinding, AiExplanation } from '../../types/api';

export function getFallbackExplanation(finding: ApiFinding, v1Name: string, v2Name: string): AiExplanation {
  const method = finding.method ? `[${finding.method}]` : '';

  switch (finding.category) {
    case 'ENDPOINT_REMOVED':
      return {
        simpleSummary: `The endpoint ${method} ${finding.path} was completely decommissioned in ${v2Name}.`,
        rootCauseImpact: `Any frontend, mobile application, or external webhook calling this path will receive HTTP 404 (Not Found). Hardcoded URLs in existing client bundles will fail permanently until patched.`,
        migrationSteps: [
          `Audit backend logs to identify which client API keys or user agents are still querying ${finding.path}.`,
          `Set up an API Gateway reverse-proxy rewrite or an HTTP 301/308 Permanent Redirect to the new target route.`,
          `Update client-side SDKs or API client models to point to the designated replacement resource.`
        ],
        migrationChecklist: [
          { task: `Verify deprecation telemetry on ${finding.path}`, priority: 'HIGH' },
          { task: `Deploy edge proxy rewrite or mock compatibility shim`, priority: 'HIGH' },
          { task: `Notify external API consumers of the sunset timeline`, priority: 'MEDIUM' }
        ],
        architecturalRisks: [
          'Immediate downtime for older un-updated mobile app versions installed on user devices.',
          'Broken third-party integrations and partner API synchronizations.'
        ]
      };

    case 'METHOD_REMOVED':
      return {
        simpleSummary: `HTTP method ${method} on route ${finding.path} is no longer permitted.`,
        rootCauseImpact: `Clients submitting requests with ${method} will receive HTTP 405 (Method Not Allowed). The Allowed header will reject the call.`,
        migrationSteps: [
          `Identify the alternative HTTP verb or designated endpoint in ${v2Name}.`,
          `Refactor client API services to invoke the new approved method.`,
          `Add an automated contract test to prevent regression.`
        ],
        migrationChecklist: [
          { task: `Locate all client references to ${method} ${finding.path}`, priority: 'HIGH' },
          { task: `Migrate callers to the replacement endpoint or method`, priority: 'HIGH' }
        ],
        architecturalRisks: [
          'Clients may attempt infinite retry loops on unexpected 405 error responses.'
        ]
      };

    case 'PARAM_REQUIRED_ADDED':
    case 'REQUIRED_FIELD_CHANGED':
      return {
        simpleSummary: `A newly mandated parameter or required request field was introduced that legacy clients do not send.`,
        rootCauseImpact: `Input schema validators on the server (like express-validator, Ajv, or Joi) will immediately reject requests missing this key, triggering HTTP 400 (Bad Request) or 422 (Unprocessable Content).`,
        migrationSteps: [
          `Check whether the server can provision a sensible default value for legacy consumers.`,
          `Update client request builders to populate the mandatory attribute prior to dispatch.`,
          `Release a new version of the client SDK containing TypeScript type definitions for the required field.`
        ],
        migrationChecklist: [
          { task: `Add server fallback default to maintain backwards compatibility`, priority: 'HIGH' },
          { task: `Update client payloads with the newly required attribute`, priority: 'HIGH' },
          { task: `Update integration test suites`, priority: 'MEDIUM' }
        ],
        architecturalRisks: [
          'Sudden spike in HTTP 400 error rates across all unmigrated clients.',
          'Loss of transactional data from existing client forms.'
        ]
      };

    case 'PARAM_TYPE_CHANGED':
    case 'RESPONSE_SCHEMA_CHANGED':
      return {
        simpleSummary: `A data format mismatch occurred: data types differ between version specifications.`,
        rootCauseImpact: `Strictly typed client runtimes (TypeScript, Android Kotlin, iOS Swift, Go, Java) expecting one primitive will throw unhandled JSON deserialization or decoding exceptions during response parsing.`,
        migrationSteps: [
          `Verify the schema definitions and check if polymorphic types (e.g. union type or string parsing) can be accommodated.`,
          `Update client data models to parse the new data type.`,
          `Deploy a serializer adapter in the API gateway to convert between formats during transition.`
        ],
        migrationChecklist: [
          { task: `Update client model parser and serialization tests`, priority: 'HIGH' },
          { task: `Deploy backward-compatible response transformer if legacy apps must be supported`, priority: 'MEDIUM' }
        ],
        architecturalRisks: [
          'Client application crashes on startup or during view rendering due to unhandled JSON parsing exceptions.'
        ]
      };

    case 'RESPONSE_FIELD_REMOVED':
      return {
        simpleSummary: `A response property previously returned in ${v1Name} is omitted from ${v2Name}.`,
        rootCauseImpact: `Client UI code that attempts to render or access 'response.data.field' will read 'undefined', leading to JavaScript TypeError ('Cannot read properties of undefined') or blank UI elements.`,
        migrationSteps: [
          `Check if the omitted data is available under an alternate property or nested object.`,
          `Add defensive optional-chaining (e.g. 'data?.field ?? fallback') across all consumer applications.`,
          `Restore the field in the API with a deprecation tag if widespread client usage remains.`
        ],
        migrationChecklist: [
          { task: `Add defensive null/undefined guards in frontend consumer code`, priority: 'HIGH' },
          { task: `Evaluate whether the field can be returned as null rather than omitted`, priority: 'MEDIUM' }
        ],
        architecturalRisks: [
          'Silent functional degradation or UI component crashes for end users.'
        ]
      };

    case 'AUTH_CHANGED':
      return {
        simpleSummary: `Authentication or security schemes on ${method} ${finding.path} have changed.`,
        rootCauseImpact: `Requests sent without the required Authorization bearer tokens or API key headers will be rejected at the gateway with HTTP 401 (Unauthorized) or 403 (Forbidden).`,
        migrationSteps: [
          `Review the security schemes required by ${v2Name} (e.g. Bearer JWT, OAuth2, ApiKey).`,
          `Configure client HTTP interceptors to attach the requisite authorization tokens.`,
          `Ensure credentials provisioning workflows are accessible to all authorized consumers.`
        ],
        migrationChecklist: [
          { task: `Update client auth token interceptors`, priority: 'HIGH' },
          { task: `Verify token refresh and expiration handling`, priority: 'HIGH' }
        ],
        architecturalRisks: [
          'Complete inability for unauthenticated clients to communicate with the service.'
        ]
      };

    case 'ENUM_RESTRICTED':
      return {
        simpleSummary: `Permitted enumeration values have been restricted or narrowed.`,
        rootCauseImpact: `Clients sending previously valid enum values will be rejected with validation errors. Clients with rigid enums on responses may crash when unhandled values arrive.`,
        migrationSteps: [
          `Check existing database records or client options to eliminate retired enum values.`,
          `Implement server-side mapping from retired enum values to modern equivalents.`,
          `Update client select menus and validation rules.`
        ],
        migrationChecklist: [
          { task: `Update client-side dropdowns and enums`, priority: 'HIGH' },
          { task: `Add server fallback mapping for legacy enum inputs`, priority: 'MEDIUM' }
        ],
        architecturalRisks: [
          'Form submission failures and validation rejections for users selecting legacy options.'
        ]
      };

    default:
      return {
        simpleSummary: finding.description,
        rootCauseImpact: finding.impact,
        migrationSteps: [
          finding.recommendation,
          'Test all affected routes in a staging environment prior to production rollout.',
          'Monitor application telemetry and 4xx/5xx error rates after deploying changes.'
        ],
        migrationChecklist: [
          { task: `Review ${finding.path} specifications`, priority: 'MEDIUM' },
          { task: `Run end-to-end regression test suite`, priority: 'HIGH' }
        ],
        architecturalRisks: [
          'Potential client mismatch during deployment transition windows.'
        ]
      };
  }
}
