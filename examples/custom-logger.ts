/**
 * Custom Logger Examples - TypeScript Firestore Admin Helper
 *
 * This file demonstrates how to use custom loggers with FirestoreHelper
 * Supports any logging library: Winston, Pino, Bunyan, or custom implementations
 */

import admin from 'firebase-admin';
import FirestoreHelper, {Logger, BaseDocument} from '../src/index';

// Initialize Firebase Admin (replace with your config)
// admin.initializeApp({ ... });
const db = admin.firestore();

interface User extends BaseDocument {
  name: string;
  email: string;
  age: number;
}

// ============================================
// Example 1: Using Default Console Logger
// ============================================

const usersDefault = new FirestoreHelper<User>(db, 'users');
// Uses console.log, console.error, console.warn, console.debug by default

async function exampleDefault() {
  try {
    await usersDefault.addDocument({
      name: 'John Doe',
      email: 'john@example.com',
      age: 30,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Failed to add document:', error.message);
    }
  }
}

// ============================================
// Example 2: Silent Mode (No Logging)
// ============================================

const usersSilent = new FirestoreHelper<User>(db, 'users', {
  logger: 'silent', // No logs will be output
});

async function exampleSilent() {
  try {
    // This will not log anything even if errors occur
    await usersSilent.addDocument({
      name: 'Jane Doe',
      email: 'jane@example.com',
      age: 25,
    });
  } catch (error) {
    // Handle errors silently or with custom logic
    if (error instanceof Error) {
      // Custom error handling without logging
    }
  }
}

// ============================================
// Example 3: Custom Simple Logger
// ============================================

class SimpleFileLogger implements Logger {
  private prefix: string;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  debug(message: string, ...meta: unknown[]): void {
    this.log('DEBUG', message, ...meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.log('INFO', message, ...meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.log('WARN', message, ...meta);
  }

  error(message: string, ...meta: unknown[]): void {
    this.log('ERROR', message, ...meta);
  }

  private log(level: string, message: string, ...meta: unknown[]): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
    console.log(
      `[${timestamp}] [${this.prefix}] [${level}] ${message}${metaStr}`
    );
  }
}

const usersCustom = new FirestoreHelper<User>(db, 'users', {
  logger: new SimpleFileLogger('FIRESTORE'),
  debug: true, // Enable debug logging
});

async function exampleCustomLogger() {
  try {
    await usersCustom.addDocument({
      name: 'Bob Wilson',
      email: 'bob@example.com',
      age: 35,
    });
    // Output: [2024-01-01T12:00:00.000Z] [FIRESTORE] [DEBUG] Adding document with ID: abc123 {...}
  } catch (error) {
    if (error instanceof Error) {
      console.error('Operation failed:', error.message);
    }
  }
}

// ============================================
// Example 4: Winston Logger Integration
// ============================================

// npm install winston @types/winston

/*
import winston from 'winston';

const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Winston already has debug, info, warn, error methods that match our Logger interface
const usersWithWinston = new FirestoreHelper<User>(db, 'users', {
  logger: winstonLogger,
  debug: true,
});
*/

// ============================================
// Example 5: Pino Logger Integration
// ============================================

// npm install pino

/*
import pino from 'pino';

const pinoLogger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

// Pino already has debug, info, warn, error methods
const usersWithPino = new FirestoreHelper<User>(db, 'users', {
  logger: pinoLogger,
  debug: true,
});
*/

// ============================================
// Example 6: Custom Logger with Filtering
// ============================================

class FilteredLogger implements Logger {
  private minLevel: 'debug' | 'info' | 'warn' | 'error';
  private levels = {debug: 0, info: 1, warn: 2, error: 3};

  constructor(minLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.minLevel = minLevel;
  }

  debug(message: string, ...meta: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug('[DEBUG]', message, ...meta);
    }
  }

  info(message: string, ...meta: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info('[INFO]', message, ...meta);
    }
  }

  warn(message: string, ...meta: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn('[WARN]', message, ...meta);
    }
  }

  error(message: string, ...meta: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error('[ERROR]', message, ...meta);
    }
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }
}

// Only log warnings and errors
const usersFiltered = new FirestoreHelper<User>(db, 'users', {
  logger: new FilteredLogger('warn'),
  debug: false,
});

// ============================================
// Example 7: Logger with External Service
// ============================================

class CloudLogger implements Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  debug(message: string, ...meta: unknown[]): void {
    this.sendToCloud('debug', message, meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.sendToCloud('info', message, meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.sendToCloud('warn', message, meta);
  }

  error(message: string, ...meta: unknown[]): void {
    this.sendToCloud('error', message, meta);
  }

  private sendToCloud(level: string, message: string, meta: unknown[]): void {
    // In real implementation, send to cloud logging service
    // (Google Cloud Logging, AWS CloudWatch, Datadog, etc.)
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      level,
      message,
      metadata: meta,
    };

    // Example: Send to external service
    // await fetch('https://logs.example.com/api/log', {
    //   method: 'POST',
    //   body: JSON.stringify(logEntry)
    // });

    console.log('Would send to cloud:', logEntry);
  }
}

const usersCloud = new FirestoreHelper<User>(db, 'users', {
  logger: new CloudLogger('my-app'),
  debug: true,
});

// ============================================
// Example 8: Structured Logging
// ============================================

interface StructuredLog {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  metadata?: unknown[];
}

class StructuredLogger implements Logger {
  private context: Record<string, unknown>;

  constructor(context: Record<string, unknown> = {}) {
    this.context = context;
  }

  debug(message: string, ...meta: unknown[]): void {
    this.log('debug', message, meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.log('info', message, meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.log('warn', message, meta);
  }

  error(message: string, ...meta: unknown[]): void {
    this.log('error', message, meta);
  }

  private log(level: string, message: string, meta: unknown[]): void {
    const logEntry: StructuredLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      metadata: meta.length > 0 ? meta : undefined,
    };

    // Output as JSON for log aggregation tools
    console.log(JSON.stringify(logEntry));
  }
}

const usersStructured = new FirestoreHelper<User>(db, 'users', {
  logger: new StructuredLogger({
    environment: 'production',
    service: 'user-service',
    version: '1.0.0',
  }),
  debug: false,
});

// ============================================
// Example 9: Development vs Production Logger
// ============================================

function createLogger(env: 'development' | 'production'): Logger {
  if (env === 'development') {
    // Verbose console logging for development
    return new SimpleFileLogger('DEV');
  } else {
    // Structured JSON logging for production
    return new StructuredLogger({
      environment: 'production',
      hostname: process.env.HOSTNAME,
    });
  }
}

const usersEnv = new FirestoreHelper<User>(db, 'users', {
  logger: createLogger(
    (process.env.NODE_ENV as 'development' | 'production') || 'development'
  ),
  debug: process.env.NODE_ENV === 'development',
});

// ============================================
// Usage Examples
// ============================================

async function runExamples() {
  console.log('=== Custom Logger Examples ===\n');

  console.log('1. Default console logger');
  await exampleDefault();

  console.log('\n2. Silent mode (no logs)');
  await exampleSilent();

  console.log('\n3. Custom logger with prefix');
  await exampleCustomLogger();

  console.log('\n=== All examples completed ===');
}

// Uncomment to run examples
// runExamples().catch(console.error);

export {
  SimpleFileLogger,
  FilteredLogger,
  CloudLogger,
  StructuredLogger,
  createLogger,
  usersDefault,
  usersSilent,
  usersCustom,
  usersFiltered,
  usersCloud,
  usersStructured,
  usersEnv,
  runExamples,
};
