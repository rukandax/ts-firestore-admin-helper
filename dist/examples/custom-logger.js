"use strict";
/**
 * Custom Logger Examples - TypeScript Firestore Admin Helper
 *
 * This file demonstrates how to use custom loggers with FirestoreHelper
 * Supports any logging library: Winston, Pino, Bunyan, or custom implementations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersEnv = exports.usersStructured = exports.usersCloud = exports.usersFiltered = exports.usersCustom = exports.usersSilent = exports.usersDefault = exports.StructuredLogger = exports.CloudLogger = exports.FilteredLogger = exports.SimpleFileLogger = void 0;
exports.createLogger = createLogger;
exports.runExamples = runExamples;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const index_1 = __importDefault(require("../src/index"));
// Initialize Firebase Admin (replace with your config)
// admin.initializeApp({ ... });
const db = firebase_admin_1.default.firestore();
// ============================================
// Example 1: Using Default Console Logger
// ============================================
const usersDefault = new index_1.default(db, 'users');
exports.usersDefault = usersDefault;
// Uses console.log, console.error, console.warn, console.debug by default
async function exampleDefault() {
    try {
        await usersDefault.addDocument({
            name: 'John Doe',
            email: 'john@example.com',
            age: 30,
        });
    }
    catch (error) {
        if (error instanceof Error) {
            console.error('Failed to add document:', error.message);
        }
    }
}
// ============================================
// Example 2: Silent Mode (No Logging)
// ============================================
const usersSilent = new index_1.default(db, 'users', {
    logger: 'silent', // No logs will be output
});
exports.usersSilent = usersSilent;
async function exampleSilent() {
    try {
        // This will not log anything even if errors occur
        await usersSilent.addDocument({
            name: 'Jane Doe',
            email: 'jane@example.com',
            age: 25,
        });
    }
    catch (error) {
        // Handle errors silently or with custom logic
        if (error instanceof Error) {
            // Custom error handling without logging
        }
    }
}
// ============================================
// Example 3: Custom Simple Logger
// ============================================
class SimpleFileLogger {
    constructor(prefix) {
        this.prefix = prefix;
    }
    debug(message, ...meta) {
        this.log('DEBUG', message, ...meta);
    }
    info(message, ...meta) {
        this.log('INFO', message, ...meta);
    }
    warn(message, ...meta) {
        this.log('WARN', message, ...meta);
    }
    error(message, ...meta) {
        this.log('ERROR', message, ...meta);
    }
    log(level, message, ...meta) {
        const timestamp = new Date().toISOString();
        const metaStr = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
        console.log(`[${timestamp}] [${this.prefix}] [${level}] ${message}${metaStr}`);
    }
}
exports.SimpleFileLogger = SimpleFileLogger;
const usersCustom = new index_1.default(db, 'users', {
    logger: new SimpleFileLogger('FIRESTORE'),
    debug: true, // Enable debug logging
});
exports.usersCustom = usersCustom;
async function exampleCustomLogger() {
    try {
        await usersCustom.addDocument({
            name: 'Bob Wilson',
            email: 'bob@example.com',
            age: 35,
        });
        // Output: [2024-01-01T12:00:00.000Z] [FIRESTORE] [DEBUG] Adding document with ID: abc123 {...}
    }
    catch (error) {
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
class FilteredLogger {
    constructor(minLevel = 'info') {
        this.levels = { debug: 0, info: 1, warn: 2, error: 3 };
        this.minLevel = minLevel;
    }
    debug(message, ...meta) {
        if (this.shouldLog('debug')) {
            console.debug('[DEBUG]', message, ...meta);
        }
    }
    info(message, ...meta) {
        if (this.shouldLog('info')) {
            console.info('[INFO]', message, ...meta);
        }
    }
    warn(message, ...meta) {
        if (this.shouldLog('warn')) {
            console.warn('[WARN]', message, ...meta);
        }
    }
    error(message, ...meta) {
        if (this.shouldLog('error')) {
            console.error('[ERROR]', message, ...meta);
        }
    }
    shouldLog(level) {
        return this.levels[level] >= this.levels[this.minLevel];
    }
}
exports.FilteredLogger = FilteredLogger;
// Only log warnings and errors
const usersFiltered = new index_1.default(db, 'users', {
    logger: new FilteredLogger('warn'),
    debug: false,
});
exports.usersFiltered = usersFiltered;
// ============================================
// Example 7: Logger with External Service
// ============================================
class CloudLogger {
    constructor(serviceName) {
        this.serviceName = serviceName;
    }
    debug(message, ...meta) {
        this.sendToCloud('debug', message, meta);
    }
    info(message, ...meta) {
        this.sendToCloud('info', message, meta);
    }
    warn(message, ...meta) {
        this.sendToCloud('warn', message, meta);
    }
    error(message, ...meta) {
        this.sendToCloud('error', message, meta);
    }
    sendToCloud(level, message, meta) {
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
exports.CloudLogger = CloudLogger;
const usersCloud = new index_1.default(db, 'users', {
    logger: new CloudLogger('my-app'),
    debug: true,
});
exports.usersCloud = usersCloud;
class StructuredLogger {
    constructor(context = {}) {
        this.context = context;
    }
    debug(message, ...meta) {
        this.log('debug', message, meta);
    }
    info(message, ...meta) {
        this.log('info', message, meta);
    }
    warn(message, ...meta) {
        this.log('warn', message, meta);
    }
    error(message, ...meta) {
        this.log('error', message, meta);
    }
    log(level, message, meta) {
        const logEntry = {
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
exports.StructuredLogger = StructuredLogger;
const usersStructured = new index_1.default(db, 'users', {
    logger: new StructuredLogger({
        environment: 'production',
        service: 'user-service',
        version: '1.0.0',
    }),
    debug: false,
});
exports.usersStructured = usersStructured;
// ============================================
// Example 9: Development vs Production Logger
// ============================================
function createLogger(env) {
    if (env === 'development') {
        // Verbose console logging for development
        return new SimpleFileLogger('DEV');
    }
    else {
        // Structured JSON logging for production
        return new StructuredLogger({
            environment: 'production',
            hostname: process.env.HOSTNAME,
        });
    }
}
const usersEnv = new index_1.default(db, 'users', {
    logger: createLogger(process.env.NODE_ENV || 'development'),
    debug: process.env.NODE_ENV === 'development',
});
exports.usersEnv = usersEnv;
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
//# sourceMappingURL=custom-logger.js.map