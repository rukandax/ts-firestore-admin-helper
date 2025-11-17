/**
 * Custom Logger Examples - TypeScript Firestore Admin Helper
 *
 * This file demonstrates how to use custom loggers with FirestoreHelper
 * Supports any logging library: Winston, Pino, Bunyan, or custom implementations
 */
import FirestoreHelper, { Logger, BaseDocument } from '../src/index';
interface User extends BaseDocument {
    name: string;
    email: string;
    age: number;
}
declare const usersDefault: FirestoreHelper<User>;
declare const usersSilent: FirestoreHelper<User>;
declare class SimpleFileLogger implements Logger {
    private prefix;
    constructor(prefix: string);
    debug(message: string, ...meta: unknown[]): void;
    info(message: string, ...meta: unknown[]): void;
    warn(message: string, ...meta: unknown[]): void;
    error(message: string, ...meta: unknown[]): void;
    private log;
}
declare const usersCustom: FirestoreHelper<User>;
declare class FilteredLogger implements Logger {
    private minLevel;
    private levels;
    constructor(minLevel?: 'debug' | 'info' | 'warn' | 'error');
    debug(message: string, ...meta: unknown[]): void;
    info(message: string, ...meta: unknown[]): void;
    warn(message: string, ...meta: unknown[]): void;
    error(message: string, ...meta: unknown[]): void;
    private shouldLog;
}
declare const usersFiltered: FirestoreHelper<User>;
declare class CloudLogger implements Logger {
    private serviceName;
    constructor(serviceName: string);
    debug(message: string, ...meta: unknown[]): void;
    info(message: string, ...meta: unknown[]): void;
    warn(message: string, ...meta: unknown[]): void;
    error(message: string, ...meta: unknown[]): void;
    private sendToCloud;
}
declare const usersCloud: FirestoreHelper<User>;
declare class StructuredLogger implements Logger {
    private context;
    constructor(context?: Record<string, unknown>);
    debug(message: string, ...meta: unknown[]): void;
    info(message: string, ...meta: unknown[]): void;
    warn(message: string, ...meta: unknown[]): void;
    error(message: string, ...meta: unknown[]): void;
    private log;
}
declare const usersStructured: FirestoreHelper<User>;
declare function createLogger(env: 'development' | 'production'): Logger;
declare const usersEnv: FirestoreHelper<User>;
declare function runExamples(): Promise<void>;
export { SimpleFileLogger, FilteredLogger, CloudLogger, StructuredLogger, createLogger, usersDefault, usersSilent, usersCustom, usersFiltered, usersCloud, usersStructured, usersEnv, runExamples, };
//# sourceMappingURL=custom-logger.d.ts.map