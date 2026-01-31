/**
 * Test helpers and utilities for common test patterns
 */

/**
 * OTP (One-Time Password) validation error
 */
export class OTPValidationError extends Error {
  constructor(message: string = 'Invalid or missing OTP') {
    super(message);
    this.name = 'OTPValidationError';
  }
}

/**
 * Type guard to check if OTP is a valid string
 */
export function isValidOTP(otp: unknown): otp is string {
  return typeof otp === 'string' && otp.length > 0;
}

/**
 * Validates OTP and throws a descriptive error if invalid
 * @param otp - The OTP value to validate
 * @returns The validated OTP string
 * @throws OTPValidationError if OTP is invalid
 */
export function validateOTP(otp: unknown): string {
  if (!isValidOTP(otp)) {
    throw new OTPValidationError(
      `Expected valid OTP string, received: ${typeof otp === 'string' ? 'empty string' : typeof otp}`
    );
  }
  return otp;
}

/**
 * Generic test data type guard
 */
export function assertDefined<T>(
  value: T | null | undefined,
  errorMessage: string = 'Expected value to be defined'
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(errorMessage);
  }
}

/**
 * Retry configuration for async operations
 */
export interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
}

/**
 * Retry an async operation with configurable attempts and delay
 */
export async function retryAsync<T>(
  operation: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { maxAttempts, delayMs, backoffMultiplier = 1 } = options;
  let lastError: Error | undefined;
  let currentDelay = delayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay *= backoffMultiplier;
      }
    }
  }

  throw new Error(
    `Operation failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`
  );
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => Promise<boolean> | boolean,
  options: { timeoutMs: number; intervalMs: number; description?: string }
): Promise<void> {
  const { timeoutMs, intervalMs, description = 'condition' } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeoutMs) {
    if (await condition()) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

  throw new Error(`Timeout waiting for ${description} after ${timeoutMs}ms`);
}
