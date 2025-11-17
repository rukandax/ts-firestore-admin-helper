# Batch Operations Guide

Efficient patterns for performing multiple operations atomically with validation and error handling.

## Table of Contents

- [Overview](#overview)
- [Batch Add](#batch-add)
- [Batch Update](#batch-update)
- [Batch Delete](#batch-delete)
- [Best Practices](#best-practices)
- [Performance Optimization](#performance-optimization)
- [Error Handling](#error-handling)

## Overview

Batch operations allow you to perform multiple document operations in a single transaction. This is more efficient and ensures atomicity - all operations succeed or all fail together.

### Key Features

- **Atomic**: All operations succeed or fail together
- **Efficient**: Single network round trip
- **Validated**: All documents validated before execution
- **Limited**: Maximum 500 operations per batch (Firestore limit)

### When to Use Batch Operations

✅ **Use Batches When:**
- Creating multiple documents at once
- Updating multiple related documents
- Deleting multiple documents
- All operations are independent (no read-before-write needed)

❌ **Use Transactions Instead When:**
- You need to read data before writing
- Operations depend on current document state
- Complex business logic validation required

## Batch Add

Add multiple documents in a single atomic operation.

### Basic Batch Add

```typescript
import admin from 'firebase-admin';
import FirestoreHelper from 'ts-firestore-admin-helper';

interface User {
  name: string;
  email: string;
  role: 'admin' | 'user' | 'moderator';
  createdAt?: number;
  updatedAt?: number;
}

const db = admin.firestore();
const usersCollection = new FirestoreHelper<User>(db, 'users');

// Add multiple users with auto-generated IDs
await usersCollection.batchAdd([
  {
    data: {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    }
  },
  {
    data: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'admin'
    }
  },
  {
    data: {
      name: 'Bob Wilson',
      email: 'bob@example.com',
      role: 'moderator'
    }
  }
]);
```

### Batch Add with Custom IDs

```typescript
// Add users with specific IDs
await usersCollection.batchAdd([
  {
    id: 'user-001',
    data: {
      name: 'Alice Johnson',
      email: 'alice@example.com',
      role: 'admin'
    }
  },
  {
    id: 'user-002',
    data: {
      name: 'Charlie Brown',
      email: 'charlie@example.com',
      role: 'user'
    }
  }
]);
```

### Batch Add with Override

```typescript
// Override existing documents
await usersCollection.batchAdd([
  {
    id: 'user-001',
    data: {
      name: 'Alice Johnson (Updated)',
      email: 'alice.new@example.com',
      role: 'admin'
    },
    override: true // Will update if exists
  },
  {
    id: 'user-003',
    data: {
      name: 'New User',
      email: 'new@example.com',
      role: 'user'
    }
  }
]);
```

### Bulk Import from CSV/JSON

```typescript
import { parse } from 'csv-parse/sync';
import fs from 'fs';

async function importUsersFromCSV(filePath: string) {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const records = parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  // Process in chunks of 500 (Firestore limit)
  const chunkSize = 500;
  
  for (let i = 0; i < records.length; i += chunkSize) {
    const chunk = records.slice(i, i + chunkSize);
    
    const documents = chunk.map((record: any) => ({
      data: {
        name: record.name,
        email: record.email,
        role: record.role || 'user'
      }
    }));

    await usersCollection.batchAdd(documents);
    console.log(`Imported ${Math.min(i + chunkSize, records.length)} of ${records.length} users`);
  }
}

// Usage
await importUsersFromCSV('users.csv');
```

### Import with Validation

```typescript
interface UserImport {
  name: string;
  email: string;
  role: string;
}

function validateUser(user: UserImport): user is User {
  return (
    typeof user.name === 'string' &&
    user.name.length > 0 &&
    typeof user.email === 'string' &&
    user.email.includes('@') &&
    ['admin', 'user', 'moderator'].includes(user.role)
  );
}

async function importUsersWithValidation(users: UserImport[]) {
  // Validate all users first
  const validUsers: User[] = [];
  const errors: Array<{ index: number; user: UserImport; error: string }> = [];

  users.forEach((user, index) => {
    if (validateUser(user)) {
      validUsers.push(user as User);
    } else {
      errors.push({
        index,
        user,
        error: 'Invalid user data'
      });
    }
  });

  // Report errors
  if (errors.length > 0) {
    console.error(`Found ${errors.length} invalid users:`, errors);
  }

  // Import valid users in chunks
  const chunkSize = 500;
  let imported = 0;

  for (let i = 0; i < validUsers.length; i += chunkSize) {
    const chunk = validUsers.slice(i, i + chunkSize);
    await usersCollection.batchAdd(chunk.map(data => ({ data })));
    imported += chunk.length;
    console.log(`Imported ${imported} of ${validUsers.length} valid users`);
  }

  return {
    imported,
    errors: errors.length,
    total: users.length
  };
}
```

## Batch Update

Update multiple documents at once.

### Basic Batch Update

```typescript
// Update multiple users
await usersCollection.batchEdit([
  {
    id: 'user-001',
    data: { role: 'admin' }
  },
  {
    id: 'user-002',
    data: { role: 'moderator' }
  },
  {
    id: 'user-003',
    data: { role: 'user' }
  }
]);
```

### Batch Update with Dynamic Data

```typescript
interface Product {
  name: string;
  price: number;
  discount: number;
  finalPrice?: number;
  createdAt?: number;
  updatedAt?: number;
}

const productsCollection = new FirestoreHelper<Product>(db, 'products');

async function applyDiscountToProducts(productIds: string[], discountPercent: number) {
  // First, fetch all products
  const products = await Promise.all(
    productIds.map(id => productsCollection.getDocumentData(id))
  );

  // Calculate new prices
  const updates = products
    .filter(p => p !== null)
    .map(p => ({
      id: p!.id,
      data: {
        discount: discountPercent,
        finalPrice: p!.data.price * (1 - discountPercent / 100)
      }
    }));

  // Apply updates
  await productsCollection.batchEdit(updates);
  
  return {
    updated: updates.length,
    failed: productIds.length - updates.length
  };
}

// Usage
await applyDiscountToProducts(
  ['product-1', 'product-2', 'product-3'],
  20 // 20% discount
);
```

### Batch Status Updates

```typescript
interface Order {
  userId: string;
  items: any[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt?: number;
  updatedAt?: number;
}

const ordersCollection = new FirestoreHelper<Order>(db, 'orders');

async function bulkUpdateOrderStatus(
  orderIds: string[],
  newStatus: Order['status']
) {
  const updates = orderIds.map(id => ({
    id,
    data: { status: newStatus }
  }));

  // Process in chunks of 500
  const chunkSize = 500;
  
  for (let i = 0; i < updates.length; i += chunkSize) {
    const chunk = updates.slice(i, i + chunkSize);
    await ordersCollection.batchEdit(chunk);
    console.log(`Updated ${Math.min(i + chunkSize, updates.length)} of ${updates.length} orders`);
  }
}

// Mark all pending orders as processing
const pendingOrders = await ordersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'pending' }
]);

await bulkUpdateOrderStatus(
  pendingOrders.map(o => o.id),
  'processing'
);
```

## Batch Delete

Delete multiple documents efficiently.

### Basic Batch Delete

```typescript
// Delete multiple users
await usersCollection.batchRemove([
  'user-001',
  'user-002',
  'user-003'
]);
```

### Conditional Batch Delete

```typescript
async function deleteInactiveUsers(inactiveDays: number) {
  const cutoffDate = Date.now() - inactiveDays * 24 * 60 * 60 * 1000;

  // Find inactive users
  const inactiveUsers = await usersCollection.findDocumentsData([
    { field: 'updatedAt', operator: '<', value: cutoffDate }
  ]);

  if (inactiveUsers.length === 0) {
    console.log('No inactive users found');
    return;
  }

  const userIds = inactiveUsers.map(u => u.id);
  
  // Delete in chunks of 500
  const chunkSize = 500;
  let deleted = 0;

  for (let i = 0; i < userIds.length; i += chunkSize) {
    const chunk = userIds.slice(i, i + chunkSize);
    await usersCollection.batchRemove(chunk);
    deleted += chunk.length;
    console.log(`Deleted ${deleted} of ${userIds.length} inactive users`);
  }

  return {
    deleted,
    total: userIds.length
  };
}

// Delete users inactive for 90 days
await deleteInactiveUsers(90);
```

### Soft Delete Pattern

```typescript
interface SoftDeletableUser extends User {
  deleted: boolean;
  deletedAt?: number;
}

const softUsersCollection = new FirestoreHelper<SoftDeletableUser>(db, 'users');

async function softDeleteUsers(userIds: string[]) {
  const updates = userIds.map(id => ({
    id,
    data: {
      deleted: true,
      deletedAt: Date.now()
    }
  }));

  await softUsersCollection.batchEdit(updates);
}

// Later, permanently delete soft-deleted users
async function permanentlyDeleteSoftDeleted(daysOld: number) {
  const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  const toDelete = await softUsersCollection.findDocumentsData([
    { field: 'deleted', operator: '==', value: true },
    { field: 'deletedAt', operator: '<', value: cutoffDate }
  ]);

  const ids = toDelete.map(u => u.id);
  
  const chunkSize = 500;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    await softUsersCollection.batchRemove(chunk);
  }

  return { deleted: ids.length };
}
```

## Best Practices

### 1. Always Process in Chunks

```typescript
async function processBatch<T extends { createdAt?: number; updatedAt?: number }>(
  collection: FirestoreHelper<T>,
  items: Array<{ id?: string; data: T }>,
  operation: 'add' | 'edit' | 'delete'
) {
  const chunkSize = 500;
  const results = {
    processed: 0,
    failed: 0,
    errors: [] as Error[]
  };

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    try {
      if (operation === 'add') {
        await collection.batchAdd(chunk);
      } else if (operation === 'edit') {
        await collection.batchEdit(
          chunk.map(item => ({
            id: item.id!,
            data: item.data
          }))
        );
      } else if (operation === 'delete') {
        await collection.batchRemove(chunk.map(item => item.id!));
      }

      results.processed += chunk.length;
      console.log(`Processed ${results.processed} of ${items.length}`);
    } catch (error) {
      results.failed += chunk.length;
      results.errors.push(error as Error);
      console.error(`Chunk ${i / chunkSize + 1} failed:`, error);
    }
  }

  return results;
}
```

### 2. Validate Before Batching

```typescript
// ❌ Bad - No validation
await usersCollection.batchAdd(untrustedData);

// ✅ Good - Validate first
const validated = untrustedData.filter(item => {
  return (
    item.data.name &&
    item.data.email &&
    item.data.role
  );
});

await usersCollection.batchAdd(validated);
```

### 3. Log Progress for Large Operations

```typescript
async function batchOperationWithProgress<T extends { createdAt?: number; updatedAt?: number }>(
  collection: FirestoreHelper<T>,
  items: any[],
  operation: (chunk: any[]) => Promise<void>,
  chunkSize: number = 500
) {
  const totalChunks = Math.ceil(items.length / chunkSize);
  const startTime = Date.now();

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunkIndex = Math.floor(i / chunkSize) + 1;
    const chunk = items.slice(i, i + chunkSize);

    await operation(chunk);

    const processed = Math.min(i + chunkSize, items.length);
    const progress = (processed / items.length) * 100;
    const elapsed = Date.now() - startTime;
    const estimatedTotal = (elapsed / processed) * items.length;
    const remaining = estimatedTotal - elapsed;

    console.log(
      `Progress: ${progress.toFixed(2)}% ` +
      `(${processed}/${items.length}) ` +
      `Chunk ${chunkIndex}/${totalChunks} ` +
      `Elapsed: ${(elapsed / 1000).toFixed(2)}s ` +
      `ETA: ${(remaining / 1000).toFixed(2)}s`
    );
  }

  console.log(`Completed in ${((Date.now() - startTime) / 1000).toFixed(2)}s`);
}

// Usage
await batchOperationWithProgress(
  usersCollection,
  largeUserArray,
  async (chunk) => {
    await usersCollection.batchAdd(chunk.map(data => ({ data })));
  }
);
```

## Performance Optimization

### Parallel Batch Processing

```typescript
async function parallelBatchAdd<T extends { createdAt?: number; updatedAt?: number }>(
  collection: FirestoreHelper<T>,
  items: Array<{ data: T }>,
  concurrency: number = 5
) {
  const chunkSize = 500;
  const chunks: Array<Array<{ data: T }>> = [];

  // Split into chunks
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }

  // Process chunks in parallel with concurrency limit
  const results = [];
  for (let i = 0; i < chunks.length; i += concurrency) {
    const batch = chunks.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(chunk => collection.batchAdd(chunk))
    );
    results.push(...batchResults);
    
    console.log(`Processed ${Math.min(i + concurrency, chunks.length)} of ${chunks.length} chunks`);
  }

  const succeeded = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;

  return { succeeded, failed, total: chunks.length };
}

// Process 10,000 items with 5 concurrent batches
const result = await parallelBatchAdd(usersCollection, largeArray, 5);
console.log(`Success: ${result.succeeded}, Failed: ${result.failed}`);
```

### Batch with Queue

```typescript
class BatchQueue<T extends { createdAt?: number; updatedAt?: number }> {
  private queue: Array<{ id?: string; data: T }> = [];
  private processing = false;

  constructor(
    private collection: FirestoreHelper<T>,
    private batchSize: number = 500,
    private autoFlushInterval?: number
  ) {
    if (autoFlushInterval) {
      setInterval(() => this.flush(), autoFlushInterval);
    }
  }

  async add(item: { id?: string; data: T }) {
    this.queue.push(item);
    
    if (this.queue.length >= this.batchSize) {
      await this.flush();
    }
  }

  async flush() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const items = this.queue.splice(0, this.batchSize);

    try {
      await this.collection.batchAdd(items);
      console.log(`Flushed ${items.length} items`);
    } catch (error) {
      console.error('Flush failed:', error);
      // Re-queue failed items
      this.queue.unshift(...items);
    } finally {
      this.processing = false;
    }
  }

  async close() {
    await this.flush();
  }

  getQueueLength() {
    return this.queue.length;
  }
}

// Usage
const queue = new BatchQueue(usersCollection, 500, 5000); // Auto-flush every 5s

for (let i = 0; i < 10000; i++) {
  await queue.add({
    data: {
      name: `User ${i}`,
      email: `user${i}@example.com`,
      role: 'user'
    }
  });
}

await queue.close(); // Ensure all items are flushed
```

## Error Handling

### Comprehensive Error Handling

```typescript
async function safeBatchOperation<T extends { createdAt?: number; updatedAt?: number }>(
  collection: FirestoreHelper<T>,
  items: any[],
  operation: 'add' | 'edit' | 'delete'
) {
  const results = {
    success: [] as string[],
    failed: [] as Array<{ item: any; error: string }>,
    total: items.length
  };

  const chunkSize = 500;

  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);

    try {
      if (operation === 'add') {
        await collection.batchAdd(chunk);
        results.success.push(...chunk.map((_, idx) => `item-${i + idx}`));
      } else if (operation === 'edit') {
        await collection.batchEdit(chunk);
        results.success.push(...chunk.map(c => c.id));
      } else if (operation === 'delete') {
        await collection.batchRemove(chunk);
        results.success.push(...chunk);
      }
    } catch (error) {
      chunk.forEach(item => {
        results.failed.push({
          item,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      });
    }
  }

  return results;
}

// Usage with error reporting
const result = await safeBatchOperation(usersCollection, userData, 'add');
console.log(`Success: ${result.success.length}, Failed: ${result.failed.length}`);

if (result.failed.length > 0) {
  console.error('Failed items:', result.failed);
  // Optionally save failed items to a file
  fs.writeFileSync(
    'failed-imports.json',
    JSON.stringify(result.failed, null, 2)
  );
}
```

## Related Resources

- [Main README](../README.md)
- [Transactions](./TRANSACTIONS.md)
- [Query Examples](./QUERIES.md)

---

[← Back to Documentation](../README.md#links)
