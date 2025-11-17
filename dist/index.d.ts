import * as admin from 'firebase-admin';
/**
 * Logger interface that supports any logging library
 * Compatible with Winston, Pino, Bunyan, console, and custom loggers
 */
export interface Logger {
    debug(message: string, ...meta: unknown[]): void;
    info(message: string, ...meta: unknown[]): void;
    warn(message: string, ...meta: unknown[]): void;
    error(message: string, ...meta: unknown[]): void;
}
export interface BaseDocument {
    createdAt?: number;
    updatedAt?: number;
}
export interface FirestoreHelperOptions {
    /**
     * Custom logger instance (Winston, Pino, Bunyan, etc.)
     * If not provided, uses console logger
     * Set to 'silent' to disable all logging
     */
    logger?: Logger | 'silent';
    /**
     * Enable debug logging (default: false)
     */
    debug?: boolean;
    /**
     * Custom document ID length (default: 30)
     * Only applies to auto-generated IDs
     */
    idLength?: number;
}
export type QueryPayload<T> = {
    field: keyof T;
    operator: FirebaseFirestore.WhereFilterOp;
    value: T[keyof T] | T[keyof T][] | boolean | null;
};
export type OrderByOption<T> = {
    field: keyof T;
    direction?: 'asc' | 'desc';
};
export type QueryOptions<T> = {
    orderBy?: keyof T | OrderByOption<T>[];
    orderDirection?: 'asc' | 'desc';
    limit?: number;
    startAfterId?: string;
};
export declare class QueryValidationError extends Error {
    constructor(message: string);
}
export default class FirestoreHelper<T extends BaseDocument = BaseDocument> {
    private collection;
    private firestoreInstance;
    private logger;
    private debugMode;
    private idLength;
    constructor(firestoreInstance: admin.firestore.Firestore, collectionPath: string, options?: FirestoreHelperOptions);
    /**
     * Validates Firestore connection by attempting a simple read operation
     * @throws Error if connection fails
     */
    validateConnection(): Promise<void>;
    /**
     * Generates a cryptographically secure random ID
     */
    private generateRandomId;
    /**
     * Validates custom document ID format
     */
    private validateCustomId;
    /**
     * Validates document data is not empty
     */
    private validateDocumentData;
    private generateUniqueId;
    /**
     * Gets current Unix timestamp in milliseconds
     * Uses Firestore server timestamp for consistency
     */
    private getUnixTimestamp;
    private validateUnixTimestamp;
    private validateTimestampFields;
    /**
     * Removes fields with undefined values from an object
     * This prevents Firestore errors when saving documents with undefined fields
     * @param data - Object to clean
     * @returns New object without undefined fields
     */
    private removeUndefinedFields;
    /**
     * Extracts fields with undefined values and marks them for deletion in Firestore
     * Used in update operations to delete fields when value is undefined
     * @param data - Object to process
     * @returns Object with FieldValue.delete() for undefined fields
     */
    private extractUndefinedFields;
    addDocument(data: T, id?: string, override?: boolean): Promise<{
        id: string;
        data: T;
    }>;
    editDocument(docId: string, data: Partial<T>): Promise<{
        id: string;
        data: T;
    }>;
    removeDocument(docId: string): Promise<void>;
    batchAdd(documents: {
        id?: string;
        data: T;
        override?: boolean;
    }[]): Promise<void>;
    batchEdit(updates: {
        id: string;
        data: Partial<T>;
    }[]): Promise<void>;
    batchRemove(docIds: string[]): Promise<void>;
    /**
     * Batch add documents with automatic chunking for large datasets (>500 documents)
     * Automatically splits the operation into multiple batches
     *
     * @param documents - Array of documents to add
     * @returns Promise that resolves when all documents are added
     *
     * @example
     * // Add 1000 documents (will be split into 2 batches)
     * await collection.batchAddLarge(largeDocumentArray);
     */
    batchAddLarge(documents: {
        id?: string;
        data: T;
        override?: boolean;
    }[]): Promise<void>;
    /**
     * Batch edit documents with automatic chunking for large datasets (>500 documents)
     * Automatically splits the operation into multiple batches
     *
     * @param updates - Array of document updates
     * @returns Promise that resolves when all documents are updated
     *
     * @example
     * // Update 1000 documents
     * await collection.batchEditLarge(largeUpdateArray);
     */
    batchEditLarge(updates: {
        id: string;
        data: Partial<T>;
    }[]): Promise<void>;
    /**
     * Batch remove documents with automatic chunking for large datasets (>500 documents)
     * Automatically splits the operation into multiple batches
     *
     * @param docIds - Array of document IDs to remove
     * @returns Promise that resolves when all documents are removed
     *
     * @example
     * // Remove 1000 documents
     * await collection.batchRemoveLarge(largeIdArray);
     */
    batchRemoveLarge(docIds: string[]): Promise<void>;
    getDocument(docId: string): Promise<admin.firestore.DocumentSnapshot<T>>;
    getDocumentData(docId: string): Promise<{
        id: string;
        data: T;
    } | null>;
    /**
     * Executes a Firestore query with proper error handling
     * @param query - The Firestore query to execute
     * @param operation - The operation to perform on the query
     * @returns Result from the operation
     */
    private executeQuery;
    findDocuments(query: QueryPayload<T>[], options?: QueryOptions<T>): Promise<admin.firestore.QuerySnapshot<T>>;
    findDocument(query: QueryPayload<T>[]): Promise<admin.firestore.QueryDocumentSnapshot<T, admin.firestore.DocumentData> | null>;
    findDocumentsData(query: QueryPayload<T>[], options?: QueryOptions<T>): Promise<{
        id: string;
        data: T;
    }[]>;
    findDocumentData(query: QueryPayload<T>[]): Promise<{
        id: string;
        data: T;
    } | null>;
    buildQuery(filters: QueryPayload<T>[]): admin.firestore.Query<T>;
    subscribeDocument(docId: string, callback: (doc: {
        id: string;
        data: T;
    }) => void, errorCallback?: (error: Error) => void): () => void;
    subscribeCollection(callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void, errorCallback?: (error: Error) => void): () => void;
    subscribeQuery(query: QueryPayload<T>[], callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void, errorCallback?: (error: Error) => void): () => void;
    /**
     * Helper method to get document reference for use in custom transactions
     * @param docId - Document ID
     * @returns Document reference
     */
    doc(docId: string): admin.firestore.DocumentReference<T>;
    /**
     * Performs an atomic increment/decrement operation on a numeric field
     * Useful for counters, balances, inventory counts, etc.
     *
     * @param docId - Document ID
     * @param field - Field name to increment/decrement
     * @param value - Amount to increment (positive) or decrement (negative)
     * @returns Updated document data
     *
     * @example
     * // Increment view count
     * await collection.atomicIncrement('post-123', 'viewCount', 1);
     *
     * // Decrement stock
     * await collection.atomicIncrement('product-456', 'stock', -5);
     *
     * // Add to balance
     * await collection.atomicIncrement('user-789', 'balance', 100);
     */
    atomicIncrement(docId: string, field: keyof T, value: number): Promise<{
        id: string;
        data: T;
    }>;
    /**
     * Conditionally updates a document based on current field value
     * Useful for implementing optimistic locking or state-based updates
     *
     * @param docId - Document ID
     * @param field - Field to check
     * @param expectedValue - Expected current value
     * @param newData - Data to update if condition matches
     * @returns Updated document data or null if condition not met
     *
     * @example
     * // Update only if status is 'pending'
     * const result = await collection.conditionalUpdate(
     *   'order-123',
     *   'status',
     *   'pending',
     *   { status: 'processing', processingStartedAt: Date.now() }
     * );
     *
     * if (!result) {
     *   console.log('Order is no longer pending');
     * }
     */
    conditionalUpdate(docId: string, field: keyof T, expectedValue: T[keyof T], newData: Partial<T>): Promise<{
        id: string;
        data: T;
    } | null>;
    /**
     * Validates query against Firestore constraints
     * Throws QueryValidationError if constraints are violated
     */
    private validateQueryConstraints;
    private isFirestoreError;
    private getErrorMessage;
}
//# sourceMappingURL=index.d.ts.map