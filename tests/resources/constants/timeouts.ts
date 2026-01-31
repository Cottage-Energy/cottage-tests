/**
 * Centralized timeout constants for consistent test timing
 * All values are in milliseconds
 */

export const TIMEOUTS = {
  /** Default timeout for most operations */
  DEFAULT: 30000,
  
  /** Short timeout for quick checks */
  SHORT: 5000,
  
  /** Medium timeout for standard waits */
  MEDIUM: 10000,
  
  /** Long timeout for extended operations */
  LONG: 60000,
  
  /** Extra long timeout for complex flows */
  EXTRA_LONG: 120000,
  
  /** Extended timeout for complex multi-step flows */
  EXTENDED: 150000,
  
  /** Test timeout for entire test execution */
  TEST: 600000,
  
  /** Polling interval for retry loops */
  POLL_INTERVAL: 1000,
  
  /** Fast polling for quick status checks */
  FAST_POLL_INTERVAL: 100,
  
  /** Animation/transition wait */
  ANIMATION: 500,
  
  /** Brief pause for UI stabilization */
  UI_STABILIZE: 1000,
} as const;

/**
 * Retry configuration constants
 */
export const RETRY_CONFIG = {
  /** Maximum retries for bill processing */
  BILL_PROCESSING_MAX_RETRIES: 450,
  
  /** Maximum retries for payment status */
  PAYMENT_STATUS_MAX_RETRIES: 900,
  
  /** Maximum retries for payment processing */
  PAYMENT_PROCESSING_MAX_RETRIES: 3000,
  
  /** Maximum retries for utility remittance */
  UTILITY_REMITTANCE_MAX_RETRIES: 300,
  
  /** Maximum retries for charge account */
  CHARGE_ACCOUNT_MAX_RETRIES: 2,
  
  /** Delay between charge account retries (ms) */
  CHARGE_ACCOUNT_RETRY_DELAY: 60000,

  /** OTP email retry configuration */
  OTP: {
    maxRetries: 5,
    delayMs: 15000,
  },

  /** Email confirmation retry configuration */
  EMAIL_CONFIRMATION: {
    maxRetries: 5,
    delayMs: 15000,
  },
} as const;

export type TimeoutKey = keyof typeof TIMEOUTS;
export type RetryConfigKey = keyof typeof RETRY_CONFIG;
