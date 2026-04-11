/**
 * PaymentUtilities — facade class combining all payment check modules.
 *
 * Methods are organized into separate module files under ./payment/:
 *   - autoPaymentChecks.ts   — 8 auto-pay methods (card + bank, electric/gas/combined)
 *   - manualPaymentChecks.ts — 6 manual-pay methods (card + bank, electric/gas/combined)
 *   - failedPaymentChecks.ts — 12 failed auto-pay recovery methods (alert + pay-bill flows)
 *   - paymentHelpers.ts      — shared helper functions and re-exports
 *
 * Existing test specs import PaymentUtilities from this file — the mixin pattern
 * ensures all methods are available on the class without changing any callers.
 */

import { AutoPaymentChecks } from './payment/autoPaymentChecks';
import { ManualPaymentChecks } from './payment/manualPaymentChecks';
import { FailedPaymentChecks } from './payment/failedPaymentChecks';

// Re-export module classes for direct use in new tests
export { AutoPaymentChecks } from './payment/autoPaymentChecks';
export { ManualPaymentChecks } from './payment/manualPaymentChecks';
export { FailedPaymentChecks } from './payment/failedPaymentChecks';
export {
    ensureRegistrationComplete,
    getPaymentDetailsSingleChargeAccount,
    getPaymentDetailsMultipleChargeAccounts,
} from './payment/paymentHelpers';

// Combined interface — gives TypeScript knowledge of all methods
export interface PaymentUtilities extends AutoPaymentChecks, ManualPaymentChecks, FailedPaymentChecks {}

// Backward-compatible class that has ALL methods from every module
export class PaymentUtilities {}

// Apply mixins — copies prototype methods from each module class
for (const ModuleClass of [AutoPaymentChecks, ManualPaymentChecks, FailedPaymentChecks]) {
    for (const name of Object.getOwnPropertyNames(ModuleClass.prototype)) {
        if (name !== 'constructor') {
            const descriptor = Object.getOwnPropertyDescriptor(ModuleClass.prototype, name);
            if (descriptor) {
                Object.defineProperty(PaymentUtilities.prototype, name, descriptor);
            }
        }
    }
}

export default PaymentUtilities;
