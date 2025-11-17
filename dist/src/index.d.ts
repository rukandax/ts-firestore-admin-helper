import * as admin from 'firebase-admin';
interface BaseDocument {
    createdAt?: number;
    updatedAt?: number;
}
type QueryPayload<T> = {
    field: keyof T;
    operator: FirebaseFirestore.WhereFilterOp;
    value: T[keyof T] | T[keyof T][] | boolean | null;
};
type QueryOptions<T> = {
    orderBy?: keyof T;
    orderDirection?: 'asc' | 'desc';
    limit?: number;
    startAfterId?: string;
};
export default class FirestoreHelper<T extends BaseDocument = BaseDocument> {
    private collection;
    private firestoreInstance;
    constructor(firestoreInstance: admin.firestore.Firestore, collectionPath: string);
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
    private getUnixTimestamp;
    private validateUnixTimestamp;
    private validateTimestampFields;
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
    getDocument(docId: string): Promise<admin.firestore.DocumentSnapshot<T>>;
    getDocumentData(docId: string): Promise<{
        id: string;
        data: T;
    } | null>;
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
    }) => void): () => void;
    subscribeCollection(callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void): () => void;
    subscribeQuery(query: QueryPayload<T>[], callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void): () => void;
    /**
     * Executes a custom transaction with full control
     * Perfect for complex operations like balance updates, inventory management, etc.
     *
     * @param callback - Transaction callback with transaction context
     * @returns Result from the transaction callback
     *
     * @example
     * // Transfer balance between users
     * await collection.runTransaction(async (transaction) => {
     *   const senderRef = collection.doc('user1');
     *   const receiverRef = collection.doc('user2');
     *
     *   const senderDoc = await transaction.get(senderRef);
     *   const receiverDoc = await transaction.get(receiverRef);
     *
     *   if (!senderDoc.exists || !receiverDoc.exists) {
     *     throw new Error('User not found');
     *   }
     *
     *   const senderData = senderDoc.data();
     *   const receiverData = receiverDoc.data();
     *
     *   if (senderData.balance < amount) {
     *     throw new Error('Insufficient balance');
     *   }
     *
     *   transaction.update(senderRef, {
     *     balance: senderData.balance - amount,
     *     updatedAt: Date.now()
     *   });
     *
     *   transaction.update(receiverRef, {
     *     balance: receiverData.balance + amount,
     *     updatedAt: Date.now()
     *   });
     *
     *   return { success: true, amount };
     * });
     */
    runTransaction<R>(callback: (transaction: admin.firestore.Transaction) => Promise<R>): Promise<R>;
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
    private isFirestoreError;
    private getErrorMessage;
}
export {};
//# sourceMappingURL=index.d.ts.map