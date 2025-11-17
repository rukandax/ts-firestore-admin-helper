"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryValidationError = void 0;
const admin = __importStar(require("firebase-admin"));
const crypto = __importStar(require("crypto"));
// Constants
const DEFAULT_ID_LENGTH = 30;
const MAX_BATCH_SIZE = 500; // Firestore transaction limit
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
/**
 * Default console logger implementation
 */
class ConsoleLogger {
    debug(message, ...meta) {
        console.debug(message, ...meta);
    }
    info(message, ...meta) {
        console.info(message, ...meta);
    }
    warn(message, ...meta) {
        console.warn(message, ...meta);
    }
    error(message, ...meta) {
        console.error(message, ...meta);
    }
}
/**
 * No-op logger that does nothing (for production/silent mode)
 */
class NoOpLogger {
    debug() { }
    info() { }
    warn() { }
    error() { }
}
class QueryValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'QueryValidationError';
    }
}
exports.QueryValidationError = QueryValidationError;
class FirestoreHelper {
    constructor(firestoreInstance, collectionPath, options) {
        this.firestoreInstance = firestoreInstance;
        this.collection = firestoreInstance.collection(collectionPath);
        // Setup logger
        if (options?.logger === 'silent') {
            this.logger = new NoOpLogger();
        }
        else if (options?.logger) {
            this.logger = options.logger;
        }
        else {
            this.logger = new ConsoleLogger();
        }
        this.debugMode = options?.debug ?? false;
        this.idLength = options?.idLength ?? DEFAULT_ID_LENGTH;
    }
    /**
     * Validates Firestore connection by attempting a simple read operation
     * @throws Error if connection fails
     */
    async validateConnection() {
        const testDocRef = this.collection.doc('ts_firestore_admin_helper_test_connection');
        try {
            await testDocRef.get();
        }
        catch (error) {
            throw new Error(`Firestore connection check failed: ${this.getErrorMessage(error)}`);
        }
    }
    /**
     * Generates a cryptographically secure random ID
     */
    generateRandomId(length) {
        const bytes = crypto.randomBytes(length);
        let result = '';
        for (let i = 0; i < length; i++) {
            const byte = bytes[i];
            if (byte === undefined) {
                throw new Error('Failed to generate random bytes');
            }
            const randomIndex = byte % ID_CHARS.length;
            result += ID_CHARS[randomIndex];
        }
        return result;
    }
    /**
     * Validates custom document ID format
     */
    validateCustomId(id) {
        if (!id || typeof id !== 'string') {
            throw new Error('Document ID must be a non-empty string');
        }
        if (id.length > 1500) {
            throw new Error('Document ID must not exceed 1500 characters');
        }
        if (id.startsWith('__') && id.endsWith('__')) {
            throw new Error('Document ID cannot start and end with double underscores');
        }
        // Firestore doesn't allow certain characters in document IDs
        if (/[/]/.test(id)) {
            throw new Error('Document ID cannot contain forward slashes');
        }
    }
    /**
     * Validates document data is not empty
     */
    validateDocumentData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('Document data must be a valid object');
        }
        const keys = Object.keys(data).filter(key => key !== 'createdAt' && key !== 'updatedAt');
        if (keys.length === 0) {
            throw new Error('Document data cannot be empty');
        }
    }
    async generateUniqueId(length) {
        let id;
        let doc;
        do {
            id = this.generateRandomId(length);
            doc = await this.collection.doc(id).get();
        } while (doc.exists);
        return id;
    }
    /**
     * Gets current Unix timestamp in milliseconds
     * Uses Firestore server timestamp for consistency
     */
    getUnixTimestamp() {
        return admin.firestore.Timestamp.now().toMillis();
    }
    validateUnixTimestamp(timestamp) {
        return (typeof timestamp === 'number' &&
            Number.isInteger(timestamp) &&
            timestamp >= 0);
    }
    validateTimestampFields(data) {
        if (data.createdAt !== undefined &&
            !this.validateUnixTimestamp(data.createdAt)) {
            throw new Error(`Invalid value for createdAt: ${data.createdAt}`);
        }
        if (data.updatedAt !== undefined &&
            !this.validateUnixTimestamp(data.updatedAt)) {
            throw new Error(`Invalid value for updatedAt: ${data.updatedAt}`);
        }
    }
    /**
     * Removes fields with undefined values from an object
     * This prevents Firestore errors when saving documents with undefined fields
     * @param data - Object to clean
     * @returns New object without undefined fields
     */
    removeUndefinedFields(data) {
        const cleaned = {};
        for (const key in data) {
            if (data[key] !== undefined) {
                cleaned[key] = data[key];
            }
        }
        return cleaned;
    }
    /**
     * Extracts fields with undefined values and marks them for deletion in Firestore
     * Used in update operations to delete fields when value is undefined
     * @param data - Object to process
     * @returns Object with FieldValue.delete() for undefined fields
     */
    extractUndefinedFields(data) {
        const fieldsToDelete = {};
        for (const key in data) {
            if (data[key] === undefined) {
                fieldsToDelete[key] = admin.firestore.FieldValue.delete();
            }
        }
        return fieldsToDelete;
    }
    async addDocument(data, id, override) {
        // Remove undefined fields before validation and saving
        const cleanedData = this.removeUndefinedFields(data);
        // Validate document data
        this.validateDocumentData(cleanedData);
        // Validate custom ID if provided
        if (id) {
            this.validateCustomId(id);
        }
        const docId = id || (await this.generateUniqueId(this.idLength));
        const docRef = this.collection.doc(docId);
        if (this.debugMode) {
            this.logger.debug(`Adding document with ID: ${docId}`, {
                collectionPath: this.collection.path,
                customId: !!id,
                override: !!override,
            });
        }
        const result = await this.firestoreInstance.runTransaction(async (transaction) => {
            const docSnapshot = await transaction.get(docRef);
            if (id && !(override || !docSnapshot.exists)) {
                throw new Error(`Document with ID ${id} already exists. Use "override: true" to replace the data.`);
            }
            const existingData = docSnapshot.data();
            const timestampedData = {
                ...cleanedData,
                createdAt: id
                    ? existingData?.createdAt || this.getUnixTimestamp()
                    : this.getUnixTimestamp(),
                updatedAt: this.getUnixTimestamp(),
            };
            transaction.set(docRef, timestampedData, { merge: override });
            return { id: docId, data: timestampedData };
        });
        return result;
    }
    async editDocument(docId, data) {
        // Extract fields to delete (undefined values)
        const fieldsToDelete = this.extractUndefinedFields(data);
        // Remove undefined fields from data before validation
        const cleanedData = this.removeUndefinedFields(data);
        // Validate document data (only if there are non-undefined fields)
        if (Object.keys(cleanedData).length > 0) {
            this.validateDocumentData(cleanedData);
        }
        const docRef = this.collection.doc(docId);
        return this.firestoreInstance.runTransaction(async (transaction) => {
            const docSnapshot = await transaction.get(docRef);
            if (!docSnapshot.exists) {
                throw new Error(`Document with ID ${docId} does not exist`);
            }
            this.validateTimestampFields(cleanedData);
            // Prevent updating the document ID
            if ('id' in cleanedData) {
                throw new Error('Cannot update the document ID');
            }
            // Merge cleaned data with fields to delete
            const timestampedData = {
                ...cleanedData,
                ...fieldsToDelete,
                updatedAt: this.getUnixTimestamp(),
            };
            transaction.update(docRef, timestampedData);
            // Merge current data with updated data to return complete document
            const currentData = docSnapshot.data();
            if (!currentData) {
                throw new Error(`Document with ID ${docId} has no data`);
            }
            // Remove deleted fields from the final result
            const updatedData = {
                ...currentData,
                ...cleanedData,
            };
            // Remove fields that were marked for deletion
            for (const key in fieldsToDelete) {
                delete updatedData[key];
            }
            return { id: docSnapshot.id, data: updatedData };
        });
    }
    async removeDocument(docId) {
        const docRef = this.collection.doc(docId);
        return this.firestoreInstance.runTransaction(async (transaction) => {
            const docSnapshot = await transaction.get(docRef);
            if (!docSnapshot.exists) {
                throw new Error(`Document with ID ${docId} does not exist`);
            }
            transaction.delete(docRef);
        });
    }
    async batchAdd(documents) {
        if (documents.length === 0) {
            throw new Error('Batch operation requires at least one document');
        }
        if (documents.length > MAX_BATCH_SIZE) {
            throw new Error(`Batch size exceeds Firestore limit. Maximum ${MAX_BATCH_SIZE} documents allowed, received ${documents.length}`);
        }
        // Clean undefined fields and validate all documents and custom IDs before transaction
        const cleanedDocuments = [];
        for (const { id, data, override } of documents) {
            const cleanedData = this.removeUndefinedFields(data);
            this.validateDocumentData(cleanedData);
            if (id) {
                this.validateCustomId(id);
            }
            cleanedDocuments.push({ id, data: cleanedData, override });
        }
        // Generate all IDs sequentially to avoid race conditions
        const documentsWithIds = [];
        const generatedIds = new Set();
        for (const { id, data, override } of cleanedDocuments) {
            let finalId;
            if (id) {
                finalId = id;
            }
            else {
                // Keep generating until we get a unique one (even in this batch)
                do {
                    finalId = await this.generateUniqueId(this.idLength);
                } while (generatedIds.has(finalId));
                generatedIds.add(finalId);
            }
            documentsWithIds.push({ id: finalId, data, override });
        }
        return this.firestoreInstance.runTransaction(async (transaction) => {
            for (const { id, data, override } of documentsWithIds) {
                const docRef = this.collection.doc(id);
                const docSnapshot = await transaction.get(docRef);
                if (!(override || !docSnapshot.exists)) {
                    throw new Error(`Document with ID ${id} already exists. Use "override: true" to replace the data.`);
                }
                const existingData = docSnapshot.data();
                const timestampedData = {
                    ...data,
                    createdAt: existingData?.createdAt || this.getUnixTimestamp(),
                    updatedAt: this.getUnixTimestamp(),
                };
                transaction.set(docRef, timestampedData, { merge: override });
            }
        });
    }
    async batchEdit(updates) {
        if (updates.length === 0) {
            throw new Error('Batch operation requires at least one document');
        }
        if (updates.length > MAX_BATCH_SIZE) {
            throw new Error(`Batch size exceeds Firestore limit. Maximum ${MAX_BATCH_SIZE} documents allowed, received ${updates.length}`);
        }
        // Process undefined fields and validate all updates before transaction
        const processedUpdates = [];
        for (const { id, data } of updates) {
            const fieldsToDelete = this.extractUndefinedFields(data);
            const cleanedData = this.removeUndefinedFields(data);
            // Validate document data (only if there are non-undefined fields)
            if (Object.keys(cleanedData).length > 0) {
                this.validateDocumentData(cleanedData);
            }
            this.validateTimestampFields(cleanedData);
            // Prevent updating the document ID
            if ('id' in cleanedData) {
                throw new Error('Cannot update the document ID');
            }
            processedUpdates.push({ id, cleanedData, fieldsToDelete });
        }
        return this.firestoreInstance.runTransaction(async (transaction) => {
            for (const { id, cleanedData, fieldsToDelete } of processedUpdates) {
                const docRef = this.collection.doc(id);
                const docSnapshot = await transaction.get(docRef);
                if (!docSnapshot.exists) {
                    throw new Error(`Document with ID ${id} does not exist`);
                }
                // Merge cleaned data with fields to delete
                const timestampedData = {
                    ...cleanedData,
                    ...fieldsToDelete,
                    updatedAt: this.getUnixTimestamp(),
                };
                transaction.update(docRef, timestampedData);
            }
        });
    }
    async batchRemove(docIds) {
        if (docIds.length === 0) {
            throw new Error('Batch operation requires at least one document ID');
        }
        if (docIds.length > MAX_BATCH_SIZE) {
            throw new Error(`Batch size exceeds Firestore limit. Maximum ${MAX_BATCH_SIZE} documents allowed, received ${docIds.length}`);
        }
        return this.firestoreInstance.runTransaction(async (transaction) => {
            for (const id of docIds) {
                const docRef = this.collection.doc(id);
                const docSnapshot = await transaction.get(docRef);
                if (!docSnapshot.exists) {
                    throw new Error(`Document with ID ${id} does not exist`);
                }
                transaction.delete(docRef);
            }
        });
    }
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
    async batchAddLarge(documents) {
        if (documents.length === 0) {
            throw new Error('Batch operation requires at least one document');
        }
        const chunks = [];
        for (let i = 0; i < documents.length; i += MAX_BATCH_SIZE) {
            chunks.push(documents.slice(i, i + MAX_BATCH_SIZE));
        }
        if (this.debugMode) {
            this.logger.debug(`Batch add large: splitting ${documents.length} documents into ${chunks.length} chunks`);
        }
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk)
                continue;
            await this.batchAdd(chunk);
            if (this.debugMode) {
                this.logger.debug(`Processed chunk ${i + 1}/${chunks.length}`);
            }
        }
    }
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
    async batchEditLarge(updates) {
        if (updates.length === 0) {
            throw new Error('Batch operation requires at least one document');
        }
        const chunks = [];
        for (let i = 0; i < updates.length; i += MAX_BATCH_SIZE) {
            chunks.push(updates.slice(i, i + MAX_BATCH_SIZE));
        }
        if (this.debugMode) {
            this.logger.debug(`Batch edit large: splitting ${updates.length} documents into ${chunks.length} chunks`);
        }
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk)
                continue;
            await this.batchEdit(chunk);
            if (this.debugMode) {
                this.logger.debug(`Processed chunk ${i + 1}/${chunks.length}`);
            }
        }
    }
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
    async batchRemoveLarge(docIds) {
        if (docIds.length === 0) {
            throw new Error('Batch operation requires at least one document ID');
        }
        const chunks = [];
        for (let i = 0; i < docIds.length; i += MAX_BATCH_SIZE) {
            chunks.push(docIds.slice(i, i + MAX_BATCH_SIZE));
        }
        if (this.debugMode) {
            this.logger.debug(`Batch remove large: splitting ${docIds.length} documents into ${chunks.length} chunks`);
        }
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            if (!chunk)
                continue;
            await this.batchRemove(chunk);
            if (this.debugMode) {
                this.logger.debug(`Processed chunk ${i + 1}/${chunks.length}`);
            }
        }
    }
    async getDocument(docId) {
        return this.collection.doc(docId).get();
    }
    async getDocumentData(docId) {
        const docSnapshot = await this.getDocument(docId);
        if (docSnapshot.exists) {
            const data = docSnapshot.data();
            if (!data) {
                return null;
            }
            return { id: docSnapshot.id, data };
        }
        return null;
    }
    /**
     * Executes a Firestore query with proper error handling
     * @param query - The Firestore query to execute
     * @param operation - The operation to perform on the query
     * @returns Result from the operation
     */
    async executeQuery(query, operation) {
        try {
            return await operation(query);
        }
        catch (error) {
            if (this.isFirestoreError(error) &&
                error.code === 'failed-precondition') {
                throw new Error(`Firestore index is required for this query. Please create the necessary index. ${this.getErrorMessage(error)}`);
            }
            throw new Error(`Query execution failed: ${this.getErrorMessage(error)}`);
        }
    }
    async findDocuments(query, options) {
        const findQuery = this.buildQuery(query);
        let firestoreQuery = findQuery;
        // Handle multiple orderBy fields
        if (options?.orderBy) {
            if (Array.isArray(options.orderBy)) {
                // Multiple orderBy fields
                options.orderBy.forEach(order => {
                    firestoreQuery = firestoreQuery.orderBy(order.field, order.direction || 'asc');
                });
            }
            else {
                // Single orderBy field (backward compatible)
                firestoreQuery = firestoreQuery.orderBy(options.orderBy, options.orderDirection || 'asc');
            }
        }
        if (options?.limit) {
            firestoreQuery = firestoreQuery.limit(options.limit);
        }
        if (options?.startAfterId) {
            const startAfterDoc = await this.collection
                .doc(options.startAfterId)
                .get();
            if (!startAfterDoc.exists) {
                throw new Error(`Document with ID ${options.startAfterId} does not exist`);
            }
            firestoreQuery = firestoreQuery.startAfter(startAfterDoc);
        }
        return this.executeQuery(firestoreQuery, async (q) => await q.get());
    }
    async findDocument(query) {
        const findQuery = this.buildQuery(query);
        const firestoreQuery = findQuery.limit(1);
        return this.executeQuery(firestoreQuery, async (q) => {
            const result = await q.get();
            return result?.docs?.[0] || null;
        });
    }
    async findDocumentsData(query, options) {
        const localOptions = {};
        if (options?.limit) {
            localOptions.limit = options.limit;
        }
        if (options?.orderBy) {
            localOptions.orderBy = options.orderBy;
        }
        if (options?.orderDirection) {
            localOptions.orderDirection = options.orderDirection;
        }
        if (options?.startAfterId) {
            localOptions.startAfterId = options.startAfterId;
        }
        const querySnapshot = await this.findDocuments(query, localOptions);
        return (querySnapshot?.docs || []).map(doc => ({
            id: doc.id,
            data: doc.data(),
        }));
    }
    async findDocumentData(query) {
        const doc = await this.findDocument(query);
        if (doc?.exists) {
            return {
                id: doc.id,
                data: doc.data(),
            };
        }
        return null;
    }
    buildQuery(filters) {
        // Validate query constraints before building
        this.validateQueryConstraints(filters);
        if (this.debugMode) {
            this.logger.debug(`Building query with ${filters.length} filters`, {
                collectionPath: this.collection.path,
                filters: filters.map(f => ({
                    field: String(f.field),
                    operator: f.operator,
                })),
            });
        }
        let query = this.collection;
        filters.forEach(filter => {
            query = query.where(filter.field, filter.operator, filter.value);
        });
        return query;
    }
    subscribeDocument(docId, callback, errorCallback) {
        const unsubscribe = this.collection.doc(docId).onSnapshot(snapshot => {
            if (!snapshot.exists) {
                const error = new Error(`Document with ID ${docId} does not exist`);
                this.logger.error('Document does not exist:', docId);
                if (errorCallback) {
                    errorCallback(error);
                }
                return;
            }
            const data = snapshot.data();
            if (!data) {
                const error = new Error(`Document with ID ${docId} has no data`);
                this.logger.error('Document has no data:', docId);
                if (errorCallback) {
                    errorCallback(error);
                }
                return;
            }
            try {
                callback({ id: snapshot.id, data });
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.logger.error('Error in document subscription callback:', this.getErrorMessage(err));
                if (errorCallback) {
                    errorCallback(err);
                }
            }
        }, error => {
            const err = error instanceof Error ? error : new Error(String(error));
            this.logger.error('Error in document subscription:', this.getErrorMessage(err));
            if (errorCallback) {
                errorCallback(err);
            }
        });
        return unsubscribe;
    }
    subscribeCollection(callback, errorCallback) {
        const unsubscribe = this.collection.onSnapshot(snapshot => {
            try {
                callback(snapshot);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.logger.error('Error in collection subscription callback:', this.getErrorMessage(err));
                if (errorCallback) {
                    errorCallback(err);
                }
            }
        }, error => {
            const err = error instanceof Error ? error : new Error(String(error));
            this.logger.error('Error in collection subscription:', this.getErrorMessage(err));
            if (errorCallback) {
                errorCallback(err);
            }
        });
        return unsubscribe;
    }
    subscribeQuery(query, callback, errorCallback) {
        const findQuery = this.buildQuery(query);
        const unsubscribe = findQuery.onSnapshot(snapshot => {
            try {
                callback(snapshot);
            }
            catch (error) {
                const err = error instanceof Error ? error : new Error(String(error));
                this.logger.error('Error in query subscription callback:', this.getErrorMessage(err));
                if (errorCallback) {
                    errorCallback(err);
                }
            }
        }, error => {
            let err;
            if (this.isFirestoreError(error) &&
                error.code === 'failed-precondition') {
                err = new Error(`Firestore index is required for this query. Please create the necessary index. ${this.getErrorMessage(error)}`);
            }
            else {
                err = new Error(`Failed to subscribe to query: ${this.getErrorMessage(error)}`);
            }
            this.logger.error('Error in query subscription:', this.getErrorMessage(err));
            if (errorCallback) {
                errorCallback(err);
            }
        });
        return unsubscribe;
    }
    /**
     * Helper method to get document reference for use in custom transactions
     * @param docId - Document ID
     * @returns Document reference
     */
    doc(docId) {
        return this.collection.doc(docId);
    }
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
    async atomicIncrement(docId, field, value) {
        const docRef = this.collection.doc(docId);
        return this.firestoreInstance.runTransaction(async (transaction) => {
            const docSnapshot = await transaction.get(docRef);
            if (!docSnapshot.exists) {
                throw new Error(`Document with ID ${docId} does not exist`);
            }
            const currentData = docSnapshot.data();
            if (!currentData) {
                throw new Error(`Document with ID ${docId} has no data`);
            }
            // Validate field is a number
            const currentValue = currentData[field];
            if (typeof currentValue !== 'number') {
                throw new Error(`Field '${String(field)}' is not a number. Current type: ${typeof currentValue}`);
            }
            const newValue = currentValue + value;
            const updateData = {
                [field]: newValue,
                updatedAt: this.getUnixTimestamp(),
            };
            transaction.update(docRef, updateData);
            const updatedData = {
                ...currentData,
                ...updateData,
            };
            return { id: docId, data: updatedData };
        });
    }
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
    async conditionalUpdate(docId, field, expectedValue, newData) {
        const docRef = this.collection.doc(docId);
        return this.firestoreInstance.runTransaction(async (transaction) => {
            const docSnapshot = await transaction.get(docRef);
            if (!docSnapshot.exists) {
                throw new Error(`Document with ID ${docId} does not exist`);
            }
            const currentData = docSnapshot.data();
            if (!currentData) {
                throw new Error(`Document with ID ${docId} has no data`);
            }
            // Check condition
            if (currentData[field] !== expectedValue) {
                return null; // Condition not met
            }
            // Validate update data
            this.validateDocumentData(newData);
            this.validateTimestampFields(newData);
            // Prevent updating the document ID
            if ('id' in newData) {
                throw new Error('Cannot update the document ID');
            }
            const timestampedData = {
                ...newData,
                updatedAt: this.getUnixTimestamp(),
            };
            transaction.update(docRef, timestampedData);
            const updatedData = {
                ...currentData,
                ...timestampedData,
            };
            return { id: docId, data: updatedData };
        });
    }
    /**
     * Validates query against Firestore constraints
     * Throws QueryValidationError if constraints are violated
     */
    validateQueryConstraints(query) {
        const operators = query.map(q => q.operator);
        // 1. Check for multiple != operators
        const notEqualCount = operators.filter(op => op === '!=').length;
        if (notEqualCount > 1) {
            const errorMsg = 'Cannot use multiple "!=" operators in the same query. Firestore allows only one "!=" per query.';
            this.logger.warn(`Query validation failed: ${errorMsg}`);
            throw new QueryValidationError(errorMsg);
        }
        // 2. Check for != combined with not-in
        const hasNotEqual = operators.includes('!=');
        const hasNotIn = operators.includes('not-in');
        if (hasNotEqual && hasNotIn) {
            const errorMsg = 'Cannot combine "!=" and "not-in" operators in the same query. Use only one of them.';
            this.logger.warn(`Query validation failed: ${errorMsg}`);
            throw new QueryValidationError(errorMsg);
        }
        // 3. Check for != combined with in
        const hasIn = operators.includes('in');
        if (hasNotEqual && hasIn) {
            const errorMsg = 'Cannot combine "!=" and "in" operators in the same query.';
            this.logger.warn(`Query validation failed: ${errorMsg}`);
            throw new QueryValidationError(errorMsg);
        }
        // 4. Check for multiple array-contains operators
        const arrayContainsCount = operators.filter(op => op === 'array-contains').length;
        if (arrayContainsCount > 1) {
            const errorMsg = 'Cannot use multiple "array-contains" operators in the same query. Use "array-contains-any" for multiple values.';
            this.logger.warn(`Query validation failed: ${errorMsg}`);
            throw new QueryValidationError(errorMsg);
        }
        // 5. Check for array-contains combined with array-contains-any
        const hasArrayContains = operators.includes('array-contains');
        const hasArrayContainsAny = operators.includes('array-contains-any');
        if (hasArrayContains && hasArrayContainsAny) {
            const errorMsg = 'Cannot combine "array-contains" and "array-contains-any" in the same query. Use only one of them.';
            this.logger.warn(`Query validation failed: ${errorMsg}`);
            throw new QueryValidationError(errorMsg);
        }
        // 6. Check for multiple "in" family operators
        const inFamilyOps = ['in', 'not-in', 'array-contains-any'].filter(op => operators.includes(op));
        if (inFamilyOps.length > 1) {
            const errorMsg = `Cannot use multiple "in" family operators (in, not-in, array-contains-any) in the same query. Found: ${inFamilyOps.join(', ')}`;
            this.logger.warn(`Query validation failed: ${errorMsg}`);
            throw new QueryValidationError(errorMsg);
        }
        // 7. Validate array sizes for in/not-in/array-contains-any (max 10 items)
        for (const queryItem of query) {
            if (['in', 'not-in', 'array-contains-any'].includes(queryItem.operator)) {
                const value = queryItem.value;
                if (Array.isArray(value) && value.length > 10) {
                    const errorMsg = `Operator "${queryItem.operator}" supports maximum 10 values, but ${value.length} were provided for field "${String(queryItem.field)}". Consider splitting into multiple queries.`;
                    this.logger.warn(`Query validation failed: ${errorMsg}`);
                    throw new QueryValidationError(errorMsg);
                }
            }
        }
        // 8. Check for range queries on different fields
        const rangeOperators = ['<', '<=', '>', '>=', '!='];
        const rangeFields = new Set();
        for (const queryItem of query) {
            if (rangeOperators.includes(queryItem.operator)) {
                rangeFields.add(queryItem.field);
            }
        }
        if (rangeFields.size > 1) {
            const fieldNames = Array.from(rangeFields)
                .map(f => String(f))
                .join(', ');
            const errorMsg = `Cannot use range operators (<, <=, >, >=, !=) on multiple fields. Found range queries on: ${fieldNames}. Firestore allows range operators on only one field per query.`;
            this.logger.warn(`Query validation failed: ${errorMsg}`);
            throw new QueryValidationError(errorMsg);
        }
    }
    isFirestoreError(error) {
        return (typeof error === 'object' &&
            error !== null &&
            'code' in error &&
            'message' in error);
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        if (typeof error === 'string') {
            return error;
        }
        return 'Unknown error';
    }
}
exports.default = FirestoreHelper;
//# sourceMappingURL=index.js.map