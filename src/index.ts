import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Constants
const DEFAULT_ID_LENGTH = 30;
const MAX_BATCH_SIZE = 500; // Firestore transaction limit
const ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

interface BaseDocument {
  createdAt?: number; // Unix timestamp
  updatedAt?: number; // Unix timestamp
}

type QueryPayload<T> = {
  field: keyof T; // Ensures field is a key of T
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
  private collection: admin.firestore.CollectionReference<T>;
  private firestoreInstance: admin.firestore.Firestore;

  constructor(
    firestoreInstance: admin.firestore.Firestore,
    collectionPath: string
  ) {
    this.firestoreInstance = firestoreInstance;
    this.collection = firestoreInstance.collection(
      collectionPath
    ) as admin.firestore.CollectionReference<T>;
  }

  /**
   * Validates Firestore connection by attempting a simple read operation
   * @throws Error if connection fails
   */
  async validateConnection(): Promise<void> {
    const testDocRef = this.collection.doc(
      'ts_firestore_admin_helper_test_connection'
    );

    try {
      await testDocRef.get();
    } catch (error) {
      throw new Error(
        `Firestore connection check failed: ${this.getErrorMessage(error)}`
      );
    }
  }

  /**
   * Generates a cryptographically secure random ID
   */
  private generateRandomId(length: number): string {
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
  private validateCustomId(id: string): void {
    if (!id || typeof id !== 'string') {
      throw new Error('Document ID must be a non-empty string');
    }
    if (id.length > 1500) {
      throw new Error('Document ID must not exceed 1500 characters');
    }
    if (id.startsWith('__') && id.endsWith('__')) {
      throw new Error(
        'Document ID cannot start and end with double underscores'
      );
    }
    // Firestore doesn't allow certain characters in document IDs
    if (/[/]/.test(id)) {
      throw new Error('Document ID cannot contain forward slashes');
    }
  }

  /**
   * Validates document data is not empty
   */
  private validateDocumentData(data: Partial<T>): void {
    if (!data || typeof data !== 'object') {
      throw new Error('Document data must be a valid object');
    }
    const keys = Object.keys(data).filter(
      key => key !== 'createdAt' && key !== 'updatedAt'
    );
    if (keys.length === 0) {
      throw new Error('Document data cannot be empty');
    }
  }

  private async generateUniqueId(length: number): Promise<string> {
    let id: string;
    let doc: admin.firestore.DocumentSnapshot<T>;

    do {
      id = this.generateRandomId(length);
      doc = await this.collection.doc(id).get();
    } while (doc.exists);

    return id;
  }

  private getUnixTimestamp(): number {
    return Date.now(); // Milliseconds since Unix epoch
  }

  private validateUnixTimestamp(timestamp: number): boolean {
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
    // Validate document data
    this.validateDocumentData(data);

    // Validate custom ID if provided
    if (id) {
      this.validateCustomId(id);
    }

    const docId = id || (await this.generateUniqueId(DEFAULT_ID_LENGTH));
    const docRef = this.collection.doc(docId);

    const result = await this.firestoreInstance.runTransaction(
      async transaction => {
        const docSnapshot = await transaction.get(docRef);

        if (id && !(override || !docSnapshot.exists)) {
          throw new Error(
            `Document with ID ${id} already exists. Use "override: true" to replace the data.`
          );
        }

        const existingData = docSnapshot.data();
        const timestampedData: T = {
          ...data,
          createdAt: id
            ? existingData?.createdAt || this.getUnixTimestamp()
            : this.getUnixTimestamp(),
          updatedAt: this.getUnixTimestamp(),
        };

        transaction.set(docRef, timestampedData, {merge: override});

        return {id: docId, data: timestampedData};
      }
    );

    return result;
  }

  async editDocument(
    docId: string,
    data: Partial<T>
  ): Promise<{id: string; data: T}> {
    // Validate document data
    this.validateDocumentData(data);

    const docRef = this.collection.doc(docId);

    return this.firestoreInstance.runTransaction(async transaction => {
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

      // Merge current data with updated data to return complete document
      const currentData = docSnapshot.data();
      if (!currentData) {
        throw new Error(`Document with ID ${docId} has no data`);
      }

      const updatedData: T = {
        ...currentData,
        ...timestampedData,
      } as T;

      return {id: docSnapshot.id, data: updatedData};
    });
  }

  async removeDocument(docId: string): Promise<void> {
    const docRef = this.collection.doc(docId);

    return this.firestoreInstance.runTransaction(async transaction => {
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
    if (documents.length === 0) {
      throw new Error('Batch operation requires at least one document');
    }

    if (documents.length > MAX_BATCH_SIZE) {
      throw new Error(
        `Batch size exceeds Firestore limit. Maximum ${MAX_BATCH_SIZE} documents allowed, received ${documents.length}`
      );
    }

    // Validate all documents and custom IDs before transaction
    for (const {id, data} of documents) {
      this.validateDocumentData(data);
      if (id) {
        this.validateCustomId(id);
      }
    }

    // Generate all IDs before transaction to avoid race conditions
    const documentsWithIds = await Promise.all(
      documents.map(async ({id, data, override}) => ({
        id: id || (await this.generateUniqueId(DEFAULT_ID_LENGTH)),
        data,
        override,
      }))
    );

    return this.firestoreInstance.runTransaction(async transaction => {
      for (const {id, data, override} of documentsWithIds) {
        const docRef = this.collection.doc(id);
        const docSnapshot = await transaction.get(docRef);

        if (!(override || !docSnapshot.exists)) {
          throw new Error(
            `Document with ID ${id} already exists. Use "override: true" to replace the data.`
          );
        }

        const existingData = docSnapshot.data();
        const timestampedData: T = {
          ...data,
          createdAt: existingData?.createdAt || this.getUnixTimestamp(),
          updatedAt: this.getUnixTimestamp(),
        };

        transaction.set(docRef, timestampedData, {merge: override});
      }
    });
  }

  async batchEdit(updates: {id: string; data: Partial<T>}[]): Promise<void> {
    if (updates.length === 0) {
      throw new Error('Batch operation requires at least one document');
    }

    if (updates.length > MAX_BATCH_SIZE) {
      throw new Error(
        `Batch size exceeds Firestore limit. Maximum ${MAX_BATCH_SIZE} documents allowed, received ${updates.length}`
      );
    }

    // Validate all updates before transaction
    for (const {data} of updates) {
      this.validateDocumentData(data);
      this.validateTimestampFields(data);

      // Prevent updating the document ID
      if ('id' in data) {
        throw new Error('Cannot update the document ID');
      }
    }

    return this.firestoreInstance.runTransaction(async transaction => {
      for (const {id, data} of updates) {
        const docRef = this.collection.doc(id);
        const docSnapshot = await transaction.get(docRef);

        if (!docSnapshot.exists) {
          throw new Error(`Document with ID ${id} does not exist`);
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

  async batchRemove(docIds: string[]): Promise<void> {
    if (docIds.length === 0) {
      throw new Error('Batch operation requires at least one document ID');
    }

    if (docIds.length > MAX_BATCH_SIZE) {
      throw new Error(
        `Batch size exceeds Firestore limit. Maximum ${MAX_BATCH_SIZE} documents allowed, received ${docIds.length}`
      );
    }

    return this.firestoreInstance.runTransaction(async transaction => {
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

  async getDocumentData(docId: string): Promise<{id: string; data: T} | null> {
    const docSnapshot = await this.getDocument(docId);
    if (docSnapshot.exists) {
      const data = docSnapshot.data();
      if (!data) {
        return null;
      }
      return {id: docSnapshot.id, data};
    }
    return null;
  }

  async findDocuments(
    query: QueryPayload<T>[],
    options?: QueryOptions<T>
  ): Promise<admin.firestore.QuerySnapshot<T>> {
    const findQuery = this.buildQuery(query);
    let firestoreQuery = findQuery;

    if (options?.orderBy) {
      firestoreQuery = firestoreQuery.orderBy(
        options.orderBy as string,
        options.orderDirection || 'asc'
      );
    }

    if (options?.limit) {
      firestoreQuery = firestoreQuery.limit(options.limit);
    }

    if (options?.startAfterId) {
      const startAfterDoc = await this.collection
        .doc(options.startAfterId)
        .get();

      if (!startAfterDoc.exists) {
        throw new Error(
          `Document with ID ${options.startAfterId} does not exist`
        );
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

  async findDocument(
    query: QueryPayload<T>[]
  ): Promise<admin.firestore.QueryDocumentSnapshot<
    T,
    admin.firestore.DocumentData
  > | null> {
    const findQuery = this.buildQuery(query);
    const firestoreQuery = findQuery.limit(1);

    try {
      const doc = (await firestoreQuery.get())?.docs?.[0] || null;
      return doc;
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

  async findDocumentsData(
    query: QueryPayload<T>[],
    options?: QueryOptions<T>
  ): Promise<{id: string; data: T}[]> {
    const localOptions: QueryOptions<T> = {};

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
      data: doc.data() as T,
    }));
  }

  async findDocumentData(
    query: QueryPayload<T>[]
  ): Promise<{id: string; data: T} | null> {
    const doc = await this.findDocument(query);

    if (doc?.exists) {
      return {
        id: doc.id,
        data: doc.data(),
      };
    }

    return null;
  }

  buildQuery(filters: QueryPayload<T>[]): admin.firestore.Query<T> {
    let query: admin.firestore.Query<T> = this.collection;

    filters.forEach(filter => {
      query = query.where(
        filter.field as string,
        filter.operator,
        filter.value
      );
    });

    return query;
  }

  subscribeDocument(
    docId: string,
    callback: (doc: {id: string; data: T}) => void
  ): () => void {
    const unsubscribe = this.collection.doc(docId).onSnapshot(
      snapshot => {
        if (!snapshot.exists) {
          throw new Error(`Document with ID ${docId} does not exist`);
        }
        const data = snapshot.data();
        if (!data) {
          throw new Error(`Document with ID ${docId} has no data`);
        }
        try {
          callback({id: snapshot.id, data});
        } catch (error) {
          console.error(
            'Error in document subscription callback:',
            this.getErrorMessage(error)
          );
          // Unsubscribe on callback error to prevent memory leaks
          unsubscribe();
          throw error;
        }
      },
      error => {
        console.error(
          'Error in document subscription:',
          this.getErrorMessage(error)
        );
        throw error;
      }
    );
    return unsubscribe;
  }

  subscribeCollection(
    callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void
  ): () => void {
    const unsubscribe = this.collection.onSnapshot(
      snapshot => {
        try {
          callback(snapshot as admin.firestore.QuerySnapshot<T>);
        } catch (error) {
          console.error(
            'Error in collection subscription callback:',
            this.getErrorMessage(error)
          );
          // Unsubscribe on callback error to prevent memory leaks
          unsubscribe();
          throw error;
        }
      },
      error => {
        throw new Error(
          `Failed to subscribe to collection: ${this.getErrorMessage(error)}`
        );
      }
    );
    return unsubscribe;
  }

  subscribeQuery(
    query: QueryPayload<T>[],
    callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void
  ): () => void {
    const findQuery = this.buildQuery(query);
    const unsubscribe = findQuery.onSnapshot(
      snapshot => {
        try {
          callback(snapshot as admin.firestore.QuerySnapshot<T>);
        } catch (error) {
          console.error(
            'Error in query subscription callback:',
            this.getErrorMessage(error)
          );
          // Unsubscribe on callback error to prevent memory leaks
          unsubscribe();
          throw error;
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
    return unsubscribe;
  }

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
  async runTransaction<R>(
    callback: (transaction: admin.firestore.Transaction) => Promise<R>
  ): Promise<R> {
    return this.firestoreInstance.runTransaction(callback);
  }

  /**
   * Helper method to get document reference for use in custom transactions
   * @param docId - Document ID
   * @returns Document reference
   */
  doc(docId: string): admin.firestore.DocumentReference<T> {
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
  async atomicIncrement(
    docId: string,
    field: keyof T,
    value: number
  ): Promise<{id: string; data: T}> {
    const docRef = this.collection.doc(docId);

    return this.firestoreInstance.runTransaction(async transaction => {
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
        throw new Error(
          `Field '${String(field)}' is not a number. Current type: ${typeof currentValue}`
        );
      }

      const newValue = currentValue + value;

      const updateData: Partial<T> = {
        [field]: newValue,
        updatedAt: this.getUnixTimestamp(),
      } as Partial<T>;

      transaction.update(docRef, updateData as admin.firestore.UpdateData<T>);

      const updatedData: T = {
        ...currentData,
        ...updateData,
      } as T;

      return {id: docId, data: updatedData};
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
  async conditionalUpdate(
    docId: string,
    field: keyof T,
    expectedValue: T[keyof T],
    newData: Partial<T>
  ): Promise<{id: string; data: T} | null> {
    const docRef = this.collection.doc(docId);

    return this.firestoreInstance.runTransaction(async transaction => {
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

      const timestampedData: Partial<T> = {
        ...newData,
        updatedAt: this.getUnixTimestamp(),
      };

      transaction.update(
        docRef,
        timestampedData as admin.firestore.UpdateData<T>
      );

      const updatedData: T = {
        ...currentData,
        ...timestampedData,
      } as T;

      return {id: docId, data: updatedData};
    });
  }

  private isFirestoreError(error: unknown): error is admin.FirebaseError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      'message' in error
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'Unknown error';
  }
}
