import * as admin from 'firebase-admin';
interface BaseDocument {
    createdAt?: number;
    updatedAt?: number;
}
type QueryPayload<T> = {
    field: keyof T;
    operator: FirebaseFirestore.WhereFilterOp;
    value: any;
};
type QueryOptions<T> = {
    orderBy?: keyof T;
    orderDirection?: 'ASC' | 'DESC';
    limit?: number;
    startAfterId?: string;
};
export default class FirestoreHelper<T extends BaseDocument = BaseDocument> {
    private collection;
    constructor(firestoreInstance: admin.firestore.Firestore, collectionPath: string);
    private checkConnection;
    private generateRandomId;
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