/**
 * Database Queries - Backward Compatibility Layer
 * 
 * This file re-exports from the new modular structure.
 * For new code, prefer importing directly from './database'
 * 
 * @deprecated Import from './database' instead for better organization
 * @example
 * // Old way (still works):
 * import { SupabaseQueries } from './database_queries';
 * 
 * // New way (preferred):
 * import { userQueries, accountQueries, billQueries } from './database';
 */

export { SupabaseQueries } from './database/SupabaseQueries';
export { userQueries, UserQueries } from './database/userQueries';
export { accountQueries, AccountQueries } from './database/accountQueries';
export { billQueries, BillQueries } from './database/billQueries';
export { paymentQueries, PaymentQueries } from './database/paymentQueries';
export { utilityQueries, UtilityQueries } from './database/utilityQueries';
export { cleanupQueries, CleanupQueries } from './database/cleanupQueries';

// Default export for backward compatibility
import { SupabaseQueries } from './database/SupabaseQueries';
export default SupabaseQueries;
