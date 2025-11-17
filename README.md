# 🔥 ts-firestore-admin-helper

> A type-safe, secure, and production-ready Firebase Firestore helper library for Node.js applications.

[![npm version](https://badge.fury.io/js/ts-firestore-admin-helper.svg)](https://www.npmjs.com/package/ts-firestore-admin-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4%2B-blue)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)

---

## 📖 Table of Contents

- [Features](#-features)
- [Installation](#-installation)
- [Quick Start](#-quick-start)
- [Setup Guide](#-setup-guide)
- [Usage Examples](#-usage-examples)
- [API Reference](#-api-reference)
- [Advanced Features](#-advanced-features)
- [Best Practices](#-best-practices)
- [Important Notes](#-important-notes)
- [Troubleshooting](#-troubleshooting)
- [Requirements](#-requirements)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🔒 Security First
- ✅ **Cryptographically secure ID generation** using Node.js `crypto` module
- ✅ **Comprehensive input validation** for all operations
- ✅ **Custom ID format validation** to prevent invalid Firestore IDs
- ✅ **No SQL injection risks** - all queries are type-safe
- ✅ **Zero `any` types** - complete TypeScript type safety

### 🚀 Performance & Reliability
- ✅ **Automatic batch size validation** (Firestore 500-document limit)
- ✅ **Race condition prevention** in batch operations
- ✅ **Transaction consistency** - all critical operations use Firestore transactions
- ✅ **Memory leak prevention** in real-time subscriptions
- ✅ **Optimized query execution** with proper indexing hints

### 📝 Developer Experience
- ✅ **Full TypeScript support** with strict mode enabled
- ✅ **IntelliSense support** for all methods and properties
- ✅ **Automatic timestamp management** (`createdAt`, `updatedAt`)
- ✅ **Comprehensive error messages** for easy debugging
- ✅ **Null safety checks** throughout the codebase
- ✅ **Generic type constraints** for better type inference

### 🎯 Production Ready
- ✅ **Battle-tested** transaction handling
- ✅ **ES2020 target** for modern Node.js environments
- ✅ **Well-documented** API with examples
- ✅ **No breaking changes** in patch updates

---

## 📦 Installation

### Using NPM

```bash
npm install ts-firestore-admin-helper firebase-admin
```

### Using Yarn

```bash
yarn add ts-firestore-admin-helper firebase-admin
```

### Using pnpm

```bash
pnpm add ts-firestore-admin-helper firebase-admin
```

---

## 🚀 Quick Start

```typescript
import admin from 'firebase-admin';
import FirestoreHelper from 'ts-firestore-admin-helper';

// 1. Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. Define your data interface
interface User {
  name: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
}

// 3. Create helper instance
const usersCollection = new FirestoreHelper<User>(db, 'users');

// 4. Validate connection (recommended)
await usersCollection.validateConnection();

// 5. Start using!
const newUser = await usersCollection.addDocument({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'user',
  isActive: true
});

console.log('User created:', newUser.id);
```

---

## 🛠️ Setup Guide

### Step 1: Get Firebase Service Account Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file securely (e.g., `serviceAccountKey.json`)

⚠️ **IMPORTANT**: Never commit this file to version control!

Add to `.gitignore`:
```
serviceAccountKey.json
*-firebase-adminsdk-*.json
```

### Step 2: Initialize Firebase Admin SDK

```typescript
import admin from 'firebase-admin';
import * as path from 'path';

// Option 1: Using service account file
const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json'));

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://your-project.firebaseio.com' // Optional
  });
}

// Option 2: Using environment variables (recommended for production)
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();
```

### Step 3: Define Your Collection Interfaces

```typescript
// types/collections.ts

export interface User {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  isActive: boolean;
  metadata?: {
    lastLogin?: number;
    loginCount?: number;
  };
}

export interface Product {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  tags: string[];
  isAvailable: boolean;
}

export interface Order {
  userId: string;
  productIds: string[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    zipCode: string;
  };
}
```

### Step 4: Create Helper Instances

```typescript
// services/collections.ts

import FirestoreHelper from 'ts-firestore-admin-helper';
import { User, Product, Order } from './types/collections';
import { db } from './firebase'; // Your Firebase initialization

export const usersCollection = new FirestoreHelper<User>(db, 'users');
export const productsCollection = new FirestoreHelper<Product>(db, 'products');
export const ordersCollection = new FirestoreHelper<Order>(db, 'orders');

// Validate connections on startup
export async function validateFirestoreConnections() {
  try {
    await Promise.all([
      usersCollection.validateConnection(),
      productsCollection.validateConnection(),
      ordersCollection.validateConnection(),
    ]);
    console.log('✅ All Firestore connections validated');
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
    throw error;
  }
}
```

### Step 5: Use in Your Application

```typescript
// index.ts or server.ts

import { validateFirestoreConnections, usersCollection } from './services/collections';

async function main() {
  // Validate connections on startup
  await validateFirestoreConnections();
  
  // Your application logic
  const users = await usersCollection.findDocumentsData([
    { field: 'isActive', operator: '==', value: true }
  ]);
  
  console.log(`Found ${users.length} active users`);
}

main().catch(console.error);
```

---

## 💡 Usage Examples

### Basic CRUD Operations

```typescript
// CREATE - Add a new document
const user = await usersCollection.addDocument({
  name: 'Alice Smith',
  email: 'alice@example.com',
  role: 'user',
  isActive: true
});
console.log('Created user:', user.id);

// CREATE with custom ID
const adminUser = await usersCollection.addDocument(
  {
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true
  },
  'admin-001' // Custom ID
);

// CREATE with override (replace if exists)
const updatedUser = await usersCollection.addDocument(
  {
    name: 'Updated Admin',
    email: 'admin@example.com',
    role: 'admin',
    isActive: true
  },
  'admin-001',
  true // Override existing
);

// READ - Get single document
const userData = await usersCollection.getDocumentData('admin-001');
if (userData) {
  console.log('User:', userData.data.name);
}

// UPDATE - Edit document
await usersCollection.editDocument('admin-001', {
  isActive: false,
  metadata: {
    lastLogin: Date.now()
  }
});

// DELETE - Remove document
await usersCollection.removeDocument('user-123');
```

### Batch Operations

```typescript
// BATCH ADD - Create multiple documents
await usersCollection.batchAdd([
  {
    data: {
      name: 'User 1',
      email: 'user1@example.com',
      role: 'user',
      isActive: true
    }
  },
  {
    id: 'custom-id-001',
    data: {
      name: 'User 2',
      email: 'user2@example.com',
      role: 'user',
      isActive: true
    },
    override: false
  }
  // ... up to 500 documents
]);

// BATCH EDIT - Update multiple documents
await usersCollection.batchEdit([
  {
    id: 'user-001',
    data: { isActive: false }
  },
  {
    id: 'user-002',
    data: { role: 'moderator' }
  }
]);

// BATCH REMOVE - Delete multiple documents
await usersCollection.batchRemove(['user-001', 'user-002', 'user-003']);
```

### Query Operations

```typescript
// FIND - Query with single condition
const activeUsers = await usersCollection.findDocumentsData([
  { field: 'isActive', operator: '==', value: true }
]);

// FIND - Query with multiple conditions
const adminUsers = await usersCollection.findDocumentsData([
  { field: 'role', operator: '==', value: 'admin' },
  { field: 'isActive', operator: '==', value: true }
]);

// FIND - Query with options (sorting, limiting, pagination)
const recentUsers = await usersCollection.findDocumentsData(
  [{ field: 'isActive', operator: '==', value: true }],
  {
    orderBy: 'createdAt',
    orderDirection: 'desc',
    limit: 10
  }
);

// FIND - Pagination
const firstPage = await usersCollection.findDocumentsData(
  [],
  {
    orderBy: 'createdAt',
    limit: 20
  }
);

const secondPage = await usersCollection.findDocumentsData(
  [],
  {
    orderBy: 'createdAt',
    limit: 20,
    startAfterId: firstPage[firstPage.length - 1].id // Last ID from first page
  }
);

// FIND ONE - Get first matching document
const firstAdmin = await usersCollection.findDocumentData([
  { field: 'role', operator: '==', value: 'admin' }
]);

if (firstAdmin) {
  console.log('First admin:', firstAdmin.data.name);
}
```

### Real-time Subscriptions

```typescript
// SUBSCRIBE to a single document
const unsubscribeUser = usersCollection.subscribeDocument(
  'user-001',
  (doc) => {
    console.log('User updated:', doc.data);
    console.log('Updated at:', doc.data.updatedAt);
  }
);

// Later: unsubscribe
// unsubscribeUser();

// SUBSCRIBE to entire collection
const unsubscribeCollection = usersCollection.subscribeCollection(
  (snapshot) => {
    console.log(`Total users: ${snapshot.size}`);
    snapshot.forEach(doc => {
      console.log('User:', doc.id, doc.data());
    });
  }
);

// SUBSCRIBE to query results
const unsubscribeQuery = usersCollection.subscribeQuery(
  [
    { field: 'role', operator: '==', value: 'admin' },
    { field: 'isActive', operator: '==', value: true }
  ],
  (snapshot) => {
    console.log(`Active admins: ${snapshot.size}`);
    snapshot.docs.forEach(doc => {
      console.log('Admin:', doc.data().name);
    });
  }
);

// Cleanup on app shutdown
process.on('SIGINT', () => {
  unsubscribeUser();
  unsubscribeCollection();
  unsubscribeQuery();
  process.exit(0);
});
```

### Advanced Query Examples

```typescript
// Array contains query
const taggedProducts = await productsCollection.findDocumentsData([
  { field: 'tags', operator: 'array-contains', value: 'featured' }
]);

// In query (multiple values)
const specificRoles = await usersCollection.findDocumentsData([
  { field: 'role', operator: 'in', value: ['admin', 'moderator'] }
]);

// Range query
const affordableProducts = await productsCollection.findDocumentsData([
  { field: 'price', operator: '>=', value: 10 },
  { field: 'price', operator: '<=', value: 100 }
]);

// Not equal query (Firestore 9.9+)
const nonPendingOrders = await ordersCollection.findDocumentsData([
  { field: 'status', operator: '!=', value: 'pending' }
]);
```

---

## 📚 API Reference

### Constructor

```typescript
new FirestoreHelper<T extends BaseDocument>(
  firestoreInstance: admin.firestore.Firestore,
  collectionPath: string
)
```

**Parameters:**
- `firestoreInstance`: Initialized Firestore instance from Firebase Admin SDK
- `collectionPath`: Path to the collection (e.g., `'users'`, `'products/prod-1/reviews'`)

**Returns:** `FirestoreHelper<T>` instance

---

### Methods

#### `validateConnection(): Promise<void>`

Validates the Firestore connection by performing a test read operation.

**Recommended**: Call this method after initialization to ensure connectivity.

```typescript
await usersCollection.validateConnection();
```

**Throws:** Error if connection fails

---

#### `addDocument(data, id?, override?): Promise<{id: string; data: T}>`

Creates a new document in the collection.

**Parameters:**
- `data: T` - Document data (required)
- `id?: string` - Custom document ID (optional, auto-generated if not provided)
- `override?: boolean` - Replace existing document if ID exists (default: `false`)

**Returns:** Object with `id` and complete `data` (including timestamps)

**Features:**
- Auto-generates secure 30-character ID if not provided
- Validates document data is not empty
- Validates custom ID format
- Automatically adds `createdAt` and `updatedAt` timestamps
- Uses Firestore transaction for consistency

**Example:**
```typescript
const doc = await collection.addDocument(
  { name: 'John' },
  'custom-id',
  false
);
```

---

#### `editDocument(docId, data): Promise<{id: string; data: T}>`

Updates an existing document.

**Parameters:**
- `docId: string` - Document ID to update
- `data: Partial<T>` - Fields to update

**Returns:** Object with `id` and complete updated `data`

**Features:**
- Validates document exists
- Prevents updating document ID
- Automatically updates `updatedAt` timestamp
- Uses transaction for consistency
- Merges with existing data

**Example:**
```typescript
const updated = await collection.editDocument('doc-id', {
  name: 'Jane'
});
```

---

#### `removeDocument(docId): Promise<void>`

Deletes a document from the collection.

**Parameters:**
- `docId: string` - Document ID to delete

**Features:**
- Validates document exists before deletion
- Uses transaction for consistency

**Example:**
```typescript
await collection.removeDocument('doc-id');
```

---

#### `batchAdd(documents): Promise<void>`

Adds multiple documents in a single transaction.

**Parameters:**
- `documents: Array<{id?: string; data: T; override?: boolean}>` - Array of documents to add

**Limits:**
- Maximum 500 documents per batch (Firestore limit)
- Validates all documents before starting transaction

**Features:**
- Generates all IDs before transaction (prevents race conditions)
- Validates all document data upfront
- Atomic operation (all or nothing)

**Example:**
```typescript
await collection.batchAdd([
  { data: { name: 'User 1' } },
  { id: 'custom', data: { name: 'User 2' }, override: true }
]);
```

---

#### `batchEdit(updates): Promise<void>`

Updates multiple documents in a single transaction.

**Parameters:**
- `updates: Array<{id: string; data: Partial<T>}>` - Array of updates

**Limits:** Maximum 500 documents per batch

**Example:**
```typescript
await collection.batchEdit([
  { id: 'doc1', data: { name: 'Updated 1' } },
  { id: 'doc2', data: { name: 'Updated 2' } }
]);
```

---

#### `batchRemove(docIds): Promise<void>`

Deletes multiple documents in a single transaction.

**Parameters:**
- `docIds: string[]` - Array of document IDs to delete

**Limits:** Maximum 500 documents per batch

**Example:**
```typescript
await collection.batchRemove(['doc1', 'doc2', 'doc3']);
```

---

#### `getDocument(docId): Promise<DocumentSnapshot<T>>`

Gets a document snapshot.

**Returns:** Firestore DocumentSnapshot

**Example:**
```typescript
const snapshot = await collection.getDocument('doc-id');
if (snapshot.exists) {
  console.log(snapshot.data());
}
```

---

#### `getDocumentData(docId): Promise<{id: string; data: T} | null>`

Gets document data with null safety.

**Returns:** Document object or `null` if not found

**Example:**
```typescript
const doc = await collection.getDocumentData('doc-id');
if (doc) {
  console.log(doc.data.name);
}
```

---

#### `findDocuments(query, options?): Promise<QuerySnapshot<T>>`

Finds documents matching query criteria.

**Parameters:**
- `query: QueryPayload<T>[]` - Array of query conditions
- `options?: QueryOptions<T>` - Sorting, limiting, pagination

**QueryPayload:**
```typescript
{
  field: keyof T;
  operator: '==' | '!=' | '<' | '<=' | '>' | '>=' | 'array-contains' | 'in' | 'array-contains-any' | 'not-in';
  value: any;
}
```

**QueryOptions:**
```typescript
{
  orderBy?: keyof T;
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  startAfterId?: string; // For pagination
}
```

**Returns:** Firestore QuerySnapshot

**Example:**
```typescript
const snapshot = await collection.findDocuments(
  [{ field: 'isActive', operator: '==', value: true }],
  { orderBy: 'createdAt', limit: 10 }
);
```

---

#### `findDocument(query): Promise<QueryDocumentSnapshot<T> | null>`

Finds first document matching query.

**Returns:** First matching document or `null`

---

#### `findDocumentsData(query, options?): Promise<Array<{id: string; data: T}>>`

Finds documents and returns data array.

**Returns:** Array of document objects

**Example:**
```typescript
const users = await collection.findDocumentsData([
  { field: 'role', operator: '==', value: 'admin' }
]);
```

---

#### `findDocumentData(query): Promise<{id: string; data: T} | null>`

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

## 🎯 Advanced Features

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
