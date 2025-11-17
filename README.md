# TypeScript Firestore Admin Helper

A type-safe, developer-friendly wrapper for Firebase Admin Firestore operations with built-in validation, automatic timestamping, and transaction support.

[![npm version](https://badge.fury.io/js/ts-firestore-admin-helper.svg)](https://www.npmjs.com/package/ts-firestore-admin-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org/)

## Setup

### Installation

```bash
npm install ts-firestore-admin-helper firebase-admin
```

**Requirements:**
- Node.js >= 18
- Firebase Admin SDK

### Initial Configuration

#### 1. Initialize Firebase Admin

```typescript
import admin from 'firebase-admin';
import FirestoreHelper from 'ts-firestore-admin-helper';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert('/path/to/serviceAccountKey.json'),
});

const db = admin.firestore();
```

#### 2. Define Document Interface

```typescript
interface User {
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
  createdAt?: number;  // Auto-managed
  updatedAt?: number;  // Auto-managed
}
```

#### 3. Create Collection Helper

```typescript
const usersCollection = new FirestoreHelper<User>(db, 'users');

// With custom logger (Winston, Pino, etc.)
const usersWithLogger = new FirestoreHelper<User>(db, 'users', {
  logger: myWinstonLogger,  // Logger with debug, info, warn, error methods
  debug: true               // Enable debug logging
});

// Silent mode (no logging)
const usersSilent = new FirestoreHelper<User>(db, 'users', {
  logger: 'silent'
});
```

#### 4. Start Using

```typescript
// Add document
const user = await usersCollection.addDocument({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
  status: 'active'
});

// Get document
const userData = await usersCollection.getDocumentData(user.id);

// Update document
await usersCollection.editDocument(user.id, {
  age: 31,
  status: 'inactive'
});

// Delete document
await usersCollection.removeDocument(user.id);
```

## Advantages

### Technical Advantages

- **Full Type Safety** - Supports TypeScript with generic types
- **Automatic Timestamps** - `createdAt` and `updatedAt` fields managed automatically
- **Transaction Support** - Built-in transaction handling for all operations
- **Automatic Validation** - Data validation, ID validation, and query constraints
- **Error Handling** - Consistent and informative error handling
- **Memory Efficient** - Automatic cleanup of undefined values
- **Developer Experience** - Intuitive and easy-to-use API

### Productivity Advantages

- **Rapid Development** - Quick setup and simple API
- **Built-in Best Practices** - Already follows Firestore best practices
- **Comprehensive Logging** - Integrated logging with various logger libraries
- **Real-time Ready** - Built-in subscriptions for real-time updates
- **Batch Operations** - Efficient bulk operations with auto-chunking
- **Atomic Operations** - Increment/decrement and conditional updates

### Performance Advantages

- **Optimized Queries** - Query validation prevents invalid queries
- **Efficient Batching** - Auto-chunking for large operations
- **Connection Pooling** - Uses Firebase Admin SDK connection pooling
- **Memory Management** - Automatic cleanup and garbage collection

## Features

### Document Operations

#### Basic CRUD
```typescript
// Create
const doc = await collection.addDocument(data, customId?, override?);

// Read
const snapshot = await collection.getDocument(docId);
const data = await collection.getDocumentData(docId);

// Update
await collection.editDocument(docId, updates);

// Delete
await collection.removeDocument(docId);
```

#### Special Operations
```typescript
// Atomic increment/decrement
await collection.atomicIncrement('doc-id', 'counter', 1);

// Conditional update
const result = await collection.conditionalUpdate(
  'doc-id',
  [{ field: 'status', operator: '==', value: 'pending' }],
  { status: 'processed' }
);
```

### Query Operations

#### Basic Queries
```typescript
// Simple query
const activeUsers = await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' }
]);

// Complex query
const adults = await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' },
  { field: 'age', operator: '>=', value: 18 }
]);

// Range query
const workingAge = await usersCollection.findDocumentsData([
  { field: 'age', operator: '>=', value: 18 },
  { field: 'age', operator: '<=', value: 65 }
]);
```

#### Supported Query Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `==` | Equal to | `{ field: 'status', operator: '==', value: 'active' }` |
| `!=` | Not equal to | `{ field: 'status', operator: '!=', value: 'deleted' }` |
| `<` | Less than | `{ field: 'age', operator: '<', value: 18 }` |
| `<=` | Less than or equal | `{ field: 'stock', operator: '<=', value: 0 }` |
| `>` | Greater than | `{ field: 'price', operator: '>', value: 100 }` |
| `>=` | Greater than or equal | `{ field: 'quantity', operator: '>=', value: 10 }` |
| `in` | Value in array | `{ field: 'status', operator: 'in', value: ['pending', 'processing'] }` |
| `not-in` | Value not in array | `{ field: 'status', operator: 'not-in', value: ['deleted', 'archived'] }` |
| `array-contains` | Array contains value | `{ field: 'tags', operator: 'array-contains', value: 'urgent' }` |
| `array-contains-any` | Array contains any value | `{ field: 'tags', operator: 'array-contains-any', value: ['bug', 'critical'] }` |

#### Query with Options
```typescript
const recentUsers = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: 'createdAt',
    orderDirection: 'desc',
    limit: 10,
    startAfterId: 'last-doc-id'
  }
);

// Multi-field ordering
const sortedUsers = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: [
      { field: 'priority', direction: 'desc' },
      { field: 'createdAt', direction: 'desc' }
    ],
    limit: 20
  }
);
```

### Batch Operations

#### Batch CRUD
```typescript
// Batch add
await usersCollection.batchAdd([
  { data: { name: 'John', email: 'john@example.com' } },
  { data: { name: 'Jane', email: 'jane@example.com' } },
  { id: 'custom-id', data: { name: 'Bob', email: 'bob@example.com' } }
]);

// Batch update
await usersCollection.batchEdit([
  { id: 'user-1', data: { status: 'active' } },
  { id: 'user-2', data: { status: 'inactive' } }
]);

// Batch delete
await usersCollection.batchRemove(['user-1', 'user-2', 'user-3']);
```

#### Large Data Batch Operations
```typescript
// Auto-chunking for large datasets (>500 documents)
await usersCollection.batchAddLarge(largeUserArray);
await usersCollection.batchEditLarge(largeUpdateArray);
await usersCollection.batchRemoveLarge(largeIdArray);
```

### Real-time Subscriptions

#### Document Subscription
```typescript
const unsubscribe = usersCollection.subscribeDocument(
  'user-123',
  (doc) => console.log('Document updated:', doc),
  (error) => console.error('Subscription error:', error)
);

// Unsubscribe
unsubscribe();
```

#### Collection Subscription
```typescript
const unsubscribe = usersCollection.subscribeCollection(
  (snapshot) => console.log('Collection changed:', snapshot.docs.length),
  (error) => console.error('Subscription error:', error)
);
```

#### Query Subscription
```typescript
const unsubscribe = usersCollection.subscribeQuery(
  [{ field: 'status', operator: '==', value: 'active' }],
  (snapshot) => console.log('Active users:', snapshot.docs.length),
  (error) => console.error('Subscription error:', error)
);
```

### Advanced Features

#### Custom Logger Integration
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()]
});

const collection = new FirestoreHelper<User>(db, 'users', {
  logger: logger,
  debug: true
});
```

#### Undefined Value Handling
```typescript
// On add: undefined fields are automatically removed
await collection.addDocument({
  name: 'John',
  email: 'john@example.com',
  tempField: undefined  // This field is ignored
});

// On update: undefined fields are deleted from Firestore
await collection.editDocument('doc-id', {
  name: 'Updated Name',
  oldField: undefined  // This field is deleted
});
```

#### Query Validation
```typescript
// ❌ Will throw QueryValidationError
try {
  await collection.findDocumentsData([
    { field: 'status', operator: '!=', value: 'active' },
    { field: 'role', operator: '!=', value: 'admin' }  // Multiple != not allowed
  ]);
} catch (error) {
  console.log(error.message); // "Cannot use multiple '!=' operators..."
}
```

#### Custom Transactions
```typescript
const result = await db.runTransaction(async (transaction) => {
  const docRef = usersCollection.doc('user-123');
  const snapshot = await transaction.get(docRef);

  // Use transaction with helper methods
  const updated = await usersCollection.editDocument('user-456', {
    status: 'processed'
  }, transaction); // Pass transaction

  return { user: snapshot.data(), updated };
});
```

## Best Practices

### Architecture & Design

#### 1. Interface Design
```typescript
// ✅ Use consistent interfaces
interface User {
  id?: string;           // Optional for create
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  createdAt?: number;    // Auto-managed
  updatedAt?: number;    // Auto-managed
}

// ❌ Avoid any types
interface BadUser {
  data: any;      // ❌ Too loose
  metadata?: any; // ❌ Unpredictable
}
```

#### 2. Collection Organization
```typescript
// ✅ Group related collections
const users = new FirestoreHelper<User>(db, 'users');
const posts = new FirestoreHelper<Post>(db, 'posts');
const comments = new FirestoreHelper<Comment>(db, 'comments');

// ✅ Use subcollections for hierarchical data
const userPosts = new FirestoreHelper<Post>(db, `users/${userId}/posts`);
```

### Query Optimization

#### 1. Index Awareness
```typescript
// ✅ Queries that use indexes
const activeUsers = await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' },
  { field: 'createdAt', operator: '>', value: yesterday }
]);

// ❌ Queries requiring composite indexes
const inefficient = await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' },
  { field: 'age', operator: '>', value: 18 },
  { field: 'city', operator: '==', value: 'Jakarta' } // Requires composite index
]);
```

#### 2. Pagination Strategy
```typescript
// ✅ Efficient pagination
async function getUsersPage(lastDocId?: string, limit = 20) {
  return await usersCollection.findDocumentsData(
    [{ field: 'status', operator: '==', value: 'active' }],
    {
      orderBy: 'createdAt',
      orderDirection: 'desc',
      limit,
      startAfterId: lastDocId
    }
  );
}
```

#### 3. Query Limits
```typescript
// ✅ Limit queries for performance
const recentPosts = await postsCollection.findDocumentsData(
  [{ field: 'published', operator: '==', value: true }],
  {
    orderBy: 'createdAt',
    orderDirection: 'desc',
    limit: 50  // Don't fetch all data
  }
);
```

### Batch Operations Best Practices

#### 1. Batch Size Optimization
```typescript
// ✅ Use batchAddLarge for large data
await usersCollection.batchAddLarge(userArray); // Auto-chunking

// ✅ Manual chunking for control
const chunks = [];
for (let i = 0; i < data.length; i += 400) { // 400 < 500 for buffer
  chunks.push(data.slice(i, i + 400));
}

for (const chunk of chunks) {
  await collection.batchAdd(chunk);
}
```

#### 2. Error Handling
```typescript
// ✅ Handle batch errors gracefully
try {
  await usersCollection.batchAddLarge(userData);
} catch (error) {
  console.error('Batch operation failed:', error);

  // Fallback to individual operations
  for (const user of userData) {
    try {
      await usersCollection.addDocument(user.data, user.id);
    } catch (individualError) {
      console.error(`Failed to add user ${user.id}:`, individualError);
    }
  }
}
```

### Transaction Best Practices

#### 1. Keep Transactions Small
```typescript
// ✅ Small, focused transactions
await db.runTransaction(async (transaction) => {
  const userRef = usersCollection.doc(userId);
  const user = await transaction.get(userRef);

  // Update user balance
  transaction.update(userRef, {
    balance: user.data().balance - amount,
    updatedAt: Date.now()
  });
});
```

#### 2. Avoid Long-Running Operations
```typescript
// ❌ Avoid external API calls in transactions
await db.runTransaction(async (transaction) => {
  // ... transaction logic ...

  // ❌ Don't do this - can cause timeouts
  const result = await externalApiCall();

  // ... more transaction logic ...
});
```

#### 3. Handle Transaction Failures
```typescript
// ✅ Handle transaction conflicts
let retries = 0;
const maxRetries = 3;

while (retries < maxRetries) {
  try {
    await db.runTransaction(async (transaction) => {
      // Transaction logic here
    });
    break; // Success
  } catch (error) {
    if (error.code === 'ABORTED') {
      retries++;
      continue; // Retry on conflict
    }
    throw error; // Re-throw other errors
  }
}
```

### Real-time Subscriptions Best Practices

#### 1. Manage Subscription Lifecycle
```typescript
// ✅ Properly manage subscriptions
class UserService {
  private subscriptions: (() => void)[] = [];

  subscribeToUser(userId: string) {
    const unsubscribe = usersCollection.subscribeDocument(
      userId,
      this.handleUserUpdate.bind(this),
      this.handleSubscriptionError.bind(this)
    );

    this.subscriptions.push(unsubscribe);
  }

  destroy() {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }
}
```

#### 2. Handle Connection Issues
```typescript
// ✅ Implement reconnection logic
const subscribeWithRetry = (collection, query, callback, errorCallback) => {
  let unsubscribe = null;

  const subscribe = () => {
    unsubscribe = collection.subscribeQuery(query, callback, (error) => {
      errorCallback(error);

      // Retry after delay
      setTimeout(subscribe, 5000);
    });
  };

  subscribe();

  return () => unsubscribe?.();
};
```

### Performance Optimization

#### 1. Use Appropriate Data Types
```typescript
// ✅ Use efficient data types
interface OptimizedUser {
  id: string;
  name: string;        // String is efficient
  age: number;         // Numbers are efficient
  tags: string[];      // Arrays are fine for small lists
  metadata: { [key: string]: any }; // Objects for flexible data
}

// ❌ Avoid inefficient patterns
interface InefficientUser {
  largeText: string;   // Very long strings impact performance
  nested: {            // Deep nesting can be slow
    deeply: {
      nested: {
        data: string
      }
    }
  };
}
```

#### 2. Implement Caching Strategy
```typescript
// ✅ Cache frequently accessed data
class CachedUserService {
  private cache = new Map<string, { data: User; timestamp: number }>();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  async getUser(userId: string): Promise<User> {
    const cached = this.cache.get(userId);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const user = await usersCollection.getDocumentData(userId);
    this.cache.set(userId, { data: user, timestamp: Date.now() });
    return user;
  }
}
```

### Security Best Practices

#### 1. Validate Input Data
```typescript
// ✅ Validate data before operations
const validateUserData = (data: Partial<User>) => {
  if (!data.name || data.name.length < 2) {
    throw new Error('Name must be at least 2 characters');
  }

  if (!data.email || !data.email.includes('@')) {
    throw new Error('Invalid email format');
  }

  // Additional validations...
};

await usersCollection.addDocument(validateUserData(userInput));
```

#### 2. Use Security Rules
```javascript
// Firestore Security Rules example
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    match /posts/{postId} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == resource.data.authorId;
    }
  }
}
```

### Monitoring & Debugging

#### 1. Enable Appropriate Logging
```typescript
// ✅ Use different log levels appropriately
const collection = new FirestoreHelper<User>(db, 'users', {
  logger: winstonLogger,
  debug: process.env.NODE_ENV === 'development'
});

// Log important operations
await usersCollection.addDocument(userData);
logger.info(`User ${userData.email} created successfully`);
```

#### 2. Monitor Performance
```typescript
// ✅ Add performance monitoring
const withTiming = async <T>(operation: () => Promise<T>, name: string): Promise<T> => {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    logger.info(`${name} completed in ${duration}ms`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error(`${name} failed after ${duration}ms:`, error);
    throw error;
  }
};

await withTiming(
  () => usersCollection.batchAddLarge(userData),
  'Batch user creation'
);
```

### Error Handling Best Practices

#### 1. Implement Comprehensive Error Handling
```typescript
// ✅ Handle different error types
try {
  await usersCollection.addDocument(userData);
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    logger.warn('Permission denied for user creation');
    throw new ForbiddenError('Insufficient permissions');
  }

  if (error.code === 'ALREADY_EXISTS') {
    logger.warn(`User with email ${userData.email} already exists`);
    throw new ConflictError('User already exists');
  }

  if (error.code === 'RESOURCE_EXHAUSTED') {
    logger.error('Firestore quota exceeded');
    throw new QuotaExceededError('Service temporarily unavailable');
  }

  logger.error('Unexpected error during user creation:', error);
  throw new InternalServerError('Failed to create user');
}
```

#### 2. Implement Retry Logic
```typescript
// ✅ Implement exponential backoff retry
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) break;

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

await retryOperation(() => usersCollection.getDocumentData(userId));
```

### Testing Best Practices

#### 1. Unit Test Your Operations
```typescript
// ✅ Test with mocked Firestore
import { mockFirestore } from 'firestore-jest-mock';

describe('UserService', () => {
  let db: FirebaseFirestore.Firestore;
  let usersCollection: FirestoreHelper<User>;

  beforeEach(() => {
    db = mockFirestore();
    usersCollection = new FirestoreHelper<User>(db, 'users');
  });

  it('should create user successfully', async () => {
    const userData = { name: 'John', email: 'john@test.com' };
    const result = await usersCollection.addDocument(userData);

    expect(result.id).toBeDefined();
    expect(result.data.name).toBe(userData.name);
  });
});
```

#### 2. Integration Testing
```typescript
// ✅ Test with real Firestore (use test project)
describe('UserService Integration', () => {
  let db: FirebaseFirestore.Firestore;

  beforeAll(() => {
    // Use test Firebase project
    const testApp = admin.initializeApp({
      projectId: 'test-project'
    }, 'test');
    db = testApp.firestore();
  });

  afterEach(async () => {
    // Clean up test data
    await clearTestData(db);
  });

  it('should handle concurrent updates', async () => {
    // Test concurrent transaction scenarios
  });
});
```

### Deployment & Environment Best Practices

#### 1. Environment Configuration
```typescript
// ✅ Use environment-specific configurations
const getFirestoreConfig = () => {
  const env = process.env.NODE_ENV || 'development';

  switch (env) {
    case 'production':
      return {
        logger: winstonLogger,
        debug: false
      };

    case 'staging':
      return {
        logger: winstonLogger,
        debug: true
      };

    default: // development
      return {
        logger: consoleLogger,
        debug: true
      };
  }
};

const usersCollection = new FirestoreHelper<User>(
  db,
  'users',
  getFirestoreConfig()
);
```

#### 2. Connection Management
```typescript
// ✅ Properly initialize and cleanup connections
class FirestoreService {
  private db: FirebaseFirestore.Firestore;
  private app: admin.app.App;

  constructor() {
    this.app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: `https://${projectId}.firebaseio.com`
    });
    this.db = this.app.firestore();

    // Configure Firestore settings
    this.db.settings({
      ignoreUndefinedProperties: true,
      timestampsInSnapshots: true
    });
  }

  async destroy() {
    await this.app.delete();
  }
}
```

This comprehensive guide covers the essential aspects of using the TypeScript Firestore Admin Helper effectively. Following these best practices will help you build robust, scalable, and maintainable applications with Firestore.