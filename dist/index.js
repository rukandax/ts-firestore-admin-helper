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
const crypto = __importStar(require("crypto"));
// Constants
const DEFAULT_ID_LENGTH = 30;
const MAX_BATCH_SIZE = 500; // Firestore transaction limit
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
class FirestoreHelper {
    constructor(firestoreInstance, collectionPath) {
        this.firestoreInstance = firestoreInstance;
        this.collection = firestoreInstance.collection(collectionPath);
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
    getUnixTimestamp() {
        return Date.now(); // Milliseconds since Unix epoch
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
    async addDocument(data, id, override) {
        // Validate document data
        this.validateDocumentData(data);
        // Validate custom ID if provided
        if (id) {
            this.validateCustomId(id);
        }
        const docId = id || (await this.generateUniqueId(DEFAULT_ID_LENGTH));
        const docRef = this.collection.doc(docId);
        const result = await this.firestoreInstance.runTransaction(async (transaction) => {
            const docSnapshot = await transaction.get(docRef);
            if (id && !(override || !docSnapshot.exists)) {
                throw new Error(`Document with ID ${id} already exists. Use "override: true" to replace the data.`);
            }
            const existingData = docSnapshot.data();
            const timestampedData = {
                ...data,
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
        // Validate document data
        this.validateDocumentData(data);
        const docRef = this.collection.doc(docId);
        return this.firestoreInstance.runTransaction(async (transaction) => {
            const docSnapshot = await transaction.get(docRef);
            if (!docSnapshot.exists) {
                throw new Error(`Document with ID ${docId} does not exist`);
            }
            this.validateTimestampFields(data);
            // Prevent updating the document ID
            if ('id' in data) {
                throw new Error('Cannot update the document ID');
            }
            const timestampedData = {
                ...data,
                updatedAt: this.getUnixTimestamp(),
            };
            transaction.update(docRef, timestampedData);
            // Merge current data with updated data to return complete document
            const currentData = docSnapshot.data();
            if (!currentData) {
                throw new Error(`Document with ID ${docId} has no data`);
            }
            const updatedData = {
                ...currentData,
                ...timestampedData,
            };
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
        // Validate all documents and custom IDs before transaction
        for (const { id, data } of documents) {
            this.validateDocumentData(data);
            if (id) {
                this.validateCustomId(id);
            }
        }
        // Generate all IDs before transaction to avoid race conditions
        const documentsWithIds = await Promise.all(documents.map(async ({ id, data, override }) => ({
            id: id || (await this.generateUniqueId(DEFAULT_ID_LENGTH)),
            data,
            override,
        })));
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
        // Validate all updates before transaction
        for (const { data } of updates) {
            this.validateDocumentData(data);
            this.validateTimestampFields(data);
            // Prevent updating the document ID
            if ('id' in data) {
                throw new Error('Cannot update the document ID');
            }
        }
        return this.firestoreInstance.runTransaction(async (transaction) => {
            for (const { id, data } of updates) {
                const docRef = this.collection.doc(id);
                const docSnapshot = await transaction.get(docRef);
                if (!docSnapshot.exists) {
                    throw new Error(`Document with ID ${id} does not exist`);
                }
                const timestampedData = {
                    ...data,
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
    async findDocuments(query, options) {
        const findQuery = this.buildQuery(query);
        let firestoreQuery = findQuery;
        if (options?.orderBy) {
            firestoreQuery = firestoreQuery.orderBy(options.orderBy, options.orderDirection || 'asc');
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
        try {
            return await firestoreQuery.get();
        }
        catch (error) {
            if (this.isFirestoreError(error) &&
                error.code === 'failed-precondition') {
                const message = `Firestore index is required for this query. Please create the necessary index. ${this.getErrorMessage(error)}`;
                throw new Error(message);
            }
            else {
                throw new Error(`Failed to get documents: ${this.getErrorMessage(error)}`);
            }
        }
    }
    async findDocument(query) {
        const findQuery = this.buildQuery(query);
        const firestoreQuery = findQuery.limit(1);
        try {
            const doc = (await firestoreQuery.get())?.docs?.[0] || null;
            return doc;
        }
        catch (error) {
            if (this.isFirestoreError(error) &&
                error.code === 'failed-precondition') {
                const message = `Firestore index is required for this query. Please create the necessary index. ${this.getErrorMessage(error)}`;
                throw new Error(message);
            }
            else {
                throw new Error(`Failed to get documents: ${this.getErrorMessage(error)}`);
            }
        }
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
        let query = this.collection;
        filters.forEach(filter => {
            query = query.where(filter.field, filter.operator, filter.value);
        });
        return query;
    }
    subscribeDocument(docId, callback) {
        const unsubscribe = this.collection.doc(docId).onSnapshot(snapshot => {
            if (!snapshot.exists) {
                throw new Error(`Document with ID ${docId} does not exist`);
            }
            const data = snapshot.data();
            if (!data) {
                throw new Error(`Document with ID ${docId} has no data`);
            }
            try {
                callback({ id: snapshot.id, data });
            }
            catch (error) {
                console.error('Error in document subscription callback:', this.getErrorMessage(error));
                // Unsubscribe on callback error to prevent memory leaks
                unsubscribe();
                throw error;
            }
        }, error => {
            console.error('Error in document subscription:', this.getErrorMessage(error));
            throw error;
        });
        return unsubscribe;
    }
    subscribeCollection(callback) {
        const unsubscribe = this.collection.onSnapshot(snapshot => {
            try {
                callback(snapshot);
            }
            catch (error) {
                console.error('Error in collection subscription callback:', this.getErrorMessage(error));
                // Unsubscribe on callback error to prevent memory leaks
                unsubscribe();
                throw error;
            }
        }, error => {
            throw new Error(`Failed to subscribe to collection: ${this.getErrorMessage(error)}`);
        });
        return unsubscribe;
    }
    subscribeQuery(query, callback) {
        const findQuery = this.buildQuery(query);
        const unsubscribe = findQuery.onSnapshot(snapshot => {
            try {
                callback(snapshot);
            }
            catch (error) {
                console.error('Error in query subscription callback:', this.getErrorMessage(error));
                // Unsubscribe on callback error to prevent memory leaks
                unsubscribe();
                throw error;
            }
        }, error => {
            if (this.isFirestoreError(error) &&
                error.code === 'failed-precondition') {
                const message = `Firestore index is required for this query. Please create the necessary index. ${this.getErrorMessage(error)}`;
                throw new Error(message);
            }
            else {
                throw new Error(`Failed to subscribe to query: ${this.getErrorMessage(error)}`);
            }
        });
        return unsubscribe;
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