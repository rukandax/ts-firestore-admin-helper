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

const serviceAccount = require('./firebase-service-account.json');

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const firestoreAdmin = admin.firestore();
// End: Your firestore initialization script

// Start: Define your Firestore Collection
const chatCollection = new FirestoreHelper<InterfaceChat>(
  firestoreAdmin,
  'chat'
);
// End: Define your Firestore Collection

// Create a new document
chatCollection.addDocument({
    key1: 'value1',
    key2: 'value2',
});

// Edit a document
chatCollection.editDocument(
    'document_key',
    {
        key1: 'value2',
        key2: 'value1',
    }
);
```