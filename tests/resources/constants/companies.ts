/**
 * Utility company constants and configurations
 */

/**
 * Supported utility company identifiers
 */
export const UTILITY_COMPANIES = {
  COMED: 'COMED',
  CON_EDISON: 'CON-EDISON',
  EVERSOURCE: 'EVERSOURCE',
  TX_DEREG: 'TX-DEREG',
  COSERV: 'COSERV',
  BGE: 'BGE',
  NGMA: 'NGMA',
  DTE: 'DTE',
  PSEG: 'PSEG',
  DOMINION: 'DOMINION',
  EVERGY: 'EVERGY',
  DELMARVA: 'DELMARVA',
  PGE: 'PGE',
  ACE: 'ACE',
  FPL: 'FPL',
  XCEL_ENERGY: 'XCEL-ENERGY',
  PSEG_LI: 'PSEG-LI',
  LA_DWP: 'LA-DWP',
  SCE: 'SCE',
  SDGE: 'SDGE',
  PECO: 'PECO',
  PEPCO: 'PEPCO',
  POTOMAC_EDISON: 'POTOMAC-EDISON',
  PSE: 'PSE',
  DUKE: 'DUKE',
  NYS_EG: 'NYS-EG',
} as const;

/**
 * Map company names to their normalized keys (for dynamic access)
 */
export const COMPANY_KEY_MAP: Record<string, string> = {
  'COMED': 'COMED',
  'CON-EDISON': 'CON_EDISON',
  'CON_EDISON': 'CON_EDISON',
  'EVERSOURCE': 'EVERSOURCE',
  'TX-DEREG': 'TX_DEREG',
  'TX_DEREG': 'TX_DEREG',
  'COSERV': 'COSERV',
  'BGE': 'BGE',
  'NGMA': 'NGMA',
  'DTE': 'DTE',
  'PSEG': 'PSEG',
  'DOMINION': 'DOMINION',
  'EVERGY': 'EVERGY',
  'DELMARVA': 'DELMARVA',
  'PGE': 'PGE',
  'ACE': 'ACE',
  'FPL': 'FPL',
  'XCEL-ENERGY': 'XCEL_ENERGY',
  'XCEL_ENERGY': 'XCEL_ENERGY',
  'PSEG-LI': 'PSEG_LI',
  'PSEG_LI': 'PSEG_LI',
  'LA-DWP': 'LA_DWP',
  'LA_DWP': 'LA_DWP',
  'SCE': 'SCE',
  'SDGE': 'SDGE',
  'PECO': 'PECO',
  'PEPCO': 'PEPCO',
  'POTOMAC-EDISON': 'POTOMAC_EDISON',
  'POTOMAC_EDISON': 'POTOMAC_EDISON',
  'PSE': 'PSE',
  'DUKE': 'DUKE',
  'NYS-EG': 'NYS_EG',
  'NYS_EG': 'NYS_EG',
};

/**
 * Companies that have special questions during move-in
 */
export const COMPANIES_WITH_QUESTIONS = [
  UTILITY_COMPANIES.CON_EDISON,
  UTILITY_COMPANIES.BGE,
  UTILITY_COMPANIES.TX_DEREG,
] as const;

/**
 * Companies that require Texas service agreement
 */
export const TEXAS_COMPANIES = [
  UTILITY_COMPANIES.TX_DEREG,
  UTILITY_COMPANIES.COSERV,
] as const;

/**
 * Companies that require ESCO disclosure (NY-based)
 */
export const ESCO_COMPANIES = [
  UTILITY_COMPANIES.CON_EDISON,
] as const;

/**
 * Normalize company name for method lookup
 * @example normalizeCompanyName('CON-EDISON') => 'CON_EDISON'
 */
export function normalizeCompanyName(company: string | null): string | null {
  if (!company) return null;
  return company.replace(/-/g, '_');
}

/**
 * Check if company has questions during move-in
 */
export function hasCompanyQuestions(company: string | null): boolean {
  if (!company) return false;
  return COMPANIES_WITH_QUESTIONS.includes(company as any);
}

/**
 * Check if company requires Texas agreement
 */
export function isTexasCompany(company: string | null): boolean {
  if (!company) return false;
  return TEXAS_COMPANIES.includes(company as any);
}

/**
 * Check if company requires ESCO disclosure
 */
export function isEscoCompany(company: string | null): boolean {
  if (!company) return false;
  return ESCO_COMPANIES.includes(company as any);
}

export type UtilityCompanyType = typeof UTILITY_COMPANIES[keyof typeof UTILITY_COMPANIES];
