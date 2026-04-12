import { logger } from './logger';

/**
 * Direct SQL execution for querying non-public schemas (e.g., blnk).
 *
 * The Supabase JS client only accesses the `public` schema via PostgREST.
 * For blnk.balances and blnk.transactions, we need raw SQL access.
 *
 * Uses the Supabase Management API (same as MCP execute_sql) with
 * the SUPABASE_ACCESS_TOKEN already in .env. No database password needed.
 */

const SUPABASE_API_BASE = 'https://api.supabase.com/v1';

function getProjectRef(): string {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL env var is required');
  }
  return supabaseUrl.replace('https://', '').split('.')[0];
}

function getAccessToken(): string {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    throw new Error(
      'SUPABASE_ACCESS_TOKEN env var is required for BLNK schema queries. ' +
      'This is already in your .env (sbp_... token).'
    );
  }
  return token;
}

/**
 * Execute a raw SQL query against the Postgres database via Supabase Management API.
 *
 * @example
 * ```typescript
 * const rows = await executeSQL<BlnkBalance>(
 *   'SELECT * FROM blnk.balances WHERE balance_id = $1',
 *   ['bln_abc123']
 * );
 * ```
 */
export async function executeSQL<T = Record<string, unknown>>(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<T[]> {
  const projectRef = getProjectRef();
  const accessToken = getAccessToken();

  // Replace $1, $2, etc. with actual values (Management API doesn't support parameterized queries)
  let interpolatedQuery = query;
  if (params) {
    params.forEach((param, index) => {
      const placeholder = `$${index + 1}`;
      let value: string;
      if (param === null) {
        value = 'NULL';
      } else if (typeof param === 'string') {
        value = `'${param.replace(/'/g, "''")}'`;
      } else {
        value = String(param);
      }
      interpolatedQuery = interpolatedQuery.replace(placeholder, value);
    });
  }

  const response = await fetch(
    `${SUPABASE_API_BASE}/projects/${projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: interpolatedQuery }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    logger.error(`SQL query failed (${response.status}): ${interpolatedQuery}`, { error: errorText });
    throw new Error(`SQL execution failed: ${response.status} — ${errorText}`);
  }

  const result: unknown = await response.json();

  // Management API returns an array of rows directly
  if (Array.isArray(result)) {
    return result as T[];
  }

  // Some responses wrap in a result field
  if (result !== null && typeof result === 'object' && 'result' in result) {
    const wrapped = (result as Record<string, unknown>).result;
    if (Array.isArray(wrapped)) {
      return wrapped as T[];
    }
  }

  return [];
}

/**
 * Execute a raw SQL query and return a single row.
 * Throws if no rows returned.
 */
export async function executeSQLSingle<T = Record<string, unknown>>(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<T> {
  const rows = await executeSQL<T>(query, params);
  if (rows.length === 0) {
    throw new Error(`Expected 1 row, got 0. Query: ${query}`);
  }
  return rows[0];
}

/**
 * Execute a raw SQL query and return a single row or null.
 */
export async function executeSQLMaybeSingle<T = Record<string, unknown>>(
  query: string,
  params?: (string | number | boolean | null)[]
): Promise<T | null> {
  const rows = await executeSQL<T>(query, params);
  return rows.length > 0 ? rows[0] : null;
}
