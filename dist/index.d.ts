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
     * Validates Firestore connection by attempting a simple read operation.
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
     * Removes fields with undefined values from an object.
     * @param data - Object to clean
     * @returns New object without undefined fields
     */
    private removeUndefinedFields;
    /**
     * Extracts fields with undefined values and marks them for deletion in Firestore.
     * @param data - Object to process
     * @returns Object with FieldValue.delete() for undefined fields
     */
    private extractUndefinedFields;
    /**
     * Adds a new document to the collection.
     * @param data - Document data to add
     * @param id - Optional custom document ID
     * @param override - Whether to override existing document with same ID
     * @returns Object containing document ID and data
     */
    addDocument(data: T, id?: string, override?: boolean): Promise<{
        id: string;
        data: T;
    }>;
    /**
     * Updates an existing document in the collection.
     * @param docId - Document ID to update
     * @param data - Data to update (undefined values delete fields)
     * @returns Object containing document ID and updated data
     */
    editDocument(docId: string, data: Partial<T>): Promise<{
        id: string;
        data: T;
    }>;
    /**
     * Removes a document from the collection.
     * @param docId - Document ID to remove
     */
    removeDocument(docId: string): Promise<void>;
    /**
     * Adds multiple documents in a single batch operation.
     * @param documents - Array of documents to add
     */
    batchAdd(documents: {
        id?: string;
        data: T;
        override?: boolean;
    }[]): Promise<void>;
    /**
     * Updates multiple documents in a single batch operation.
     * @param updates - Array of document updates
     */
    batchEdit(updates: {
        id: string;
        data: Partial<T>;
    }[]): Promise<void>;
    /**
     * Removes multiple documents in a single batch operation.
     * @param docIds - Array of document IDs to remove
     */
    batchRemove(docIds: string[]): Promise<void>;
    /**
     * Batch add documents with automatic chunking for large datasets (>500 documents).
     * @param documents - Array of documents to add
     * @returns Promise that resolves when all documents are added
     */
    batchAddLarge(documents: {
        id?: string;
        data: T;
        override?: boolean;
    }[]): Promise<void>;
    /**
     * Batch edit documents with automatic chunking for large datasets (>500 documents).
     * @param updates - Array of document updates
     * @returns Promise that resolves when all documents are updated
     */
    batchEditLarge(updates: {
        id: string;
        data: Partial<T>;
    }[]): Promise<void>;
    /**
     * Batch remove documents with automatic chunking for large datasets (>500 documents).
     * @param docIds - Array of document IDs to remove
     * @returns Promise that resolves when all documents are removed
     */
    batchRemoveLarge(docIds: string[]): Promise<void>;
    /**
     * Gets a document snapshot from the collection.
     * @param docId - Document ID to retrieve
     * @returns Document snapshot
     */
    getDocument(docId: string): Promise<admin.firestore.DocumentSnapshot<T>>;
    /**
     * Gets document data from the collection.
     * @param docId - Document ID to retrieve
     * @returns Object containing document ID and data, or null if not found
     */
    getDocumentData(docId: string): Promise<{
        id: string;
        data: T;
    } | null>;
    /**
     * Executes a Firestore query with proper error handling.
     * @param query - The Firestore query to execute
     * @param operation - The operation to perform on the query
     * @returns Result from the operation
     */
    private executeQuery;
    /**
     * Finds documents matching the given query.
     * @param query - Array of query conditions
     * @param options - Query options (orderBy, limit, etc.)
     * @returns Query snapshot containing matching documents
     */
    findDocuments(query: QueryPayload<T>[], options?: QueryOptions<T>): Promise<admin.firestore.QuerySnapshot<T>>;
    /**
     * Finds the first document matching the given query.
     * @param query - Array of query conditions
     * @returns First matching document snapshot, or null if none found
     */
    findDocument(query: QueryPayload<T>[]): Promise<admin.firestore.QueryDocumentSnapshot<T, admin.firestore.DocumentData> | null>;
    /**
     * Finds documents matching the given query and returns their data.
     * @param query - Array of query conditions
     * @param options - Query options (orderBy, limit, etc.)
     * @returns Array of objects containing document ID and data
     */
    findDocumentsData(query: QueryPayload<T>[], options?: QueryOptions<T>): Promise<{
        id: string;
        data: T;
    }[]>;
    /**
     * Finds the first document matching the given query and returns its data.
     * @param query - Array of query conditions
     * @returns Object containing document ID and data, or null if none found
     */
    findDocumentData(query: QueryPayload<T>[]): Promise<{
        id: string;
        data: T;
    } | null>;
    /**
     * Builds a Firestore query from the given conditions.
     * @param filters - Array of query conditions
     * @returns Firestore query object
     */
    buildQuery(filters: QueryPayload<T>[]): admin.firestore.Query<T>;
    /**
     * Subscribes to changes on a specific document.
     * @param docId - Document ID to subscribe to
     * @param callback - Callback function called on document changes
     * @param errorCallback - Optional error callback
     * @returns Unsubscribe function
     */
    subscribeDocument(docId: string, callback: (doc: {
        id: string;
        data: T;
    }) => void, errorCallback?: (error: Error) => void): () => void;
    /**
     * Subscribes to changes on the entire collection.
     * @param callback - Callback function called on collection changes
     * @param errorCallback - Optional error callback
     * @returns Unsubscribe function
     */
    subscribeCollection(callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void, errorCallback?: (error: Error) => void): () => void;
    /**
     * Subscribes to changes on documents matching a query.
     * @param query - Array of query conditions
     * @param callback - Callback function called on query result changes
     * @param errorCallback - Optional error callback
     * @returns Unsubscribe function
     */
    subscribeQuery(query: QueryPayload<T>[], callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void, errorCallback?: (error: Error) => void): () => void;
    /**
     * Helper method to get document reference for use in custom transactions.
     * @param docId - Document ID
     * @returns Document reference
     */
    doc(docId: string): admin.firestore.DocumentReference<T>;
    /**
     * Performs an atomic increment/decrement operation on a numeric field.
     * @param docId - Document ID
     * @param field - Field name to increment/decrement
     * @param value - Amount to increment (positive) or decrement (negative)
     * @returns Updated document data
     */
    atomicIncrement(docId: string, field: keyof T, value: number): Promise<{
        id: string;
        data: T;
    }>;
    /**
     * Conditionally updates a document based on query conditions.
     * @param docId - Document ID
     * @param conditions - Array of query conditions that must all be met
     * @param newData - Data to update if all conditions match
     * @returns Updated document data or null if conditions not met
     */
    conditionalUpdate(docId: string, conditions: QueryPayload<T>[], newData: Partial<T>): Promise<{
        id: string;
        data: T;
    } | null>;
    /**
     * Validates query against Firestore constraints.
     * @throws QueryValidationError if constraints are violated
     */
    private validateQueryConstraints;
    private isFirestoreError;
    private getErrorMessage;
}
//# sourceMappingURL=index.d.ts.map