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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
class FirestoreHelper {
    constructor(firestoreInstance, collectionPath) {
        this.collection = firestoreInstance.collection(collectionPath);
        this.checkConnection().catch(error => {
            throw new Error(`Failed to connect to Firestore: ${this.getErrorMessage(error)}`);
        });
    }
    checkConnection() {
        return __awaiter(this, void 0, void 0, function* () {
            const testDocRef = this.collection.doc('__test__');
            try {
                yield testDocRef.get();
            }
            catch (error) {
                throw new Error(`Firestore connection check failed: ${this.getErrorMessage(error)}`);
            }
        });
    }
    generateRandomId(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * chars.length);
            result += chars[randomIndex];
        }
        return result;
    }
    generateUniqueId(length) {
        return __awaiter(this, void 0, void 0, function* () {
            let id;
            let doc;
            do {
                id = this.generateRandomId(length);
                doc = yield this.collection.doc(id).get();
            } while (doc.exists);
            return id;
        });
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
    addDocument(data, id, override) {
        return __awaiter(this, void 0, void 0, function* () {
            const docId = id || (yield this.generateUniqueId(30));
            const docRef = this.collection.doc(docId);
            const result = yield admin.firestore().runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                const docSnapshot = yield transaction.get(docRef);
                if (id && !(override || !docSnapshot.exists)) {
                    throw new Error(`Document with ID ${id} already exists. Use "override: true" to replace the data.`);
                }
                const timestampedData = Object.assign(Object.assign({}, data), { createdAt: id
                        ? ((_a = docSnapshot.data()) === null || _a === void 0 ? void 0 : _a.createdAt) || this.getUnixTimestamp()
                        : this.getUnixTimestamp(), updatedAt: this.getUnixTimestamp() });
                transaction.set(docRef, timestampedData, { merge: override });
                return { id: docId, data: timestampedData };
            }));
            return result;
        });
    }
    editDocument(docId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const docRef = this.collection.doc(docId);
            return admin.firestore().runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const docSnapshot = yield transaction.get(docRef);
                if (!docSnapshot.exists) {
                    throw new Error(`Document with ID ${docId} does not exist`);
                }
                this.validateTimestampFields(data);
                // Prevent updating the document ID
                if ('id' in data) {
                    throw new Error('Cannot update the document ID');
                }
                const timestampedData = Object.assign(Object.assign({}, data), { updatedAt: this.getUnixTimestamp() });
                transaction.update(docRef, timestampedData);
                // Fetch the updated document
                const updatedDocSnapshot = yield docRef.get();
                if (!updatedDocSnapshot.exists) {
                    throw new Error(`Document with ID ${docId} does not exist after update`);
                }
                return { id: updatedDocSnapshot.id, data: updatedDocSnapshot.data() };
            }));
        });
    }
    removeDocument(docId) {
        return __awaiter(this, void 0, void 0, function* () {
            const docRef = this.collection.doc(docId);
            return admin.firestore().runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                const docSnapshot = yield transaction.get(docRef);
                if (!docSnapshot.exists) {
                    throw new Error(`Document with ID ${docId} does not exist`);
                }
                transaction.delete(docRef);
            }));
        });
    }
    batchAdd(documents) {
        return __awaiter(this, void 0, void 0, function* () {
            return admin.firestore().runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                for (const { id, data, override } of documents) {
                    const docId = id || (yield this.generateUniqueId(30));
                    const docRef = this.collection.doc(docId);
                    const docSnapshot = yield transaction.get(docRef);
                    if (id && !(override || !docSnapshot.exists)) {
                        throw new Error(`Document with ID ${id} already exists. Use "override: true" to replace the data.`);
                    }
                    const timestampedData = Object.assign(Object.assign({}, data), { createdAt: id
                            ? ((_a = docSnapshot.data()) === null || _a === void 0 ? void 0 : _a.createdAt) || this.getUnixTimestamp()
                            : this.getUnixTimestamp(), updatedAt: this.getUnixTimestamp() });
                    transaction.set(docRef, timestampedData, { merge: override });
                }
            }));
        });
    }
    batchUpdate(updates) {
        return __awaiter(this, void 0, void 0, function* () {
            return admin.firestore().runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                for (const { id, data } of updates) {
                    const docRef = this.collection.doc(id);
                    const docSnapshot = yield transaction.get(docRef);
                    if (!docSnapshot.exists) {
                        throw new Error(`Document with ID ${id} does not exist`);
                    }
                    this.validateTimestampFields(data);
                    // Prevent updating the document ID
                    if ('id' in data) {
                        throw new Error('Cannot update the document ID');
                    }
                    const timestampedData = Object.assign(Object.assign({}, data), { updatedAt: this.getUnixTimestamp() });
                    transaction.update(docRef, timestampedData);
                }
            }));
        });
    }
    batchDelete(docIds) {
        return __awaiter(this, void 0, void 0, function* () {
            return admin.firestore().runTransaction((transaction) => __awaiter(this, void 0, void 0, function* () {
                for (const id of docIds) {
                    const docRef = this.collection.doc(id);
                    const docSnapshot = yield transaction.get(docRef);
                    if (!docSnapshot.exists) {
                        throw new Error(`Document with ID ${id} does not exist`);
                    }
                    transaction.delete(docRef);
                }
            }));
        });
    }
    getDocument(docId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.collection.doc(docId).get();
        });
    }
    getDocumentData(docId) {
        return __awaiter(this, void 0, void 0, function* () {
            const docSnapshot = yield this.getDocument(docId);
            return { id: docSnapshot.id, data: docSnapshot.data() };
        });
    }
    getDocuments(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 25, startAfterId) {
            let firestoreQuery = query.limit(limit);
            if (startAfterId) {
                const startAfterDoc = yield this.collection.doc(startAfterId).get();
                if (!startAfterDoc.exists) {
                    throw new Error(`Document with ID ${startAfterId} does not exist`);
                }
                firestoreQuery = firestoreQuery.startAfter(startAfterDoc);
            }
            try {
                return yield firestoreQuery.get();
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
        });
    }
    getDocumentsData(query_1) {
        return __awaiter(this, arguments, void 0, function* (query, limit = 25, startAfterId) {
            const querySnapshot = yield this.getDocuments(query, limit, startAfterId);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                data: doc.data(),
            }));
        });
    }
    buildQuery(filters) {
        return __awaiter(this, void 0, void 0, function* () {
            let query = this.collection;
            filters.forEach(filter => {
                query = query.where(filter.field, filter.operator, filter.value);
            });
            return query;
        });
    }
    subscribeDocument(docId, callback) {
        return this.collection.doc(docId).onSnapshot(snapshot => {
            if (!snapshot.exists) {
                throw new Error(`Document with ID ${docId} does not exist`);
            }
            callback({ id: snapshot.id, data: snapshot.data() });
        }, error => {
            console.error('Error in collection callback:', this.getErrorMessage(error));
            throw error;
        });
    }
    subscribeCollection(callback) {
        return this.collection.onSnapshot(snapshot => {
            try {
                callback(snapshot);
            }
            catch (error) {
                console.error('Error in collection callback:', this.getErrorMessage(error));
                throw error; // Re-throwing to allow higher-level handlers to catch it
            }
        }, error => {
            throw new Error(`Failed to subscribe to collection: ${this.getErrorMessage(error)}`);
        });
    }
    subscribeQuery(query, callback) {
        return query.onSnapshot(snapshot => {
            try {
                callback(snapshot);
            }
            catch (error) {
                console.error('Error in query callback:', this.getErrorMessage(error));
                throw error; // Re-throwing to allow higher-level handlers to catch it
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
    }
    isFirestoreError(error) {
        return error && error.code && error.message;
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return 'Unknown error';
    }
}
exports.default = FirestoreHelper;
//# sourceMappingURL=index.js.map