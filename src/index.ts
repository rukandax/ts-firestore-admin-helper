import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

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

interface ServiceAccountJSON {
  type?: string;
  project_id?: string;
  private_key_id?: string;
  private_key?: string;
  client_email?: string;
  client_id?: string;
  auth_uri?: string;
  token_uri?: string;
  auth_provider_x509_cert_url?: string;
  client_x509_cert_url?: string;
}

export default class FirestoreAdapter<T extends BaseDocument = BaseDocument> {
  private firestore: admin.firestore.Firestore;
  private collection: admin.firestore.CollectionReference<T> | null = null;

  constructor(serviceAccountPath: string, collectionPath?: string) {
    let serviceAccount;

    if (!fs.existsSync(serviceAccountPath)) {
      throw new Error(
        `Service account path does not exist: ${serviceAccountPath}`
      );
    }

    try {
      const serviceAccountContent = fs.readFileSync(
        path.resolve(serviceAccountPath),
        'utf-8'
      );
      const serviceAccountJSON: ServiceAccountJSON = JSON.parse(
        serviceAccountContent
      );

      this.validateServiceAccount(serviceAccountJSON);

      // Map the JSON to admin.ServiceAccount type
      serviceAccount = {
        projectId: serviceAccountJSON.project_id!,
        clientEmail: serviceAccountJSON.client_email!,
        privateKey: serviceAccountJSON.private_key!.replace(/\\n/g, '\n'),
      };
    } catch (error) {
      this.handleInitializationError(error);
    }

    if (!serviceAccount) {
      throw new Error(
        'Failed to initialize Firestore: Service account is not properly defined.'
      );
    }

    if (!admin.apps.length) {
      try {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      } catch (error) {
        this.handleInitializationError(error);
      }
    }

    this.firestore = admin.firestore();

    if (collectionPath) {
      this.setCollection(collectionPath);
    }
  }

  private validateServiceAccount(serviceAccountJSON: ServiceAccountJSON): void {
    if (
      !serviceAccountJSON.project_id ||
      !serviceAccountJSON.client_email ||
      !serviceAccountJSON.private_key
    ) {
      throw new Error('Service account file is missing required fields');
    }
  }

  private handleInitializationError(error: unknown): void {
    throw new Error(
      `Firestore initialization failed: ${this.getErrorMessage(error)}`
    );
  }

  private async checkConnection(): Promise<void> {
    if (this.collection) {
      const testDocRef = this.collection.doc('__test__');
      try {
        await testDocRef.get();
      } catch (error) {
        throw new Error(
          `Firestore connection check failed: ${this.getErrorMessage(error)}`
        );
      }
    } else {
      throw new Error('Please set a collection first using setCollection');
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
    if (this.collection) {
      let id;
      let doc: admin.firestore.DocumentSnapshot<T>;

      do {
        id = this.generateRandomId(length);
        doc = await this.collection.doc(id).get();
      } while (doc.exists);

      return id;
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
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

  setCollection(collectionPath: string) {
    this.collection = this.firestore.collection(
      collectionPath
    ) as admin.firestore.CollectionReference<T>;

    this.checkConnection().catch(error => {
      throw new Error(
        `Failed to connect to Firestore: ${this.getErrorMessage(error)}`
      );
    });

    return this;
  }

  async addDocument(
    data: T,
    id?: string,
    override?: boolean
  ): Promise<{id: string; data: T}> {
    if (this.collection) {
      const docId = id || (await this.generateUniqueId(30));
      const docRef = this.collection.doc(docId);

      const result = await admin
        .firestore()
        .runTransaction(async transaction => {
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
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
  }

  async editDocument(
    docId: string,
    data: Partial<T>
  ): Promise<{id: string; data: T}> {
    if (this.collection) {
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

        return {
          id: updatedDocSnapshot.id,
          data: updatedDocSnapshot.data() as T,
        };
      });
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
  }

  async removeDocument(docId: string): Promise<void> {
    if (this.collection) {
      const docRef = this.collection.doc(docId);

      return admin.firestore().runTransaction(async transaction => {
        const docSnapshot = await transaction.get(docRef);

        if (!docSnapshot.exists) {
          throw new Error(`Document with ID ${docId} does not exist`);
        }

        transaction.delete(docRef);
      });
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
  }

  async batchAdd(
    documents: {id?: string; data: T; override?: boolean}[]
  ): Promise<void> {
    if (this.collection) {
      return admin.firestore().runTransaction(async transaction => {
        for (const {id, data, override} of documents) {
          const docId = id || (await this.generateUniqueId(30));
          const docRef = this.collection!.doc(docId);
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
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
  }

  async batchUpdate(updates: {id: string; data: Partial<T>}[]): Promise<void> {
    if (this.collection) {
      return admin.firestore().runTransaction(async transaction => {
        for (const {id, data} of updates) {
          const docRef = this.collection!.doc(id);
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
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
  }

  async batchDelete(docIds: string[]): Promise<void> {
    if (this.collection) {
      return admin.firestore().runTransaction(async transaction => {
        for (const id of docIds) {
          const docRef = this.collection!.doc(id);
          const docSnapshot = await transaction.get(docRef);

          if (!docSnapshot.exists) {
            throw new Error(`Document with ID ${id} does not exist`);
          }

          transaction.delete(docRef);
        }
      });
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
  }

  async getDocument(
    docId: string
  ): Promise<admin.firestore.DocumentSnapshot<T>> {
    if (this.collection) {
      return this.collection.doc(docId).get();
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
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
    if (this.collection) {
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
    } else {
      throw new Error('Please set a collection first using setCollection');
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
    if (this.collection) {
      let query: admin.firestore.Query<T> = this.collection;

      filters.forEach(filter => {
        query = query.where(
          filter.field as string,
          filter.operator,
          filter.value
        );
      });

      return this.getDocumentsData(query, limit, startAfterId);
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
  }

  subscribeDocument(
    docId: string,
    callback: (doc: {id: string; data: T}) => void
  ): () => void {
    if (this.collection) {
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
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
  }

  subscribeCollection(
    callback: (snapshot: admin.firestore.QuerySnapshot<T>) => void
  ): () => void {
    if (this.collection) {
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
    } else {
      throw new Error('Please set a collection first using setCollection');
    }
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
