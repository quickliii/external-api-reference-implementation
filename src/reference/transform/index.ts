export type { LIXIEnvelope, QuickliApiScenario, TransformResult } from './types';

import type { LIXIEnvelope, QuickliApiScenario, TransformResult } from './types';

import convertLixiToScenario from './lixiToScenario/convertLixiToScenario';
import convertScenarioToLixi from './scenarioToLixi/convertScenarioToLixi';

/**
 * Convert a LIXI payload to a QuickliApiScenario (v2 → v3).
 *
 * This is a pure, synchronous function — no network calls, no credentials
 * required. The LIXI envelope must have the shape:
 *   `{ content: { application: { … } } }`
 */
export function lixiToScenario(
  lixi: LIXIEnvelope,
): TransformResult {
  try {
    if (!lixi?.content?.application) {
      return {
        success: false,
        errors: ['LIXI payload must have the shape { content: { application: { … } } }'],
      };
    }

    const scenario = convertLixiToScenario(lixi.content.application);

    return {
      success: true,
      data: { scenario } as unknown as Record<string, unknown>,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        `Conversion failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      ],
    };
  }
}

/**
 * Convert a QuickliApiScenario to a LIXI payload (v3 → v2).
 *
 * This is a pure, synchronous function — no network calls, no credentials
 * required.
 */
export function scenarioToLixi(
  input: QuickliApiScenario,
): TransformResult {
  try {
    // Accept both { scenario: { … } } and the bare shape
    const raw = input as Record<string, unknown>;
    const scenario = (
      raw.scenario && typeof raw.scenario === 'object'
        ? raw.scenario
        : raw
    ) as QuickliApiScenario;

    const requiredArrays = [
      'households',
      'income',
      'self_employed_income',
      'home_loans',
      'liabilities',
      'living_expenses',
    ] as const;

    const missing = requiredArrays.filter(
      (key) => !Array.isArray((scenario as Record<string, unknown>)?.[key]),
    );

    if (missing.length > 0) {
      return {
        success: false,
        errors: [
          `Invalid scenario: missing required array fields: ${missing.join(', ')}`,
        ],
      };
    }

    const lixi = convertScenarioToLixi(scenario);

    return {
      success: true,
      data: { content: { application: lixi } } as unknown as Record<string, unknown>,
    };
  } catch (error) {
    return {
      success: false,
      errors: [
        `Conversion failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      ],
    };
  }
}
