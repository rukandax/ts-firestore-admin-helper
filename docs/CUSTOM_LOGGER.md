# Custom Logger Guide

Comprehensive guide to using custom loggers with TypeScript Firestore Admin Helper.

## Table of Contents

- [Quick Start](#quick-start)
- [Logger Interface](#logger-interface)
- [Built-in Loggers](#built-in-loggers)
- [Popular Logger Integrations](#popular-logger-integrations)
- [Custom Implementations](#custom-implementations)
- [Debug Mode](#debug-mode)
- [Best Practices](#best-practices)

## Quick Start

### Default Console Logger

By default, the library uses console logging:

```typescript
import FirestoreHelper from 'ts-firestore-admin-helper';

// Uses console.debug, console.info, console.warn, console.error
const collection = new FirestoreHelper<User>(db, 'users');
```

### Silent Mode

Disable all logging:

```typescript
const collection = new FirestoreHelper<User>(db, 'users', {
  logger: 'silent'
});
```

### Custom Logger

Use any logging library:

```typescript
import winston from 'winston';

const winstonLogger = winston.createLogger({
  level: 'info',
  transports: [new winston.transports.File({ filename: 'app.log' })]
});

const collection = new FirestoreHelper<User>(db, 'users', {
  logger: winstonLogger,
  debug: true
});
```

## Logger Interface

Any logger must implement this interface:

```typescript
interface Logger {
  debug(message: string, ...meta: unknown[]): void;
  info(message: string, ...meta: unknown[]): void;
  warn(message: string, ...meta: unknown[]): void;
  error(message: string, ...meta: unknown[]): void;
}
```

**Requirements:**
- All 4 methods must be present
- First parameter is always a string message
- Rest parameters accept any metadata
- Methods can be synchronous or asynchronous (fire-and-forget)

## Built-in Loggers

### Console Logger (Default)

Logs to browser/Node.js console:

```typescript
const collection = new FirestoreHelper<User>(db, 'users');
// Equivalent to:
// logger: new ConsoleLogger()
```

**Output Example:**
```
[DEBUG] Building query with 2 filters
[INFO] Document added successfully
[WARN] Query validation failed: Cannot use multiple "!=" operators
[ERROR] Error in document subscription callback: Document not found
```

### Silent Logger

No output at all:

```typescript
const collection = new FirestoreHelper<User>(db, 'users', {
  logger: 'silent'
});
```

**Use Cases:**
- Production environments where logging is handled elsewhere
- Testing environments
- Performance-critical paths
- When you only want to handle errors via try/catch

## Popular Logger Integrations

### Winston

[Winston](https://github.com/winstonjs/winston) is the most popular Node.js logging library.

**Installation:**
```bash
npm install winston
```

**Basic Usage:**
```typescript
import winston from 'winston';
import FirestoreHelper from 'ts-firestore-admin-helper';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

const usersCollection = new FirestoreHelper<User>(db, 'users', {
  logger,
  debug: true
});
```

**Advanced Winston Configuration:**
```typescript
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'firestore-service' },
  transports: [
    // Write all logs error (and below) to `error.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // Write all logs to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  ]
});

// Log to console only in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}
```

### Pino

[Pino](https://github.com/pinojs/pino) is a very fast JSON logger.

**Installation:**
```bash
npm install pino
npm install pino-pretty  # For development
```

**Basic Usage:**
```typescript
import pino from 'pino';

const logger = pino({
  level: 'debug',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true
    }
  }
});

const usersCollection = new FirestoreHelper<User>(db, 'users', {
  logger,
  debug: true
});
```

**Production Pino Configuration:**
```typescript
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => {
      return { level: label };
    }
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  base: {
    env: process.env.NODE_ENV,
    revision: process.env.REVISION
  }
});
```

### Bunyan

[Bunyan](https://github.com/trentm/node-bunyan) is a JSON logging library for Node.js.

**Installation:**
```bash
npm install bunyan
```

**Usage:**
```typescript
import bunyan from 'bunyan';

const logger = bunyan.createLogger({
  name: 'firestore-app',
  streams: [
    {
      level: 'info',
      stream: process.stdout
    },
    {
      level: 'error',
      path: './logs/error.log'
    }
  ]
});

const usersCollection = new FirestoreHelper<User>(db, 'users', {
  logger,
  debug: false
});
```

## Custom Implementations

### Simple File Logger

Log to a file with timestamps:

```typescript
import { Logger } from 'ts-firestore-admin-helper';
import fs from 'fs';
import path from 'path';

class FileLogger implements Logger {
  private logFilePath: string;

  constructor(logFilePath: string) {
    this.logFilePath = logFilePath;
    // Ensure log directory exists
    const dir = path.dirname(logFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private log(level: string, message: string, ...meta: unknown[]): void {
    const timestamp = new Date().toISOString();
    const metaStr = meta.length > 0 ? ` ${JSON.stringify(meta)}` : '';
    const logLine = `[${timestamp}] [${level}] ${message}${metaStr}\n`;
    
    fs.appendFileSync(this.logFilePath, logLine, 'utf8');
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
}

const collection = new FirestoreHelper<User>(db, 'users', {
  logger: new FileLogger('./logs/firestore.log')
});
```

### Filtered Logger (Log Level)

Only log messages above a certain level:

```typescript
import { Logger } from 'ts-firestore-admin-helper';

class FilteredLogger implements Logger {
  private minLevel: 'debug' | 'info' | 'warn' | 'error';
  private levels = { debug: 0, info: 1, warn: 2, error: 3 };

  constructor(minLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.minLevel = minLevel;
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  debug(message: string, ...meta: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG]`, message, ...meta);
    }
  }

  info(message: string, ...meta: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO]`, message, ...meta);
    }
  }

  warn(message: string, ...meta: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN]`, message, ...meta);
    }
  }

  error(message: string, ...meta: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR]`, message, ...meta);
    }
  }
}

// Only log warnings and errors
const collection = new FirestoreHelper<User>(db, 'users', {
  logger: new FilteredLogger('warn')
});
```

### Structured JSON Logger

Output logs as JSON for log aggregation tools:

```typescript
import { Logger } from 'ts-firestore-admin-helper';

interface LogEntry {
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

  private log(level: string, message: string, meta: unknown[]): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      metadata: meta.length > 0 ? meta : undefined
    };

    console.log(JSON.stringify(entry));
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
}

const collection = new FirestoreHelper<User>(db, 'users', {
  logger: new StructuredLogger({
    environment: 'production',
    service: 'user-service',
    version: '1.0.0',
    hostname: process.env.HOSTNAME
  })
});
```

**Output:**
```json
{"timestamp":"2024-01-15T10:30:00.000Z","level":"info","message":"Adding document","context":{"environment":"production","service":"user-service","version":"1.0.0","hostname":"server-01"},"metadata":[{"collectionPath":"users","customId":false}]}
```

### Cloud Logger (Send to External Service)

Send logs to a cloud logging service:

```typescript
import { Logger } from 'ts-firestore-admin-helper';

class CloudLogger implements Logger {
  private serviceName: string;
  private apiEndpoint: string;

  constructor(serviceName: string, apiEndpoint: string) {
    this.serviceName = serviceName;
    this.apiEndpoint = apiEndpoint;
  }

  private async sendLog(
    level: string,
    message: string,
    meta: unknown[]
  ): Promise<void> {
    const logEntry = {
      timestamp: new Date().toISOString(),
      service: this.serviceName,
      level,
      message,
      metadata: meta
    };

    // Fire and forget - don't wait for response
    fetch(this.apiEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(logEntry)
    }).catch(err => {
      // Fallback to console if cloud logging fails
      console.error('Failed to send log to cloud:', err);
    });
  }

  debug(message: string, ...meta: unknown[]): void {
    this.sendLog('debug', message, meta);
  }

  info(message: string, ...meta: unknown[]): void {
    this.sendLog('info', message, meta);
  }

  warn(message: string, ...meta: unknown[]): void {
    this.sendLog('warn', message, meta);
  }

  error(message: string, ...meta: unknown[]): void {
    this.sendLog('error', message, meta);
  }
}

const collection = new FirestoreHelper<User>(db, 'users', {
  logger: new CloudLogger('my-app', 'https://logs.example.com/api/ingest')
});
```

## Debug Mode

Enable debug mode to see detailed operation logs:

```typescript
const collection = new FirestoreHelper<User>(db, 'users', {
  debug: true  // Enable debug logging
});
```

**What Gets Logged in Debug Mode:**

1. **Query Building:**
   ```
   [DEBUG] Building query with 2 filters { collectionPath: 'users', filters: [...] }
   ```

2. **Document Operations:**
   ```
   [DEBUG] Adding document with ID: abc123 { collectionPath: 'users', customId: true }
   ```

3. **Query Validation Warnings:**
   ```
   [WARN] Query validation failed: Cannot use multiple "!=" operators
   ```

**Disable Debug in Production:**
```typescript
const collection = new FirestoreHelper<User>(db, 'users', {
  debug: process.env.NODE_ENV === 'development'
});
```

## Best Practices

### 1. Environment-Based Logging

Use different loggers for different environments:

```typescript
import { Logger } from 'ts-firestore-admin-helper';

function createLogger(env: 'development' | 'production'): Logger | 'silent' {
  if (env === 'development') {
    // Verbose console logging for development
    return console as Logger;
  } else {
    // Production: use Winston/Pino or cloud logger
    return winstonLogger;
  }
}

const collection = new FirestoreHelper<User>(db, 'users', {
  logger: createLogger(process.env.NODE_ENV as 'development' | 'production'),
  debug: process.env.NODE_ENV === 'development'
});
```

### 2. Centralized Logger Configuration

Create a logger module for consistent logging across your app:

```typescript
// logger.ts
import winston from 'winston';

export const appLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'my-app' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Use everywhere
import { appLogger } from './logger';

const collection = new FirestoreHelper<User>(db, 'users', {
  logger: appLogger
});
```

### 3. Add Context to Loggers

Add contextual information for better debugging:

```typescript
import { Logger } from 'ts-firestore-admin-helper';

class ContextualLogger implements Logger {
  constructor(
    private baseLogger: Logger,
    private context: Record<string, unknown>
  ) {}

  debug(message: string, ...meta: unknown[]): void {
    this.baseLogger.debug(message, { ...this.context, ...meta });
  }

  info(message: string, ...meta: unknown[]): void {
    this.baseLogger.info(message, { ...this.context, ...meta });
  }

  warn(message: string, ...meta: unknown[]): void {
    this.baseLogger.warn(message, { ...this.context, ...meta });
  }

  error(message: string, ...meta: unknown[]): void {
    this.baseLogger.error(message, { ...this.context, ...meta });
  }
}

const collection = new FirestoreHelper<User>(db, 'users', {
  logger: new ContextualLogger(winstonLogger, {
    module: 'user-service',
    requestId: req.id
  })
});
```

### 4. Handle Sensitive Data

Don't log sensitive information:

```typescript
import { Logger } from 'ts-firestore-admin-helper';

class SanitizedLogger implements Logger {
  private sensitiveFields = ['password', 'ssn', 'creditCard'];

  constructor(private baseLogger: Logger) {}

  private sanitize(data: unknown): unknown {
    if (typeof data === 'object' && data !== null) {
      const sanitized = { ...data } as Record<string, unknown>;
      for (const field of this.sensitiveFields) {
        if (field in sanitized) {
          sanitized[field] = '[REDACTED]';
        }
      }
      return sanitized;
    }
    return data;
  }

  debug(message: string, ...meta: unknown[]): void {
    this.baseLogger.debug(message, ...meta.map(m => this.sanitize(m)));
  }

  // ... implement other methods similarly
}
```

### 5. Performance Considerations

- Use `logger: 'silent'` in performance-critical code
- Avoid expensive operations in logger methods
- Consider async logging for I/O operations
- Use log sampling for high-volume operations

```typescript
class SampledLogger implements Logger {
  private sampleRate: number;

  constructor(private baseLogger: Logger, sampleRate = 0.1) {
    this.sampleRate = sampleRate; // 10% by default
  }

  private shouldSample(): boolean {
    return Math.random() < this.sampleRate;
  }

  debug(message: string, ...meta: unknown[]): void {
    if (this.shouldSample()) {
      this.baseLogger.debug(message, ...meta);
    }
  }

  // Always log errors
  error(message: string, ...meta: unknown[]): void {
    this.baseLogger.error(message, ...meta);
  }

  // ... other methods
}
```

## Related Resources

- [Main README](../README.md)
- [Custom Logger Examples](../examples/custom-logger.ts)
- [Query Validation](./QUERIES.md#automatic-query-validation)

---

[← Back to Documentation](../README.md#links)
