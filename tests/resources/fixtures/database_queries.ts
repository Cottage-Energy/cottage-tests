/**
 * Database Queries - Backward Compatibility Layer
 * 
 * This file re-exports from the new modular structure.
 * For new code, prefer importing directly from './database'
 * 
 * @deprecated Import from './database' instead for better organization
 * @example
 * // Old way (still works):
 * import { userQueries } from './database_queries';
 * 
 * // New way (preferred):
 * import { userQueries, accountQueries, billQueries } from './database';
 */

export { userQueries, UserQueries } from './database/userQueries';
export { accountQueries, AccountQueries } from './database/accountQueries';
export { billQueries, BillQueries } from './database/billQueries';
export { paymentQueries, PaymentQueries } from './database/paymentQueries';
export { utilityQueries, UtilityQueries } from './database/utilityQueries';
export { cleanupQueries, CleanupQueries } from './database/cleanupQueries';
