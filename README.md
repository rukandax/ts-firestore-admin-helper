# TypeScript Firestore Admin Helper

A type-safe, developer-friendly wrapper for Firebase Admin Firestore operations with built-in validation, automatic timestamping, and transaction support.

[![npm version](https://badge.fury.io/js/ts-firestore-admin-helper.svg)](https://www.npmjs.com/package/ts-firestore-admin-helper)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

✅ **Type-Safe Operations** - Full TypeScript support with generic types  
✅ **Automatic Timestamps** - Auto-managed `createdAt` and `updatedAt` fields  
✅ **Transaction Support** - Built-in transaction handling for all operations  
✅ **Batch Operations** - Efficient bulk operations with validation  
✅ **Query Builder** - Type-safe query construction  
✅ **Real-time Subscriptions** - Easy-to-use snapshot listeners  
✅ **Atomic Operations** - Increment/decrement and conditional updates  
✅ **Validation** - Built-in data and ID validation  
✅ **Custom Transactions** - Full control for complex use cases

## Installation

```bash
npm install ts-firestore-admin-helper firebase-admin
```

## Quick Start

### 1. Initialize Firebase Admin

```typescript
import admin from 'firebase-admin';
import FirestoreHelper from 'ts-firestore-admin-helper';

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert('/path/to/serviceAccountKey.json'),
});

const db = admin.firestore();
```

### 2. Define Your Document Interface

```typescript
interface User {
  name: string;
  email: string;
  age: number;
  createdAt?: number;  // Auto-managed
  updatedAt?: number;  // Auto-managed
}
```

### 3. Create a Collection Helper

```typescript
const usersCollection = new FirestoreHelper<User>(db, 'users');

// With custom logger (Winston, Pino, etc.)
const usersWithLogger = new FirestoreHelper<User>(db, 'users', {
  logger: myWinstonLogger,  // Any logger with debug, info, warn, error methods
  debug: true               // Enable debug logging
});

// Silent mode (no logging)
const usersSilent = new FirestoreHelper<User>(db, 'users', {
  logger: 'silent'
});
```

[**📚 See Custom Logger Examples →**](./examples/custom-logger.ts)

### 4. Start Using It!

```typescript
// Add a document
const user = await usersCollection.addDocument({
  name: 'John Doe',
  email: 'john@example.com',
  age: 30,
});

// Get a document
const userData = await usersCollection.getDocumentData('user-id');

// Update a document
await usersCollection.editDocument('user-id', {
  age: 31,
});

// Delete a document
await usersCollection.removeDocument('user-id');
```

## Basic Operations

### Adding Documents

```typescript
// Auto-generated ID
const result = await usersCollection.addDocument({
  name: 'Jane Smith',
  email: 'jane@example.com',
  age: 28,
});
console.log(result.id); // Auto-generated ID

// Custom ID
await usersCollection.addDocument(
  {
    name: 'Bob Wilson',
    email: 'bob@example.com',
    age: 35,
  },
  'custom-user-id'
);

// Override existing document
await usersCollection.addDocument(
  {
    name: 'Updated Name',
    email: 'updated@example.com',
    age: 40,
  },
  'existing-id',
  true // override flag
);
```

### Querying Documents

```typescript
// Find multiple documents with single orderBy
const adults = await usersCollection.findDocumentsData(
  [
    { field: 'age', operator: '>=', value: 18 },
    { field: 'email', operator: '!=', value: null },
  ],
  {
    orderBy: 'age',
    orderDirection: 'desc',
    limit: 10,
  }
);

// Find with multiple orderBy fields (requires composite index)
const users = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: [
      { field: 'age', direction: 'asc' },
      { field: 'createdAt', direction: 'desc' }
    ],
    limit: 20
  }
);

// Find single document
const user = await usersCollection.findDocumentData([
  { field: 'email', operator: '==', value: 'john@example.com' },
]);
```

### Batch Operations

```typescript
// Batch add
await usersCollection.batchAdd([
  {
    data: { name: 'User 1', email: 'user1@example.com', age: 25 },
  },
  {
    id: 'custom-id-2',
    data: { name: 'User 2', email: 'user2@example.com', age: 30 },
  },
]);

// Batch update
await usersCollection.batchEdit([
  { id: 'user-1', data: { age: 26 } },
  { id: 'user-2', data: { age: 31 } },
]);

// Batch delete
await usersCollection.batchRemove(['user-1', 'user-2', 'user-3']);
```

### Real-time Subscriptions

```typescript
// Subscribe to a document
const unsubscribe = usersCollection.subscribeDocument('user-id', (doc) => {
  console.log('Updated user:', doc.data);
});

// Subscribe to a query
const unsubscribeQuery = usersCollection.subscribeQuery(
  [{ field: 'age', operator: '>=', value: 18 }],
  (snapshot) => {
    snapshot.forEach((doc) => {
      console.log(doc.id, doc.data());
    });
  }
);

// Don't forget to unsubscribe
unsubscribe();
unsubscribeQuery();
```

## Advanced Features

### Multiple OrderBy Fields

Sort by multiple fields with full type safety (requires composite index):

```typescript
// E-commerce: Best rated, then cheapest
const products = await productsCollection.findDocumentsData(
  [{ field: 'stock', operator: '>', value: 0 }],
  {
    orderBy: [
      { field: 'rating', direction: 'desc' },
      { field: 'price', direction: 'asc' }
    ],
    limit: 20
  }
);

// Social media: Pinned first, then by date
const posts = await postsCollection.findDocumentsData(
  [],
  {
    orderBy: [
      { field: 'isPinned', direction: 'desc' },
      { field: 'createdAt', direction: 'desc' }
    ]
  }
);
```

[**📚 See Multiple OrderBy in Query Guide →**](./docs/QUERIES.md#multiple-order-by-fields)

### Custom Logger Support

Integrate with any logging library (Winston, Pino, Bunyan) or use custom logger:

```typescript
import { Logger } from 'ts-firestore-admin-helper';
import winston from 'winston';

// Using Winston
const winstonLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

const usersWithWinston = new FirestoreHelper<User>(db, 'users', {
  logger: winstonLogger,
  debug: true  // Enable debug logs
});

// Using Pino
import pino from 'pino';
const pinoLogger = pino({ level: 'debug' });

const usersWithPino = new FirestoreHelper<User>(db, 'users', {
  logger: pinoLogger
});

// Custom logger implementation
class MyLogger implements Logger {
  debug(message: string, ...meta: unknown[]): void {
    // Your custom debug logging
  }
  info(message: string, ...meta: unknown[]): void {
    // Your custom info logging
  }
  warn(message: string, ...meta: unknown[]): void {
    // Your custom warning logging
  }
  error(message: string, ...meta: unknown[]): void {
    // Your custom error logging
  }
}

const usersWithCustom = new FirestoreHelper<User>(db, 'users', {
  logger: new MyLogger()
});

// Silent mode (disable all logging)
const usersSilent = new FirestoreHelper<User>(db, 'users', {
  logger: 'silent'
});
```

**Benefits:**
- 📝 Log to files, cloud services (Datadog, CloudWatch), or custom destinations
- 🔍 Debug mode for development, silent for production
- 🎯 Structured logging with metadata
- ⚡ Zero performance impact when silent

[**📚 See Custom Logger Examples →**](./examples/custom-logger.ts)

### Atomic Operations

```typescript
// Increment a counter
await usersCollection.atomicIncrement('user-id', 'age', 1);

// Decrement
await usersCollection.atomicIncrement('product-id', 'stock', -5);

// Add to balance
await usersCollection.atomicIncrement('wallet-id', 'balance', 100);
```

### Conditional Updates

```typescript
// Update only if status matches
const result = await usersCollection.conditionalUpdate(
  'order-id',
  'status',
  'pending', // Expected current value
  { status: 'processing', processingStartedAt: Date.now() }
);

if (!result) {
  console.log('Condition not met - status is not pending');
}
```

## Documentation

📚 **Complete Guides:**

- [🔍 Query & OrderBy Patterns](./docs/QUERIES.md) - Queries, pagination, multiple orderBy, search patterns
- [📦 Batch Operations](./docs/BATCH_OPERATIONS.md) - Bulk operations, imports, performance optimization
- [⚡ Real-time Subscriptions](./docs/REALTIME.md) - Live data, chat apps, presence systems
- [🔧 Undefined Value Handling](./docs/UNDEFINED_HANDLING.md) - Auto-cleanup undefined fields, delete fields on update

## Best Practices

### 1. Define Clear Interfaces

```typescript
// ✅ Good - Clear and type-safe
interface Product {
  name: string;
  price: number;
  stock: number;
  category: string;
  createdAt?: number;
  updatedAt?: number;
}

const products = new FirestoreHelper<Product>(db, 'products');
```

### 2. Use Batch Operations for Multiple Updates

```typescript
// ❌ Bad - Multiple individual calls
for (const id of userIds) {
  await usersCollection.removeDocument(id);
}

// ✅ Good - Single batch operation
await usersCollection.batchRemove(userIds);
```

### 3. Handle Errors Properly

```typescript
import { QueryValidationError } from 'ts-firestore-admin-helper';

try {
  const result = await usersCollection.findDocumentsData([
    { field: 'age', operator: '>', value: 18 },
    { field: 'status', operator: '==', value: 'active' }
  ]);
  console.log('Found users:', result.length);
} catch (error) {
  if (error instanceof QueryValidationError) {
    // Query violates Firestore constraints
    console.error('Invalid query:', error.message);
  } else if (error.message.includes('index is required')) {
    // Create Firestore index
    console.error('Missing index:', error.message);
  } else {
    // Other errors (network, permissions, etc.)
    console.error('Query failed:', error);
  }
}
```

### 4. Automatic Query Validation

The library automatically validates queries against Firestore constraints:

```typescript
import { QueryValidationError } from 'ts-firestore-admin-helper';

// ❌ This will throw QueryValidationError BEFORE hitting Firestore
try {
  await usersCollection.findDocumentsData([
    { field: 'status', operator: '!=', value: 'deleted' },
    { field: 'role', operator: '!=', value: 'admin' } // Multiple != not allowed
  ]);
} catch (error) {
  if (error instanceof QueryValidationError) {
    console.error(error.message);
    // "Cannot use multiple "!=" operators in the same query"
  }
}

// ❌ This will throw QueryValidationError
const tooManyIds = Array.from({ length: 15 }, (_, i) => `id-${i}`);
try {
  await usersCollection.findDocumentsData([
    { field: 'id', operator: 'in', value: tooManyIds } // Max 10 values
  ]);
} catch (error) {
  if (error instanceof QueryValidationError) {
    console.error(error.message);
    // "Operator "in" supports maximum 10 values, but 15 were provided"
  }
}
```

[**📚 See Query Validation Guide →**](./docs/QUERIES.md#automatic-query-validation)

### 4. Clean Up Subscriptions

```typescript
useEffect(() => {
  const unsubscribe = usersCollection.subscribeDocument('user-id', (doc) => {
    setUser(doc.data);
  });

  return () => unsubscribe(); // Cleanup on unmount
}, []);
```

### 6. Validate Before Batch Operations

```typescript
// ✅ Validate data before batch operations
const validUsers = users.filter((user) => {
  return user.email && user.name && user.age > 0;
});

await usersCollection.batchAdd(
  validUsers.map((user) => ({ data: user }))
);
```

## API Reference

### Core Methods

| Method | Description |
|--------|-------------|
| `addDocument(data, id?, override?)` | Add a new document with optional custom ID |
| `editDocument(docId, data)` | Update an existing document |
| `removeDocument(docId)` | Delete a document |
| `getDocument(docId)` | Get document snapshot |
| `getDocumentData(docId)` | Get document data with ID |

### Query Methods

| Method | Description |
|--------|-------------|
| `findDocuments(query, options?)` | Find documents matching query |
| `findDocumentsData(query, options?)` | Find documents returning data array |
| `findDocument(query)` | Find single document snapshot |
| `findDocumentData(query)` | Find single document data |
| `buildQuery(filters)` | Build Firestore query |

### Batch Methods

| Method | Description |
|--------|-------------|
| `batchAdd(documents)` | Add multiple documents (max 500) |
| `batchEdit(updates)` | Update multiple documents (max 500) |
| `batchRemove(docIds)` | Delete multiple documents (max 500) |

### Subscription Methods

| Method | Description |
|--------|-------------|
| `subscribeDocument(docId, callback)` | Subscribe to document changes |
| `subscribeCollection(callback)` | Subscribe to collection changes |
| `subscribeQuery(query, callback)` | Subscribe to query results |

### Advanced Methods

| Method | Description |
|--------|-------------|
| `atomicIncrement(docId, field, value)` | Atomic increment/decrement |
| `conditionalUpdate(docId, field, expectedValue, newData)` | Conditional update |
| `doc(docId)` | Get document reference |
| `validateConnection()` | Validate Firestore connection |

## TypeScript Support

This library is written in TypeScript and provides full type safety:

```typescript
interface Todo {
  title: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  createdAt?: number;
  updatedAt?: number;
}

const todos = new FirestoreHelper<Todo>(db, 'todos');

// ✅ Type-safe - TypeScript will validate
await todos.addDocument({
  title: 'Learn TypeScript',
  completed: false,
  priority: 'high',
});

// ❌ Type error - invalid priority value
await todos.addDocument({
  title: 'Invalid',
  completed: false,
  priority: 'urgent', // Type error!
});
```

## Error Handling

The library provides clear error messages for common issues:

- **Document Not Found**: `Document with ID {id} does not exist`
- **Duplicate ID**: `Document with ID {id} already exists`
- **Missing Index**: `Firestore index is required for this query`
- **Invalid Data**: `Document data must be a valid object`
- **Batch Limit**: `Batch size exceeds Firestore limit`

## Requirements

- Node.js >= 18
- Firebase Admin SDK
- TypeScript (recommended)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Rukanda Faridsi](https://github.com/rukandax)

## Links

- [📦 NPM Package](https://www.npmjs.com/package/ts-firestore-admin-helper)
- [💻 GitHub Repository](https://github.com/rukandax/ts-firestore-admin-helper)
- [🐛 Issue Tracker](https://github.com/rukandax/ts-firestore-admin-helper/issues)
- [📚 Documentation](./docs/)
  - [Advanced Transactions](./docs/TRANSACTIONS.md)
  - [Query & OrderBy Patterns](./docs/QUERIES.md)
  - [Batch Operations](./docs/BATCH_OPERATIONS.md)
  - [Real-time Subscriptions](./docs/REALTIME.md)
- [💡 Examples](./examples/)
  - [Custom Logger](./examples/custom-logger.ts) - Winston, Pino, Bunyan integration
  - [Query Validation](./examples/query-validation.ts) - Query patterns and validation
  - [Undefined Handling](./examples/undefined-handling.ts) - Auto-cleanup undefined fields

## Support

If you find this library helpful, please give it a ⭐️ on GitHub!

For questions and support, please [open an issue](https://github.com/rukandax/ts-firestore-admin-helper/issues).
