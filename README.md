# ts-firestore-admin-helper

Typesafe Firestore Admin Helper

## Instalation

### Using NPM

```sh
npm install ts-firestore-admin-helper
```

### Using Yarn

```sh
yarn add ts-firestore-admin-helper
```

## Usage

```typescript
// Start: Your Firestore initialization script
import admin from 'firebase-admin';
import FirestoreHelper from 'ts-firestore-admin-helper';

const serviceAccount = require('./firebase-service-account.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestoreAdmin = admin.firestore();
// End: Your firestore initialization script

// Start: Define your collection interface
interface YourCollectionInterface {
    key1: string;
    key2: string;
}
// End: Define your collection interface

// Start: Define your Firestore Collection
const yourCollection = new FirestoreHelper<YourCollectionInterface>(
  firestoreAdmin,
  'yourCollection'
);
// End: Define your Firestore Collection

// Create a new document
yourCollection.addDocument({
    key1: 'value1',
    key2: 'value2',
});

// Edit a document
yourCollection.editDocument(
    'document_key',
    {
        key1: 'value2',
        key2: 'value1',
    }
);
```