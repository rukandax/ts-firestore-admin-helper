# 🔥 ts-firestore-admin-helper# 🔥 Firebase Admin Firestore Helper



[![npm version](https://img.shields.io/npm/v/ts-firestore-admin-helper.svg)](https://www.npmjs.com/package/ts-firestore-admin-helper)[![npm version](https://img.shields.io/npm/v/ts-firestore-admin-helper.svg)](https://www.npmjs.com/package/ts-firestore-admin-helper)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue)](https://www.typescriptlang.org/)[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue)](https://www.typescriptlang.org/)



Type-safe Firebase Firestore helper for Node.js. CRUD operations, batch processing, real-time subscriptions, and transaction support made simple.Type-safe Firebase Firestore helper with CRUD operations, batch processing, real-time subscriptions, and transaction support. Simple to use, production-ready.



------



## 📋 Table of Contents## � Table of Contents



- [Installation](#-installation)- [Installation](#-installation)

- [Quick Start](#-quick-start)- [Quick Start](#-quick-start)

- [Basic Usage](#-basic-usage)- [Basic Usage](#-basic-usage)

- [API Reference](#-api-reference)  - [CRUD Operations](#crud-operations)

- [Advanced Examples](#-advanced-examples)  - [Batch Operations](#batch-operations)

- [Best Practices](#-best-practices)  - [Queries](#queries)

- [Troubleshooting](#-troubleshooting)  - [Real-time Subscriptions](#real-time-subscriptions)

  - [Transactions](#transactions)

---- [API Reference](#-api-reference)

- [Advanced Examples](#-advanced-examples)

## 📦 Installation- [Best Practices](#-best-practices)

- [Troubleshooting](#-troubleshooting)

```bash

npm install ts-firestore-admin-helper firebase-admin---

```

---

**Requirements:**

- Node.js >= 18.0.0## ✨ Features

- firebase-admin >= 12.2.0

- TypeScript >= 5.4.5 (for TypeScript projects)### 🔒 Security First

- ✅ **Cryptographically secure ID generation** using Node.js `crypto` module

---- ✅ **Comprehensive input validation** for all operations

- ✅ **Custom ID format validation** to prevent invalid Firestore IDs

## ⚡ Quick Start- ✅ **No SQL injection risks** - all queries are type-safe

- ✅ **Zero `any` types** - complete TypeScript type safety

### 1. Initialize Firebase Admin

### 🚀 Performance & Reliability

Get your service account key from [Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts- ✅ **Automatic batch size validation** (Firestore 500-document limit)

- ✅ **Race condition prevention** in batch operations

```typescript- ✅ **Transaction consistency** - all critical operations use Firestore transactions

import admin from 'firebase-admin';- ✅ **Memory leak prevention** in real-time subscriptions

import serviceAccount from './serviceAccountKey.json';- ✅ **Optimized query execution** with proper indexing hints



admin.initializeApp({### 📝 Developer Experience

  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),- ✅ **Full TypeScript support** with strict mode enabled

});- ✅ **IntelliSense support** for all methods and properties

- ✅ **Automatic timestamp management** (`createdAt`, `updatedAt`)

const db = admin.firestore();- ✅ **Comprehensive error messages** for easy debugging

```- ✅ **Null safety checks** throughout the codebase

- ✅ **Generic type constraints** for better type inference

### 2. Define Your Interface

### 🎯 Production Ready

```typescript- ✅ **Battle-tested** transaction handling

import { BaseDocument, FirestoreHelper } from 'ts-firestore-admin-helper';- ✅ **ES2020 target** for modern Node.js environments

- ✅ **Well-documented** API with examples

interface User extends BaseDocument {- ✅ **No breaking changes** in patch updates

  name: string;

  email: string;---

  age: number;

}## 📦 Installation

```

### Using NPM

### 3. Create Helper Instance

```bash

```typescriptnpm install ts-firestore-admin-helper firebase-admin

const users = new FirestoreHelper<User>(db, 'users');```



// Validate connection (optional but recommended)### Using Yarn

await users.validateConnection();

``````bash

yarn add ts-firestore-admin-helper firebase-admin

### 4. Use It!```



```typescript### Using pnpm

// Create

const newUser = await users.addDocument({```bash

  name: 'Alice',pnpm add ts-firestore-admin-helper firebase-admin

  email: 'alice@example.com',```

  age: 28,

});---



// Read## 🚀 Quick Start

const user = await users.getDocumentData(newUser.id);

console.log(user?.data.name); // "Alice"```typescript

import admin from 'firebase-admin';

// Updateimport FirestoreHelper from 'ts-firestore-admin-helper';

await users.editDocument(newUser.id, { age: 29 });

// 1. Initialize Firebase Admin

// Deleteconst serviceAccount = require('./serviceAccountKey.json');

await users.deleteDocument(newUser.id);

```admin.initializeApp({

  credential: admin.credential.cert(serviceAccount)

---});



## 🎯 Basic Usageconst db = admin.firestore();



### CRUD Operations// 2. Define your data interface

interface User {

#### Create Documents  name: string;

  email: string;

```typescript  role: 'admin' | 'user';

// Add with auto-generated ID  isActive: boolean;

const user = await users.addDocument({}

  name: 'Bob',

  email: 'bob@example.com',// 3. Create helper instance

  age: 35,const usersCollection = new FirestoreHelper<User>(db, 'users');

});

console.log(user.id); // Auto-generated secure ID// 4. Validate connection (recommended)

await usersCollection.validateConnection();

// Add with custom ID

await users.addDocument(// 5. Start using!

  {const newUser = await usersCollection.addDocument({

    name: 'Charlie',  name: 'John Doe',

    email: 'charlie@example.com',  email: 'john@example.com',

    age: 40,  role: 'user',

  },  isActive: true

  'custom-user-id'});

);

```console.log('User created:', newUser.id);

```

#### Read Documents

---

```typescript

// Get full document (includes metadata)## 🛠️ Setup Guide

const docResult = await users.getDocument('user-id');

if (docResult) {### Step 1: Get Firebase Service Account Key

  console.log(docResult.id);

  console.log(docResult.data.name);1. Go to [Firebase Console](https://console.firebase.google.com/)

  console.log(docResult.exists);2. Select your project

}3. Go to **Project Settings** > **Service Accounts**

4. Click **Generate New Private Key**

// Get only document data5. Save the JSON file securely (e.g., `serviceAccountKey.json`)

const userData = await users.getDocumentData('user-id');

if (userData) {⚠️ **IMPORTANT**: Never commit this file to version control!

  console.log(userData.data.name);

}Add to `.gitignore`:

```

// Get all documentsserviceAccountKey.json

const allUsers = await users.getAllDocuments();*-firebase-adminsdk-*.json

console.log(`Total users: ${allUsers.length}`);```

```

### Step 2: Initialize Firebase Admin SDK

#### Update Documents

```typescript

```typescriptimport admin from 'firebase-admin';

// Partial updateimport * as path from 'path';

await users.editDocument('user-id', {

  age: 36,// Option 1: Using service account file

});const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));



// Update with timestamp fieldsif (admin.apps.length === 0) {

await users.editDocument('user-id', {  admin.initializeApp({

  name: 'Updated Name',    credential: admin.credential.cert(serviceAccount),

  updatedAt: Date.now(), // Auto-managed by default    databaseURL: 'https://your-project.firebaseio.com' // Optional

});  });

```}



#### Delete Documents// Option 2: Using environment variables (recommended for production)

if (admin.apps.length === 0) {

```typescript  admin.initializeApp({

// Delete single document    credential: admin.credential.cert({

await users.deleteDocument('user-id');      projectId: process.env.FIREBASE_PROJECT_ID,

      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,

// Delete multiple documents      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),

await users.deleteDocuments(['id1', 'id2', 'id3']);    }),

```  });

}

---

const db = admin.firestore();

### Batch Operations```



Efficiently create, update, or delete multiple documents.### Step 3: Define Your Collection Interfaces



```typescript```typescript

// Batch create (auto-generated IDs)// types/collections.ts

const newUsers = await users.batchAddDocuments([

  { name: 'User 1', email: 'user1@example.com', age: 25 },export interface User {

  { name: 'User 2', email: 'user2@example.com', age: 30 },  name: string;

  { name: 'User 3', email: 'user3@example.com', age: 35 },  email: string;

]);  role: 'admin' | 'user' | 'moderator';

  isActive: boolean;

console.log(newUsers); // Array of IDs  metadata?: {

    lastLogin?: number;

// Batch create with custom IDs    loginCount?: number;

const customUsers = [  };

  { id: 'user-1', data: { name: 'Alice', email: 'alice@example.com', age: 28 } },}

  { id: 'user-2', data: { name: 'Bob', email: 'bob@example.com', age: 32 } },

];export interface Product {

  name: string;

await users.batchAddDocumentsWithIds(customUsers);  description: string;

  price: number;

// Batch update  stock: number;

await users.batchEditDocuments([  category: string;

  { id: 'user-1', data: { age: 29 } },  tags: string[];

  { id: 'user-2', data: { age: 33 } },  isAvailable: boolean;

]);}



// Batch deleteexport interface Order {

await users.deleteDocuments(['user-1', 'user-2', 'user-3']);  userId: string;

```  productIds: string[];

  totalAmount: number;

**Note:** Firestore has a 500-document limit per batch. This library automatically validates batch sizes.  status: 'pending' | 'processing' | 'completed' | 'cancelled';

  shippingAddress: {

---    street: string;

    city: string;

### Queries    zipCode: string;

  };

Type-safe querying with filters, sorting, and pagination.}

```

```typescript

// Simple filter### Step 4: Create Helper Instances

const adults = await users.findDocumentsData([

  { field: 'age', operator: '>=', value: 18 },```typescript

]);// services/collections.ts



// Multiple filtersimport FirestoreHelper from 'ts-firestore-admin-helper';

const activeAdults = await users.findDocumentsData([import { User, Product, Order } from './types/collections';

  { field: 'age', operator: '>=', value: 18 },import { db } from './firebase'; // Your Firebase initialization

  { field: 'isActive', operator: '==', value: true },

]);export const usersCollection = new FirestoreHelper<User>(db, 'users');

export const productsCollection = new FirestoreHelper<Product>(db, 'products');

// With sorting and limitexport const ordersCollection = new FirestoreHelper<Order>(db, 'orders');

const topUsers = await users.findDocumentsData(

  [{ field: 'age', operator: '>=', value: 18 }],// Validate connections on startup

  {export async function validateFirestoreConnections() {

    orderBy: 'age',  try {

    orderDirection: 'desc',    await Promise.all([

    limit: 10,      usersCollection.validateConnection(),

  }      productsCollection.validateConnection(),

);      ordersCollection.validateConnection(),

    ]);

// Pagination    console.log('✅ All Firestore connections validated');

const page1 = await users.findDocumentsData([], { limit: 20 });  } catch (error) {

    console.error('❌ Firestore connection failed:', error);

if (page1.length > 0) {    throw error;

  const lastDoc = page1[page1.length - 1];  }

  const page2 = await users.findDocumentsData([], {}

    limit: 20,```

    startAfter: lastDoc.data.createdAt, // Use createdAt for cursor

  });### Step 5: Use in Your Application

}

``````typescript

// index.ts or server.ts

**Supported operators:**

- `==` - Equal toimport { validateFirestoreConnections, usersCollection } from './services/collections';

- `!=` - Not equal to

- `<` - Less thanasync function main() {

- `<=` - Less than or equal to  // Validate connections on startup

- `>` - Greater than  await validateFirestoreConnections();

- `>=` - Greater than or equal to  

- `array-contains` - Array contains value  // Your application logic

- `array-contains-any` - Array contains any of the values  const users = await usersCollection.findDocumentsData([

- `in` - In array    { field: 'isActive', operator: '==', value: true }

- `not-in` - Not in array  ]);

  

---  console.log(`Found ${users.length} active users`);

}

### Real-time Subscriptions

main().catch(console.error);

Listen to document changes in real-time.```



```typescript---

// Subscribe to single document

const unsubscribeDoc = users.subscribeToDocument(## 💡 Usage Examples

  'user-id',

  (data) => {### Basic CRUD Operations

    if (data) {

      console.log('Document updated:', data.name);```typescript

    } else {// CREATE - Add a new document

      console.log('Document deleted');const user = await usersCollection.addDocument({

    }  name: 'Alice Smith',

  },  email: 'alice@example.com',

  (error) => {  role: 'user',

    console.error('Subscription error:', error);  isActive: true

  }});

);console.log('Created user:', user.id);



// Subscribe to query results// CREATE with custom ID

const unsubscribeQuery = users.subscribeToDocuments(const adminUser = await usersCollection.addDocument(

  [{ field: 'age', operator: '>=', value: 18 }],  {

  (documents) => {    name: 'Admin User',

    console.log(`Found ${documents.length} adults`);    email: 'admin@example.com',

    documents.forEach((doc) => {    role: 'admin',

      console.log(doc.data.name, doc.data.age);    isActive: true

    });  },

  },  'admin-001' // Custom ID

  (error) => {);

    console.error('Query subscription error:', error);

  },// CREATE with override (replace if exists)

  {const updatedUser = await usersCollection.addDocument(

    orderBy: 'age',  {

    orderDirection: 'desc',    name: 'Updated Admin',

  }    email: 'admin@example.com',

);    role: 'admin',

    isActive: true

// Clean up when done  },

unsubscribeDoc();  'admin-001',

unsubscribeQuery();  true // Override existing

```);



**Important:** Always unsubscribe to prevent memory leaks!// READ - Get single document

const userData = await usersCollection.getDocumentData('admin-001');

---if (userData) {

  console.log('User:', userData.data.name);

### Transactions}



ACID-compliant operations for critical updates.// UPDATE - Edit document

await usersCollection.editDocument('admin-001', {

#### Atomic Increment/Decrement  isActive: false,

  metadata: {

Thread-safe numeric updates (e.g., counters, balances).    lastLogin: Date.now()

  }

```typescript});

// Increment

const result = await users.atomicIncrement('user-id', 'age', 1);// DELETE - Remove document

console.log('New age:', result.data.age);await usersCollection.removeDocument('user-123');

```

// Decrement

await users.atomicIncrement('user-id', 'balance', -100);### Batch Operations



// Works with any numeric field```typescript

await users.atomicIncrement('post-id', 'likes', 1);// BATCH ADD - Create multiple documents

await users.atomicIncrement('post-id', 'views', 1);await usersCollection.batchAdd([

```  {

    data: {

#### Conditional Updates (Optimistic Locking)      name: 'User 1',

      email: 'user1@example.com',

Update only if a field has expected value. Prevents race conditions.      role: 'user',

      isActive: true

```typescript    }

// Update only if status is 'pending'  },

const result = await users.conditionalUpdate(  {

  'order-id',    id: 'custom-id-001',

  'status',    data: {

  'pending',      name: 'User 2',

  {      email: 'user2@example.com',

    status: 'processing',      role: 'user',

    processedAt: Date.now(),      isActive: true

  }    },

);    override: false

  }

if (result) {  // ... up to 500 documents

  console.log('Order claimed for processing');]);

} else {

  console.log('Order already being processed');// BATCH EDIT - Update multiple documents

}await usersCollection.batchEdit([

```  {

    id: 'user-001',

#### Custom Transactions    data: { isActive: false }

  },

Full control for complex multi-document updates.  {

    id: 'user-002',

```typescript    data: { role: 'moderator' }

// Transfer balance between users  }

const transfer = await users.runTransaction(async (transaction) => {]);

  const senderRef = users.doc('sender-id');

  const receiverRef = users.doc('receiver-id');// BATCH REMOVE - Delete multiple documents

await usersCollection.batchRemove(['user-001', 'user-002', 'user-003']);

  const senderDoc = await transaction.get(senderRef);```

  const receiverDoc = await transaction.get(receiverRef);

### Query Operations

  if (!senderDoc.exists || !receiverDoc.exists) {

    throw new Error('User not found');```typescript

  }// FIND - Query with single condition

const activeUsers = await usersCollection.findDocumentsData([

  const sender = senderDoc.data();  { field: 'isActive', operator: '==', value: true }

  const receiver = receiverDoc.data();]);



  if (!sender || !receiver) {// FIND - Query with multiple conditions

    throw new Error('Invalid data');const adminUsers = await usersCollection.findDocumentsData([

  }  { field: 'role', operator: '==', value: 'admin' },

  { field: 'isActive', operator: '==', value: true }

  const amount = 100;]);



  if (sender.balance < amount) {// FIND - Query with options (sorting, limiting, pagination)

    throw new Error('Insufficient balance');const recentUsers = await usersCollection.findDocumentsData(

  }  [{ field: 'isActive', operator: '==', value: true }],

  {

  // Atomic update of both documents    orderBy: 'createdAt',

  transaction.update(senderRef, {    orderDirection: 'desc',

    balance: sender.balance - amount,    limit: 10

    updatedAt: Date.now(),  }

  }););



  transaction.update(receiverRef, {// FIND - Pagination

    balance: receiver.balance + amount,const firstPage = await usersCollection.findDocumentsData(

    updatedAt: Date.now(),  [],

  });  {

    orderBy: 'createdAt',

  return { success: true, amount };    limit: 20

});  }

);

console.log('Transfer completed:', transfer.amount);

```const secondPage = await usersCollection.findDocumentsData(

  [],

---  {

    orderBy: 'createdAt',

## 📚 API Reference    limit: 20,

    startAfterId: firstPage[firstPage.length - 1].id // Last ID from first page

### Constructor  }

);

```typescript

new FirestoreHelper<T>(db: Firestore, collectionName: string)// FIND ONE - Get first matching document

```const firstAdmin = await usersCollection.findDocumentData([

  { field: 'role', operator: '==', value: 'admin' }

- `db`: Firebase Firestore instance]);

- `collectionName`: Name of the collection

- `T`: Document interface extending `BaseDocument`if (firstAdmin) {

  console.log('First admin:', firstAdmin.data.name);

### Methods}

```

#### Document Operations

### Real-time Subscriptions

| Method | Description | Returns |

|--------|-------------|---------|```typescript

| `addDocument(data, customId?)` | Create document | `Promise<{ id: string }>` |// SUBSCRIBE to a single document

| `getDocument(id)` | Get document with metadata | `Promise<DocumentResult<T> \| null>` |const unsubscribeUser = usersCollection.subscribeDocument(

| `getDocumentData(id)` | Get document data only | `Promise<DocumentDataResult<T> \| null>` |  'user-001',

| `getAllDocuments()` | Get all documents | `Promise<DocumentResult<T>[]>` |  (doc) => {

| `editDocument(id, data)` | Update document | `Promise<void>` |    console.log('User updated:', doc.data);

| `deleteDocument(id)` | Delete document | `Promise<void>` |    console.log('Updated at:', doc.data.updatedAt);

  }

#### Batch Operations);



| Method | Description | Returns |// Later: unsubscribe

|--------|-------------|---------|// unsubscribeUser();

| `batchAddDocuments(documents)` | Batch create (auto IDs) | `Promise<string[]>` |

| `batchAddDocumentsWithIds(documents)` | Batch create (custom IDs) | `Promise<void>` |// SUBSCRIBE to entire collection

| `batchEditDocuments(updates)` | Batch update | `Promise<void>` |const unsubscribeCollection = usersCollection.subscribeCollection(

| `deleteDocuments(ids)` | Batch delete | `Promise<void>` |  (snapshot) => {

    console.log(`Total users: ${snapshot.size}`);

#### Query Operations    snapshot.forEach(doc => {

      console.log('User:', doc.id, doc.data());

| Method | Description | Returns |    });

|--------|-------------|---------|  }

| `findDocuments(filters, options?)` | Query with metadata | `Promise<DocumentResult<T>[]>` |);

| `findDocumentsData(filters, options?)` | Query data only | `Promise<DocumentDataResult<T>[]>` |

// SUBSCRIBE to query results

**Query Options:**const unsubscribeQuery = usersCollection.subscribeQuery(

```typescript  [

{    { field: 'role', operator: '==', value: 'admin' },

  orderBy?: keyof T;    { field: 'isActive', operator: '==', value: true }

  orderDirection?: 'asc' | 'desc';  ],

  limit?: number;  (snapshot) => {

  startAfter?: any;    console.log(`Active admins: ${snapshot.size}`);

}    snapshot.docs.forEach(doc => {

```      console.log('Admin:', doc.data().name);

    });

#### Subscription Operations  }

);

| Method | Description | Returns |

|--------|-------------|---------|// Cleanup on app shutdown

| `subscribeToDocument(id, callback, errorCallback)` | Real-time document | `Unsubscribe` |process.on('SIGINT', () => {

| `subscribeToDocuments(filters, callback, errorCallback, options?)` | Real-time query | `Unsubscribe` |  unsubscribeUser();

  unsubscribeCollection();

#### Transaction Operations  unsubscribeQuery();

  process.exit(0);

| Method | Description | Returns |});

|--------|-------------|---------|```

| `runTransaction<R>(callback)` | Custom transaction | `Promise<R>` |

| `doc(id)` | Get document reference | `DocumentReference` |### Advanced Query Examples

| `atomicIncrement(id, field, value)` | Atomic +/- operation | `Promise<DocumentDataResult<T>>` |

| `conditionalUpdate(id, field, expected, newData)` | Optimistic locking | `Promise<DocumentDataResult<T> \| null>` |```typescript

// Array contains query

#### Utility Methodsconst taggedProducts = await productsCollection.findDocumentsData([

  { field: 'tags', operator: 'array-contains', value: 'featured' }

| Method | Description | Returns |]);

|--------|-------------|---------|

| `validateConnection()` | Test Firestore connection | `Promise<boolean>` |// In query (multiple values)

const specificRoles = await usersCollection.findDocumentsData([

---  { field: 'role', operator: 'in', value: ['admin', 'moderator'] }

]);

## 🎓 Advanced Examples

// Range query

For production-ready examples including:const affordableProducts = await productsCollection.findDocumentsData([

- 🛒 E-commerce inventory management  { field: 'price', operator: '>=', value: 10 },

- 💰 Financial transactions with ACID guarantees  { field: 'price', operator: '<=', value: 100 }

- 🎫 Event booking with capacity management]);

- 📝 Collaborative editing with conflict resolution

- 🎮 Gaming leaderboards and loyalty points// Not equal query (Firestore 9.9+)

- 📱 Social media engagement countersconst nonPendingOrders = await ordersCollection.findDocumentsData([

  { field: 'status', operator: '!=', value: 'pending' }

**See:** [EXAMPLES.md](./EXAMPLES.md)]);

```

---

---

## 💡 Best Practices

## 📚 API Reference

### 1. Always Extend BaseDocument

### Constructor

```typescript

// ✅ Good```typescript

interface User extends BaseDocument {new FirestoreHelper<T extends BaseDocument>(

  name: string;  firestoreInstance: admin.firestore.Firestore,

}  collectionPath: string

)

// ❌ Bad```

interface User {

  name: string;**Parameters:**

}- `firestoreInstance`: Initialized Firestore instance from Firebase Admin SDK

```- `collectionPath`: Path to the collection (e.g., `'users'`, `'products/prod-1/reviews'`)



### 2. Validate Connection on Startup**Returns:** `FirestoreHelper<T>` instance



```typescript---

const users = new FirestoreHelper<User>(db, 'users');

await users.validateConnection(); // Catch config issues early### Methods

```

#### `validateConnection(): Promise<void>`

### 3. Use Transactions for Critical Operations

Validates the Firestore connection by performing a test read operation.

```typescript

// ✅ Good: Atomic balance transfer**Recommended**: Call this method after initialization to ensure connectivity.

await users.runTransaction(async (tx) => {

  // Read both, validate, update both```typescript

});await usersCollection.validateConnection();

```

// ❌ Bad: Race condition risk

const sender = await users.getDocumentData('sender-id');**Throws:** Error if connection fails

await users.editDocument('sender-id', { balance: sender.balance - 100 });

await users.editDocument('receiver-id', { balance: receiver.balance + 100 });---

```

#### `addDocument(data, id?, override?): Promise<{id: string; data: T}>`

### 4. Always Unsubscribe from Real-time Listeners

Creates a new document in the collection.

```typescript

const unsubscribe = users.subscribeToDocument('id', callback);**Parameters:**

- `data: T` - Document data (required)

// When done (e.g., component unmount)- `id?: string` - Custom document ID (optional, auto-generated if not provided)

unsubscribe();- `override?: boolean` - Replace existing document if ID exists (default: `false`)

```

**Returns:** Object with `id` and complete `data` (including timestamps)

### 5. Handle Errors Gracefully

**Features:**

```typescript- Auto-generates secure 30-character ID if not provided

try {- Validates document data is not empty

  await users.addDocument({ name: 'Alice', email: 'alice@example.com', age: 28 });- Validates custom ID format

} catch (error) {- Automatically adds `createdAt` and `updatedAt` timestamps

  if (error instanceof Error) {- Uses Firestore transaction for consistency

    console.error('Failed to create user:', error.message);

  }**Example:**

}```typescript

```const doc = await collection.addDocument(

  { name: 'John' },

### 6. Use Batch Operations for Multiple Documents  'custom-id',

  false

```typescript);

// ✅ Good: Single batch write```

await users.batchAddDocuments([user1, user2, user3]);

---

// ❌ Bad: Multiple individual writes

await users.addDocument(user1);#### `editDocument(docId, data): Promise<{id: string; data: T}>`

await users.addDocument(user2);

await users.addDocument(user3);Updates an existing document.

```

**Parameters:**

### 7. Validate Before Expensive Operations- `docId: string` - Document ID to update

- `data: Partial<T>` - Fields to update

```typescript

// ✅ Good: Validate first**Returns:** Object with `id` and complete updated `data`

if (!email.includes('@')) {

  throw new Error('Invalid email');**Features:**

}- Validates document exists

await users.addDocument({ name, email, age });- Prevents updating document ID

- Automatically updates `updatedAt` timestamp

// ❌ Bad: Validate inside transaction- Uses transaction for consistency

```- Merges with existing data



---**Example:**

```typescript

## 🐛 Troubleshootingconst updated = await collection.editDocument('doc-id', {

  name: 'Jane'

### Connection Issues});

```

**Problem:** `Firestore connection failed`

---

**Solutions:**

1. Verify service account key is valid#### `removeDocument(docId): Promise<void>`

2. Check Firebase project ID matches

3. Ensure network connectivityDeletes a document from the collection.

4. Verify IAM permissions in Google Cloud Console

**Parameters:**

```typescript- `docId: string` - Document ID to delete

// Test connection

const isConnected = await users.validateConnection();**Features:**

if (!isConnected) {- Validates document exists before deletion

  console.error('Firestore connection failed');- Uses transaction for consistency

}

```**Example:**

```typescript

---await collection.removeDocument('doc-id');

```

### Permission Denied

---

**Problem:** `Missing or insufficient permissions`

#### `batchAdd(documents): Promise<void>`

**Solutions:**

1. Service account needs Firestore permissions:Adds multiple documents in a single transaction.

   - `Cloud Datastore User` role minimum

   - Or custom role with `datastore.*` permissions**Parameters:**

2. Check Security Rules (for client SDKs, not Admin SDK)- `documents: Array<{id?: string; data: T; override?: boolean}>` - Array of documents to add

3. Verify project ID in service account key

**Limits:**

---- Maximum 500 documents per batch (Firestore limit)

- Validates all documents before starting transaction

### Batch Size Exceeded

**Features:**

**Problem:** `Batch size exceeds Firestore limit`- Generates all IDs before transaction (prevents race conditions)

- Validates all document data upfront

**Solutions:**- Atomic operation (all or nothing)

```typescript

// ✅ Good: Chunk large batches**Example:**

const allDocs = [...]; // 1000 documents```typescript

const chunks = chunkArray(allDocs, 500); // Split into chunks of 500await collection.batchAdd([

  { data: { name: 'User 1' } },

for (const chunk of chunks) {  { id: 'custom', data: { name: 'User 2' }, override: true }

  await users.batchAddDocuments(chunk);]);

}```



function chunkArray<T>(array: T[], size: number): T[][] {---

  return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>

    array.slice(i * size, i * size + size)#### `batchEdit(updates): Promise<void>`

  );

}Updates multiple documents in a single transaction.

```

**Parameters:**

---- `updates: Array<{id: string; data: Partial<T>}>` - Array of updates



### Transaction Conflicts**Limits:** Maximum 500 documents per batch



**Problem:** Transaction fails with `ABORTED` or `FAILED_PRECONDITION`**Example:**

```typescript

**Solutions:**await collection.batchEdit([

1. **Reduce contention**: Avoid updating hot documents simultaneously  { id: 'doc1', data: { name: 'Updated 1' } },

2. **Retry with exponential backoff**:  { id: 'doc2', data: { name: 'Updated 2' } }

```typescript]);

async function retryTransaction<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {```

  for (let i = 0; i < maxRetries; i++) {

    try {---

      return await fn();

    } catch (error) {#### `batchRemove(docIds): Promise<void>`

      if (i === maxRetries - 1) throw error;

      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));Deletes multiple documents in a single transaction.

    }

  }**Parameters:**

  throw new Error('Max retries exceeded');- `docIds: string[]` - Array of document IDs to delete

}

**Limits:** Maximum 500 documents per batch

const result = await retryTransaction(() =>

  users.atomicIncrement('user-id', 'balance', 100)**Example:**

);```typescript

```await collection.batchRemove(['doc1', 'doc2', 'doc3']);

3. **Use smaller transactions**: Break up large operations```

4. **Design for concurrency**: Use atomic operations instead of read-modify-write

---

---

#### `getDocument(docId): Promise<DocumentSnapshot<T>>`

### TypeScript Errors

Gets a document snapshot.

**Problem:** Type errors with document data

**Returns:** Firestore DocumentSnapshot

**Solutions:**

```typescript**Example:**

// ✅ Good: Proper interface definition```typescript

interface User extends BaseDocument {const snapshot = await collection.getDocument('doc-id');

  name: string;if (snapshot.exists) {

  email: string;  console.log(snapshot.data());

  age: number;}

}```



const users = new FirestoreHelper<User>(db, 'users');---



// ✅ TypeScript knows all fields#### `getDocumentData(docId): Promise<{id: string; data: T} | null>`

const user = await users.getDocumentData('id');

console.log(user?.data.name); // ✅ Type-safeGets document data with null safety.



// ❌ Bad: Missing BaseDocument extension**Returns:** Document object or `null` if not found

interface User {

  name: string;**Example:**

}```typescript

// Error: Type 'User' does not satisfy constraint 'BaseDocument'const doc = await collection.getDocumentData('doc-id');

```if (doc) {

  console.log(doc.data.name);

---}

```

### Memory Leaks with Subscriptions

---

**Problem:** Application memory grows over time

#### `findDocuments(query, options?): Promise<QuerySnapshot<T>>`

**Solutions:**

```typescriptFinds documents matching query criteria.

// ✅ Good: Always unsubscribe

class UserComponent {**Parameters:**

  private unsubscribe?: () => void;- `query: QueryPayload<T>[]` - Array of query conditions

- `options?: QueryOptions<T>` - Sorting, limiting, pagination

  async mount() {

    this.unsubscribe = users.subscribeToDocument('id', (data) => {**QueryPayload:**

      this.updateUI(data);```typescript

    });{

  }  field: keyof T;

  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in';

  async unmount() {  value: any;

    this.unsubscribe?.(); // Clean up}

  }```

}

**QueryOptions:**

// ❌ Bad: Never unsubscribe```typescript

users.subscribeToDocument('id', (data) => {{

  // Memory leak!  orderBy?: keyof T;

});  orderDirection?: 'asc' | 'desc';

```  limit?: number;

  startAfterId?: string; // For pagination

---}

```

## 📖 More Resources

**Returns:** Firestore QuerySnapshot

- **[Advanced Examples](./EXAMPLES.md)** - Production-ready use cases

- **[Changelog](./CHANGELOG.md)** - Version history**Example:**

- **[Code Review Summary](./CODE_REVIEW_SUMMARY.md)** - Security audit results```typescript

- **[Firebase Firestore Docs](https://firebase.google.com/docs/firestore)** - Official documentationconst snapshot = await collection.findDocuments(

- **[TypeScript Handbook](https://www.typescriptlang.org/docs/)** - TypeScript guide  [{ field: 'isActive', operator: '==', value: true }],

  { orderBy: 'createdAt', limit: 10 }

---);

```

## 🤝 Contributing

---

Contributions welcome! Please:

#### `findDocument(query): Promise<QueryDocumentSnapshot<T> | null>`

1. Fork the repository

2. Create a feature branch: `git checkout -b feature/my-feature`Finds first document matching query.

3. Commit changes: `git commit -m 'Add my feature'`

4. Push to branch: `git push origin feature/my-feature`**Returns:** First matching document or `null`

5. Open a Pull Request

---

---

#### `findDocumentsData(query, options?): Promise<Array<{id: string; data: T}>>`

## 📄 License

Finds documents and returns data array.

MIT © [Rukanda Faridsi](https://github.com/rukandax)

**Returns:** Array of document objects

---

**Example:**

## 🙋 Support```typescript

const users = await collection.findDocumentsData([

- **Issues:** [GitHub Issues](https://github.com/rukandax/ts-firestore-admin-helper/issues)  { field: 'role', operator: '==', value: 'admin' }

- **Email:** rukanda.agen@gmail.com]);

- **Docs:** [Full Documentation](https://github.com/rukandax/ts-firestore-admin-helper)```



------



**Made with ❤️ for the Firebase community**#### `findDocumentData(query): Promise<{id: string; data: T} | null>`


Finds first document and returns data.

---

#### `subscribeDocument(docId, callback): () => void`

Subscribes to real-time updates for a document.

**Parameters:**
- `docId: string` - Document ID to subscribe to
- `callback: (doc: {id: string; data: T}) => void` - Called on updates

**Returns:** Unsubscribe function

**Features:**
- Automatic cleanup on errors (prevents memory leaks)
- Error logging

**Example:**
```typescript
const unsubscribe = collection.subscribeDocument('doc-id', (doc) => {
  console.log('Updated:', doc.data);
});

// Later: unsubscribe()
```

---

#### `subscribeCollection(callback): () => void`

Subscribes to real-time updates for entire collection.

**Parameters:**
- `callback: (snapshot: QuerySnapshot<T>) => void` - Called on updates

**Returns:** Unsubscribe function

---

#### `subscribeQuery(query, callback): () => void`

Subscribes to real-time updates for query results.

**Parameters:**
- `query: QueryPayload<T>[]` - Query conditions
- `callback: (snapshot: QuerySnapshot<T>) => void` - Called on updates

**Returns:** Unsubscribe function

---

#### `runTransaction<R>(callback): Promise<R>`

Executes a custom transaction with full control over transaction logic.

**Parameters:**
- `callback: (transaction: Transaction) => Promise<R>` - Transaction callback function

**Returns:** Result from the transaction callback

**Use Cases:**
- Balance transfers between accounts
- Inventory reservation systems
- Multi-document atomic updates
- Complex business logic requiring consistency

**Features:**
- Full Firestore transaction API access
- Automatic retry on conflicts
- Read-modify-write consistency
- Isolation from concurrent operations

**Example:**
```typescript
const result = await collection.runTransaction(async (transaction) => {
  const doc1Ref = collection.doc('doc1');
  const doc2Ref = collection.doc('doc2');
  
  const doc1 = await transaction.get(doc1Ref);
  const doc2 = await transaction.get(doc2Ref);
  
  // Business logic...
  
  transaction.update(doc1Ref, { /* ... */ });
  transaction.update(doc2Ref, { /* ... */ });
  
  return { success: true };
});
```

---

#### `doc(docId): DocumentReference<T>`

Gets a document reference for use in custom transactions.

**Parameters:**
- `docId: string` - Document ID

**Returns:** Firestore DocumentReference

**Example:**
```typescript
const docRef = collection.doc('my-doc-id');
// Use in transaction.get(), transaction.update(), etc.
```

---

#### `atomicIncrement(docId, field, value): Promise<{id: string; data: T}>`

Performs atomic increment/decrement on a numeric field.

**Parameters:**
- `docId: string` - Document ID
- `field: keyof T` - Field name (must be a number)
- `value: number` - Amount to add (positive) or subtract (negative)

**Returns:** Updated document with new value

**Use Cases:**
- View counters
- Stock/inventory updates
- Balance additions/deductions
- Like/vote counters
- Quota tracking

**Features:**
- Thread-safe (no race conditions)
- Validates field is numeric
- Automatic `updatedAt` timestamp
- Returns updated data

**Examples:**
```typescript
// Increment counter
await collection.atomicIncrement('post-1', 'views', 1);

// Decrement stock
await collection.atomicIncrement('product-1', 'stock', -5);

// Add to balance
const result = await collection.atomicIncrement('wallet-1', 'balance', 100);
console.log('New balance:', result.data.balance);
```

---

#### `conditionalUpdate(docId, field, expectedValue, newData): Promise<{id: string; data: T} | null>`

Updates document only if a field matches expected value (optimistic locking).

**Parameters:**
- `docId: string` - Document ID
- `field: keyof T` - Field to check
- `expectedValue: T[keyof T]` - Expected current value
- `newData: Partial<T>` - Data to update if condition matches

**Returns:** Updated document or `null` if condition not met

**Use Cases:**
- Prevent double-processing
- State machine transitions
- Optimistic locking
- Version control
- Workflow management

**Features:**
- Atomic check-and-update
- No race conditions
- Returns null if condition fails
- Automatic `updatedAt` timestamp

**Examples:**
```typescript
// Update only if status is 'pending'
const result = await collection.conditionalUpdate(
  'order-1',
  'status',
  'pending',
  { status: 'processing' }
);

if (result) {
  console.log('Order updated');
} else {
  console.log('Order already processed');
}

// Version-based updates
const doc = await collection.getDocumentData('doc-1');
const updated = await collection.conditionalUpdate(
  'doc-1',
  'version',
  doc.data.version,
  { content: 'new content', version: doc.data.version + 1 }
);

if (!updated) {
  throw new Error('Document was modified by another user');
}
```

---

## 🎯 Advanced Features

### Custom Transactions

For complex operations that require full control over transaction logic, use the custom transaction methods:

#### runTransaction - Full Transaction Control

Perfect for complex business logic like balance transfers, inventory management, or multi-document updates:

```typescript
interface Wallet {
  userId: string;
  balance: number;
  currency: string;
}

const walletsCollection = new FirestoreHelper<Wallet>(db, 'wallets');

// Transfer money between wallets with lock mechanism
const result = await walletsCollection.runTransaction(async (transaction) => {
  const senderRef = walletsCollection.doc('wallet-sender');
  const receiverRef = walletsCollection.doc('wallet-receiver');

  // Read both documents
  const senderDoc = await transaction.get(senderRef);
  const receiverDoc = await transaction.get(receiverRef);

  if (!senderDoc.exists || !receiverDoc.exists) {
    throw new Error('Wallet not found');
  }

  const senderData = senderDoc.data();
  const receiverData = receiverDoc.data();

  if (!senderData || !receiverData) {
    throw new Error('Invalid wallet data');
  }

  const transferAmount = 100;

  // Validate business logic
  if (senderData.balance < transferAmount) {
    throw new Error('Insufficient balance');
  }

  if (senderData.currency !== receiverData.currency) {
    throw new Error('Currency mismatch');
  }

  // Perform atomic updates
  transaction.update(senderRef, {
    balance: senderData.balance - transferAmount,
    updatedAt: Date.now()
  });

  transaction.update(receiverRef, {
    balance: receiverData.balance + transferAmount,
    updatedAt: Date.now()
  });

  return {
    success: true,
    amount: transferAmount,
    newSenderBalance: senderData.balance - transferAmount,
    newReceiverBalance: receiverData.balance + transferAmount
  };
});

console.log('Transfer result:', result);
```

#### atomicIncrement - Safe Counter/Balance Updates

Safely increment or decrement numeric fields without race conditions:

```typescript
// Increment product view count
await productsCollection.atomicIncrement('product-123', 'viewCount', 1);

// Decrement inventory stock (purchase)
await productsCollection.atomicIncrement('product-456', 'stock', -5);

// Add funds to user balance
const updated = await walletsCollection.atomicIncrement('wallet-789', 'balance', 100);
console.log('New balance:', updated.data.balance);

// Deduct from balance (payment)
try {
  await walletsCollection.atomicIncrement('wallet-789', 'balance', -50);
} catch (error) {
  console.error('Payment failed:', error);
}
```

#### conditionalUpdate - Optimistic Locking

Update documents only if they're in an expected state:

```typescript
interface Order {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  amount: number;
  processedAt?: number;
}

const ordersCollection = new FirestoreHelper<Order>(db, 'orders');

// Update order only if it's still pending
const result = await ordersCollection.conditionalUpdate(
  'order-123',
  'status',
  'pending',
  {
    status: 'processing',
    processedAt: Date.now()
  }
);

if (result) {
  console.log('Order processing started');
} else {
  console.log('Order is no longer pending - already processed by another worker');
}

// Prevent double-processing with state checks
const processOrder = async (orderId: string) => {
  const result = await ordersCollection.conditionalUpdate(
    orderId,
    'status',
    'pending',
    {
      status: 'processing',
      processedAt: Date.now()
    }
  );

  if (!result) {
    throw new Error('Order cannot be processed - invalid state');
  }

  // Process order...
  
  // Mark as completed
  await ordersCollection.editDocument(orderId, {
    status: 'completed'
  });
};
```

#### Real-world Use Cases

**1. E-commerce Inventory Management:**
```typescript
// Reserve inventory atomically
await productsCollection.runTransaction(async (transaction) => {
  const productRef = productsCollection.doc('product-123');
  const productDoc = await transaction.get(productRef);
  
  if (!productDoc.exists) {
    throw new Error('Product not found');
  }

  const product = productDoc.data();
  const requestedQty = 5;

  if (!product || product.stock < requestedQty) {
    throw new Error('Insufficient stock');
  }

  transaction.update(productRef, {
    stock: product.stock - requestedQty,
    reservedStock: (product.reservedStock || 0) + requestedQty,
    updatedAt: Date.now()
  });

  return { reserved: requestedQty };
});
```

**2. Booking System with Capacity:**
```typescript
interface Event {
  name: string;
  capacity: number;
  bookedSeats: number;
  availableSeats: number;
}

const eventsCollection = new FirestoreHelper<Event>(db, 'events');

// Book seats with concurrency safety
const bookSeats = async (eventId: string, seatsRequested: number) => {
  return await eventsCollection.runTransaction(async (transaction) => {
    const eventRef = eventsCollection.doc(eventId);
    const eventDoc = await transaction.get(eventRef);

    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }

    const event = eventDoc.data();

    if (!event || event.availableSeats < seatsRequested) {
      throw new Error('Not enough seats available');
    }

    transaction.update(eventRef, {
      bookedSeats: event.bookedSeats + seatsRequested,
      availableSeats: event.availableSeats - seatsRequested,
      updatedAt: Date.now()
    });

    return {
      success: true,
      bookedSeats: seatsRequested,
      remainingSeats: event.availableSeats - seatsRequested
    };
  });
};
```

**3. Multi-User Collaborative Editing:**
```typescript
// Prevent concurrent edits with version checking
interface Document {
  content: string;
  version: number;
  lastEditedBy: string;
}

const docsCollection = new FirestoreHelper<Document>(db, 'documents');

const updateDocument = async (docId: string, newContent: string, expectedVersion: number, userId: string) => {
  const result = await docsCollection.conditionalUpdate(
    docId,
    'version',
    expectedVersion,
    {
      content: newContent,
      version: expectedVersion + 1,
      lastEditedBy: userId
    }
  );

  if (!result) {
    throw new Error('Document was modified by another user. Please refresh and try again.');
  }

  return result;
};
```

**4. Loyalty Points System:**
```typescript
interface UserPoints {
  userId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

const pointsCollection = new FirestoreHelper<UserPoints>(db, 'userPoints');

// Award points and auto-upgrade tier
const awardPoints = async (userId: string, pointsToAdd: number) => {
  return await pointsCollection.runTransaction(async (transaction) => {
    const userRef = pointsCollection.doc(userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new Error('Invalid user data');
    }

    const newPoints = userData.points + pointsToAdd;
    let newTier = userData.tier;

    // Auto-upgrade tier based on points
    if (newPoints >= 10000) newTier = 'platinum';
    else if (newPoints >= 5000) newTier = 'gold';
    else if (newPoints >= 1000) newTier = 'silver';
    else newTier = 'bronze';

    transaction.update(userRef, {
      points: newPoints,
      tier: newTier,
      updatedAt: Date.now()
    });

    return { newPoints, newTier, upgraded: newTier !== userData.tier };
  });
};
```

### Custom ID Generation

```typescript
// Auto-generated (cryptographically secure)
const doc1 = await collection.addDocument({ name: 'Auto ID' });
// ID: "a3k8x9m2n5p7q1r4s6t8v0w2y4z6a8b3"

// Custom ID
const doc2 = await collection.addDocument(
  { name: 'Custom ID' },
  'my-custom-id-123'
);

// UUID-style custom ID
import { v4 as uuidv4 } from 'uuid';
const doc3 = await collection.addDocument(
  { name: 'UUID ID' },
  uuidv4()
);
```

### Timestamp Management

All documents automatically get:
- `createdAt`: Set once when document is created
- `updatedAt`: Updated on every modification

```typescript
const doc = await collection.getDocumentData('doc-id');
console.log('Created:', new Date(doc.data.createdAt));
console.log('Updated:', new Date(doc.data.updatedAt));
```

### Transaction Consistency

All write operations use Firestore transactions:

```typescript
// Single operation - uses transaction
await collection.editDocument('doc-id', { name: 'New Name' });

// Batch operation - single transaction for all
await collection.batchEdit([
  { id: 'doc1', data: { status: 'active' } },
  { id: 'doc2', data: { status: 'inactive' } }
]);
```

### Error Handling Best Practices

```typescript
try {
  await collection.addDocument(data, customId);
} catch (error) {
  if (error.message.includes('already exists')) {
    console.log('Document exists, try with override');
    await collection.addDocument(data, customId, true);
  } else if (error.message.includes('Batch size exceeds')) {
    console.log('Too many documents, split into smaller batches');
  } else if (error.message.includes('index is required')) {
    console.log('Create Firestore index:', error.message);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

---

## 🏆 Best Practices

### 1. Connection Validation

Always validate connection on application startup:

```typescript
async function initializeApp() {
  try {
    await usersCollection.validateConnection();
    await productsCollection.validateConnection();
    console.log('✅ Firestore connected');
  } catch (error) {
    console.error('❌ Firestore connection failed');
    process.exit(1);
  }
}
```

### 2. Error Handling

Wrap operations in try-catch blocks:

```typescript
try {
  const doc = await collection.addDocument(data);
  console.log('Success:', doc.id);
} catch (error) {
  console.error('Failed:', error.message);
  // Handle error appropriately
}
```

### 3. Batch Operations

Use batch operations for multiple documents:

```typescript
// ❌ Bad: Multiple individual writes
for (const user of users) {
  await collection.addDocument(user); // Slow!
}

// ✅ Good: Single batch write
await collection.batchAdd(
  users.map(user => ({ data: user }))
);
```

### 4. Pagination

Implement cursor-based pagination:

```typescript
async function getUsersPage(lastId?: string, pageSize = 20) {
  return await collection.findDocumentsData(
    [],
    {
      orderBy: 'createdAt',
      limit: pageSize,
      startAfterId: lastId
    }
  );
}
```

### 5. Subscription Cleanup

Always unsubscribe when component/service is destroyed:

```typescript
class UserService {
  private unsubscribe?: () => void;

  startListening() {
    this.unsubscribe = collection.subscribeCollection((snapshot) => {
      // Handle updates
    });
  }

  destroy() {
    this.unsubscribe?.();
  }
}
```

### 6. Type Safety

Leverage TypeScript for compile-time safety:

```typescript
interface User {
  name: string;
  email: string;
  age: number;
}

const users = new FirestoreHelper<User>(db, 'users');

// ✅ Type-safe
await users.findDocumentsData([
  { field: 'age', operator: '>=', value: 18 }
]);

// ❌ TypeScript error: 'invalid' is not in User
await users.findDocumentsData([
  { field: 'invalid', operator: '==', value: true }
]);
```

---

## ⚠️ Important Notes

### Firestore ID Rules

**Auto-generated IDs:**
- 30 characters
- Alphanumeric lowercase (a-z, 0-9)
- Cryptographically secure
- Example: `a3k8x9m2n5p7q1r4s6t8v0w2y4z6a8b3`

**Custom IDs must follow:**
- ✅ Not empty
- ✅ Maximum 1500 characters
- ❌ Cannot start and end with `__`
- ❌ Cannot contain forward slashes `/`
- ❌ Cannot be `.` or `..`

```typescript
// ✅ Valid custom IDs
'user-123'
'PRODUCT_ABC_001'
'order_2024-01-15'

// ❌ Invalid custom IDs
''              // Empty
'__special__'   // Starts and ends with __
'path/to/doc'   // Contains /
'..'            // Reserved
```

### Batch Size Limits

Firestore has a hard limit of **500 writes per transaction**:

```typescript
// ✅ OK: 500 or fewer documents
await collection.batchAdd(arrayOf500);

// ❌ Error: More than 500 documents
await collection.batchAdd(arrayOf600); // Throws error!

// ✅ Solution: Split into chunks
const chunks = chunkArray(arrayOf600, 500);
for (const chunk of chunks) {
  await collection.batchAdd(chunk);
}
```

### Timestamps

Timestamps are Unix timestamps in **milliseconds** (not seconds):

```typescript
const doc = await collection.getDocumentData('doc-id');

// Convert to Date object
const created = new Date(doc.data.createdAt);
const updated = new Date(doc.data.updatedAt);

// Format for display
console.log(created.toISOString());
console.log(created.toLocaleString());
```

### Firestore Indexes

Some queries require composite indexes:

```typescript
// This query needs an index
await collection.findDocumentsData(
  [
    { field: 'category', operator: '==', value: 'electronics' },
    { field: 'price', operator: '>=', value: 100 }
  ],
  {
    orderBy: 'price',
    orderDirection: 'desc'
  }
);
```

**Error message will include a link to create the index:**
```
Firestore index is required for this query. 
Please create the necessary index.
https://console.firebase.google.com/project/.../indexes?create_composite=...
```

Click the link to auto-create the index in Firebase Console.

### Security Rules

This library uses Firebase **Admin SDK**, which bypasses security rules. 

**For client-side applications**, use the regular Firebase SDK with proper security rules.

**Admin SDK use cases:**
- ✅ Backend servers
- ✅ Cloud Functions
- ✅ Admin dashboards
- ✅ Background jobs
- ❌ Client-side web apps
- ❌ Mobile apps (direct usage)

### Performance Considerations

**Read Operations:**
- Each `getDocument` = 1 read
- Each document in `findDocuments` = 1 read
- Real-time listeners = 1 read per document per update

**Write Operations:**
- Each `addDocument` = 1 write
- Each `editDocument` = 1 write
- Batch operations = 1 write per document

**Costs:** [Firestore Pricing](https://firebase.google.com/pricing)

### Memory Management

Subscriptions can cause memory leaks if not properly cleaned up:

```typescript
// ❌ Bad: No cleanup
function startListening() {
  collection.subscribeDocument('doc-id', (doc) => {
    console.log(doc);
  });
  // Subscription never cleaned up!
}

// ✅ Good: Cleanup on exit
function startListening() {
  const unsubscribe = collection.subscribeDocument('doc-id', (doc) => {
    console.log(doc);
  });
  
  return unsubscribe; // Allow caller to cleanup
}

const unsubscribe = startListening();
// Later...
unsubscribe();
```

---

## 🔧 Troubleshooting

### Error: "Document data cannot be empty"

**Cause:** Trying to add/update document with no fields (except timestamps)

**Solution:**
```typescript
// ❌ This will fail
await collection.addDocument({});

// ✅ This works
await collection.addDocument({ name: 'John' });
```

### Error: "Batch size exceeds Firestore limit"

**Cause:** Trying to batch more than 500 documents

**Solution:**
```typescript
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

const chunks = chunkArray(largeArray, 500);
for (const chunk of chunks) {
  await collection.batchAdd(chunk.map(data => ({ data })));
}
```

### Error: "Firestore index is required"

**Cause:** Complex query needs a composite index

**Solution:**
1. Error message includes a URL
2. Click the URL to open Firebase Console
3. Click "Create Index"
4. Wait for index to build (can take minutes)
5. Retry your query

### Error: "Document with ID X already exists"

**Cause:** Trying to create document with existing custom ID

**Solutions:**
```typescript
// Option 1: Use different ID
await collection.addDocument(data, 'different-id');

// Option 2: Use auto-generated ID
await collection.addDocument(data);

// Option 3: Override existing
await collection.addDocument(data, 'existing-id', true);

// Option 4: Edit instead
await collection.editDocument('existing-id', data);
```

### Connection Issues

**Symptoms:** Timeout errors, connection refused

**Checklist:**
- ✅ Firebase project exists and is active
- ✅ Service account key is valid
- ✅ Network connectivity to Firestore
- ✅ Firestore is enabled in Firebase Console
- ✅ No firewall blocking googleapis.com

**Debug:**
```typescript
try {
  await collection.validateConnection();
  console.log('✅ Connected');
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  // Check credentials, network, etc.
}
```

---

## 📋 Requirements

### Runtime Requirements

- **Node.js**: >= 18.0.0
- **firebase-admin**: >= 12.0.0
- **TypeScript**: >= 5.4.0 (for TypeScript projects)

### Development Requirements

- **TypeScript**: >= 5.4.0
- **@types/node**: >= 20.0.0

### Firestore Requirements

- Active Firebase project
- Firestore database enabled
- Valid service account credentials
- Appropriate Firestore indexes for complex queries

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/rukandax/ts-firestore-admin-helper.git
cd ts-firestore-admin-helper

# Install dependencies
npm install

# Build
npm run build

# Lint
npm run lint

# Fix linting issues
npm run fix
```

### Reporting Issues

Please include:
- Node.js version
- firebase-admin version
- TypeScript version (if applicable)
- Code snippet reproducing the issue
- Error message and stack trace

---

## 📄 License

MIT © [Rukanda Faridsi](https://github.com/rukandax)

---

## 🔗 Links

- [GitHub Repository](https://github.com/rukandax/ts-firestore-admin-helper)
- [npm Package](https://www.npmjs.com/package/ts-firestore-admin-helper)
- [Issue Tracker](https://github.com/rukandax/ts-firestore-admin-helper/issues)
- [Firebase Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

---

## 🎉 Acknowledgments

Built with ❤️ using:
- [Firebase Admin SDK](https://www.npmjs.com/package/firebase-admin)
- [TypeScript](https://www.typescriptlang.org/)
- [Google Cloud Firestore](https://cloud.google.com/firestore)

---

**Made with ☕ by [Rukanda Faridsi](https://github.com/rukandax)**
