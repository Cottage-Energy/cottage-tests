/**
 * Test tags for organizing and filtering tests
 * Use these constants in test files for consistency
 */

export const TEST_TAGS = {
  /** Smoke tests - critical path verification */
  SMOKE: '@smoke',
  
  /** Regression test suites */
  REGRESSION1: '@regression1',
  REGRESSION2: '@regression2',
  REGRESSION3: '@regression3',
  REGRESSION4: '@regression4',
  REGRESSION5: '@regression5',
  
  /** Feature-specific tags */
  MOVE_IN: '@move-in',
  PAYMENT: '@payment',
  BILL_UPLOAD: '@bill-upload',
  HOMEPAGE: '@homepage',
  
  /** User type tags */
  NEW_USER: '@new-user',
  EXISTING_USER: '@existing-user',
  LIGHT_USER: '@light-user',
  
  /** Payment method tags */
  AUTO_PAYMENT: '@auto-payment',
  MANUAL_PAYMENT: '@manual-payment',
  BANK_PAYMENT: '@bank-payment',
  CARD_PAYMENT: '@card-payment',
  
  /** Utility company tags */
  COMED: '@comed',
  CON_EDISON: '@con-edison',
  EVERSOURCE: '@eversource',
  BGE: '@bge',
  TX_DEREG: '@tx-dereg',
  
  /** Test type tags */
  UI: '@ui',
  API: '@api',
  E2E: '@e2e',
  
  /** Priority tags */
  P1: '@p1',
  P2: '@p2',
  P3: '@p3',
  
  /** Combined tags */
  ALL_REGRESSION: ['@regression1', '@regression2', '@regression3', '@regression4', '@regression5'],
  SMOKE_REGRESSION1: ['@smoke', '@regression1'],
} as const;

/**
 * Combine multiple tags for a test
 * @example combineTags(TEST_TAGS.SMOKE, TEST_TAGS.MOVE_IN)
 */
export function combineTags(...tags: string[]): string[] {
  return tags;
}

export type TestTagKey = keyof typeof TEST_TAGS;
