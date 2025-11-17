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
    private isFirestoreError;
    private getErrorMessage;
}
export {};
//# sourceMappingURL=index.d.ts.map