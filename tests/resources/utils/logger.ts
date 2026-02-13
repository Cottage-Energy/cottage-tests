/**
 * Centralized logging utility for consistent test output
 * Provides structured logging with different levels and formatting
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  SILENT = 4,
}

interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
  showTimestamp?: boolean;
}

const DEFAULT_CONFIG: LoggerConfig = {
  level: process.env.LOG_LEVEL ? parseInt(process.env.LOG_LEVEL) : LogLevel.INFO,
  showTimestamp: true,
};

/**
 * Logger class for structured test output
 * 
 * @example
 * ```typescript
 * const logger = new Logger('UserQueries');
 * logger.info('Checking cottage user', { email: 'test@example.com' });
 * logger.debug('Query result', { userId: '123' });
 * ```
 */
export class Logger {
  private config: LoggerConfig;
  private prefix: string;

  constructor(prefix: string = '', config: Partial<LoggerConfig> = {}) {
    this.prefix = prefix;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private formatMessage(level: string, message: string, data?: Record<string, unknown>): string {
    const parts: string[] = [];

    if (this.config.showTimestamp) {
      parts.push(`[${new Date().toISOString()}]`);
    }

    parts.push(`[${level}]`);

    if (this.prefix) {
      parts.push(`[${this.prefix}]`);
    }

    parts.push(message);

    if (data && Object.keys(data).length > 0) {
      parts.push(JSON.stringify(data, null, 2));
    }

    return parts.join(' ');
  }

  /**
   * Log debug information (only shown when LOG_LEVEL=0)
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.config.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  /**
   * Log general information
   */
  info(message: string, data?: Record<string, unknown>): void {
    if (this.config.level <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  /**
   * Log warnings
   */
  warn(message: string, data?: Record<string, unknown>): void {
    if (this.config.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  /**
   * Log errors
   */
  error(message: string, data?: Record<string, unknown>): void {
    if (this.config.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message, data));
    }
  }

  /**
   * Log step in a test flow (always visible unless SILENT)
   */
  step(stepNumber: number, description: string): void {
    if (this.config.level < LogLevel.SILENT) {
      console.info(this.formatMessage('STEP', `${stepNumber}. ${description}`));
    }
  }

  /**
   * Log test section header
   */
  section(title: string): void {
    if (this.config.level < LogLevel.SILENT) {
      console.info('\n' + '='.repeat(60));
      console.info(this.formatMessage('SECTION', title));
      console.info('='.repeat(60) + '\n');
    }
  }

  /**
   * Create a child logger with additional prefix
   */
  child(childPrefix: string): Logger {
    const newPrefix = this.prefix ? `${this.prefix}:${childPrefix}` : childPrefix;
    return new Logger(newPrefix, this.config);
  }
}

/**
 * Pre-configured loggers for different modules
 */
export const loggers = {
  database: new Logger('Database'),
  moveIn: new Logger('MoveIn'),
  payment: new Logger('Payment'),
  fastmail: new Logger('Fastmail'),
  cleanup: new Logger('Cleanup'),
  test: new Logger('Test'),
} as const;

/**
 * Create a logger with a custom prefix
 */
export function createLogger(prefix: string, config?: Partial<LoggerConfig>): Logger {
  return new Logger(prefix, config);
}

/**
 * Default logger instance
 */
export const logger = new Logger();
