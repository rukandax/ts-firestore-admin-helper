import * as admin from 'firebase-admin';

// Define a base interface for documents that includes common fields
interface BaseDocument {
  createdAt?: number; // Unix timestamp
  updatedAt?: number; // Unix timestamp
}

// Define a type for a query filter where the field must be a key of T
type QueryFilter<T> = {
  field: keyof T; // Ensures field is a key of T
  operator: FirebaseFirestore.WhereFilterOp;
  value: any;
};

export default class FirestoreHelper<T extends BaseDocument = BaseDocument> {
  private collection: admin.firestore.CollectionReference<T>;

  constructor(
    firestoreInstance: admin.firestore.Firestore,
    collectionPath: string
  ) {
    this.collection = firestoreInstance.collection(
      collectionPath
    ) as admin.firestore.CollectionReference<T>;

    this.checkConnection().catch(error => {
      throw new Error(
        `Failed to connect to Firestore: ${this.getErrorMessage(error)}`
      );
    });
  }

  private async checkConnection(): Promise<void> {
    const testDocRef = this.collection.doc('__test__');
    try {
      await testDocRef.get();
    } catch (error) {
      throw new Error(
        `Firestore connection check failed: ${this.getErrorMessage(error)}`
      );
    }
  }

  private generateRandomId(length: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * chars.length);
      result += chars[randomIndex];
    }
    return result;
  }

  private async generateUniqueId(length: number) {
    let id;
    let doc: admin.firestore.DocumentSnapshot<T>;

    do {
      id = this.generateRandomId(length);
      doc = await this.collection.doc(id).get();
    } while (doc.exists);

    return id;
  }

  private getUnixTimestamp() {
    return Date.now(); // Milliseconds since Unix epoch
  }

  private validateUnixTimestamp(timestamp: number) {
    return (
      typeof timestamp === 'number' &&
      Number.isInteger(timestamp) &&
      timestamp >= 0
    );
  }

  private validateTimestampFields(data: Partial<T>): void {
    if (
      data.createdAt !== undefined &&
      !this.validateUnixTimestamp(data.createdAt)
    ) {
      throw new Error(`Invalid value for createdAt: ${data.createdAt}`);
    }
    if (
      data.updatedAt !== undefined &&
      !this.validateUnixTimestamp(data.updatedAt)
    ) {
      throw new Error(`Invalid value for updatedAt: ${data.updatedAt}`);
    }
  }

  async addDocument(
    data: T,
    id?: string,
    override?: boolean
  ): Promise<{id: string; data: T}> {
    const docId = id || (await this.generateUniqueId(30));
    const docRef = this.collection.doc(docId);

    const result = await admin.firestore().runTransaction(async transaction => {
      const docSnapshot = await transaction.get(docRef);

      if (id && !(override || !docSnapshot.exists)) {
        throw new Error(
          `Document with ID ${id} already exists. Use "override: true" to replace the data.`
        );
      }

      const timestampedData: T = {
        ...data,
        createdAt: id
          ? docSnapshot.data()?.createdAt || this.getUnixTimestamp()
          : this.getUnixTimestamp(),
        updatedAt: this.getUnixTimestamp(),
      };

      transaction.set(docRef, timestampedData, {merge: override});

      return {id: docId, data: timestampedData};
    });

    return result;
  }

  async editDocument(
    docId: string,
    data: Partial<T>
  ): Promise<{id: string; data: T}> {
    const docRef = this.collection.doc(docId);

    return admin.firestore().runTransaction(async transaction => {
      const docSnapshot = await transaction.get(docRef);

      if (!docSnapshot.exists) {
        throw new Error(`Document with ID ${docId} does not exist`);
      }

      this.validateTimestampFields(data);

      // Prevent updating the document ID
      if ('id' in data) {
        throw new Error('Cannot update the document ID');
      }

      const timestampedData: Partial<T> = {
        ...data,
        updatedAt: this.getUnixTimestamp(),
      };

      transaction.update(
        docRef,
        timestampedData as admin.firestore.UpdateData<T>
      );

      // Fetch the updated document
      const updatedDocSnapshot = await docRef.get();
      if (!updatedDocSnapshot.exists) {
        throw new Error(
          `Document with ID ${docId} does not exist after update`
        );
      }

      return {id: updatedDocSnapshot.id, data: updatedDocSnapshot.data() as T};
    });
  }

  async removeDocument(docId: string): Promise<void> {
    const docRef = this.collection.doc(docId);

    return admin.firestore().runTransaction(async transaction => {
      const docSnapshot = await transaction.get(docRef);

      if (!docSnapshot.exists) {
        throw new Error(`Document with ID ${docId} does not exist`);
      }

      transaction.delete(docRef);
    });
  }

  async batchAdd(
    documents: {id?: string; data: T; override?: boolean}[]
  ): Promise<void> {
    return admin.firestore().runTransaction(async transaction => {
      for (const {id, data, override} of documents) {
        const docId = id || (await this.generateUniqueId(30));
        const docRef = this.collection.doc(docId);
        const docSnapshot = await transaction.get(docRef);

        if (id && !(override || !docSnapshot.exists)) {
          throw new Error(
            `Document with ID ${id} already exists. Use "override: true" to replace the data.`
          );
        }

        const timestampedData: T = {
          ...data,
          createdAt: id
            ? docSnapshot.data()?.createdAt || this.getUnixTimestamp()
            : this.getUnixTimestamp(),
          updatedAt: this.getUnixTimestamp(),
        };

        transaction.set(docRef, timestampedData, {merge: override});
      }
    });
  }

  async batchUpdate(updates: {id: string; data: Partial<T>}[]): Promise<void> {
    return admin.firestore().runTransaction(async transaction => {
      for (const {id, data} of updates) {
        const docRef = this.collection.doc(id);
        const docSnapshot = await transaction.get(docRef);

        if (!docSnapshot.exists) {
          throw new Error(`Document with ID ${id} does not exist`);
        }

        this.validateTimestampFields(data);

        // Prevent updating the document ID
        if ('id' in data) {
          throw new Error('Cannot update the document ID');
        }

        const timestampedData: Partial<T> = {
          ...data,
          updatedAt: this.getUnixTimestamp(),
        };

        transaction.update(
          docRef,
          timestampedData as admin.firestore.UpdateData<T>
        );
      }
    });
  }

  async batchDelete(docIds: string[]): Promise<void> {
    return admin.firestore().runTransaction(async transaction => {
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

  async getDocument(
    docId: string
  ): Promise<admin.firestore.DocumentSnapshot<T>> {
    return this.collection.doc(docId).get();
  }

  async getDocumentData(docId: string): Promise<{id: string; data: T | null}> {
    const docSnapshot = await this.getDocument(docId);
    return {id: docSnapshot.id, data: docSnapshot.data() as T | null};
  }

  async getDocuments(
    query: admin.firestore.Query<T>,
    limit = 25,
    startAfterId?: string
  ): Promise<admin.firestore.QuerySnapshot<T>> {
    let firestoreQuery = query.limit(limit);

    if (startAfterId) {
      const startAfterDoc = await this.collection.doc(startAfterId).get();
      if (!startAfterDoc.exists) {
        throw new Error(`Document with ID ${startAfterId} does not exist`);
      }
      firestoreQuery = firestoreQuery.startAfter(startAfterDoc);
    }

    try {
      return await firestoreQuery.get();
    } catch (error) {
      if (
        this.isFirestoreError(error) &&
        error.code === 'failed-precondition'
      ) {
        const message = `Firestore index is required for this query. Please create the necessary index. ${this.getErrorMessage(error)}`;
        throw new Error(message);
      } else {
        throw new Error(
          `Failed to get documents: ${this.getErrorMessage(error)}`
        );
      }
    }
  }

  async getDocumentsData(
    query: admin.firestore.Query<T>,
    limit = 25,
    startAfterId?: string
  ): Promise<{id: string; data: T | null}[]> {
    const querySnapshot = await this.getDocuments(query, limit, startAfterId);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data() as T | null,
    }));
  }

  async queryDocuments(
    filters: QueryFilter<T>[],
    limit = 25,
    startAfterId?: string
  ): Promise<{id: string; data: T | null}[]> {
    let query: admin.firestore.Query<T> = this.collection;

    filters.forEach(filter => {
      query = query.where(
        filter.field as string,
        filter.operator,
        filter.value
      );
    });

    return this.getDocumentsData(query, limit, startAfterId);
  }

  subscribeDocument(
    docId: string,
    callback: (doc: {id: string; data: T}) => void
  ): () => void {
    return this.collection.doc(docId).onSnapshot(
      snapshot => {
        if (!snapshot.exists) {
          throw new Error(`Document with ID ${docId} does not exist`);
        }
        callback({id: snapshot.id, data: snapshot.data() as T});
      },
      error => {
        console.error(
          'Error in collection callback:',
          this.getErrorMessage(error)
        );
        throw error;
      }
    );
  }

  subscribeCollection(
    callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void
  ): () => void {
    return this.collection.onSnapshot(
      snapshot => {
        try {
          callback(snapshot as admin.firestore.QuerySnapshot<T>);
        } catch (error) {
          console.error(
            'Error in collection callback:',
            this.getErrorMessage(error)
          );
          throw error; // Re-throwing to allow higher-level handlers to catch it
        }
      },
      error => {
        throw new Error(
          `Failed to subscribe to collection: ${this.getErrorMessage(error)}`
        );
      }
    );
  }

  subscribeQuery(
    query: admin.firestore.Query<T>,
    callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void
  ): () => void {
    return query.onSnapshot(
      snapshot => {
        try {
          callback(snapshot as admin.firestore.QuerySnapshot<T>);
        } catch (error) {
          console.error(
            'Error in query callback:',
            this.getErrorMessage(error)
          );
          throw error; // Re-throwing to allow higher-level handlers to catch it
        }
      },
      error => {
        if (
          this.isFirestoreError(error) &&
          error.code === 'failed-precondition'
        ) {
          const message = `Firestore index is required for this query. Please create the necessary index. ${this.getErrorMessage(error)}`;
          throw new Error(message);
        } else {
          throw new Error(
            `Failed to subscribe to query: ${this.getErrorMessage(error)}`
          );
        }
      }
    );
  }

  private isFirestoreError(error: any): error is admin.FirebaseError {
    return error && error.code && error.message;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return 'Unknown error';
  }
}
