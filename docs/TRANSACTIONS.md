# Advanced Transaction Examples

This guide covers advanced transaction patterns for critical operations that require atomicity and consistency.

## Table of Contents

- [Overview](#overview)
- [When to Use Transactions](#when-to-use-transactions)
- [Wallet Balance Transfer](#wallet-balance-transfer)
- [E-commerce Inventory Management](#e-commerce-inventory-management)
- [Seat Reservation System](#seat-reservation-system)
- [Document Counter with Rollback](#document-counter-with-rollback)
- [Best Practices](#best-practices)

## Overview

Transactions ensure that a set of operations either all succeed or all fail together. This is crucial for:

- Financial operations (transfers, payments)
- Inventory management (stock updates, reservations)
- Counter updates (likes, views, downloads)
- State transitions (order status, booking status)

## When to Use Transactions

✅ **Use Transactions When:**
- Multiple documents must be updated atomically
- You need to read-before-write with consistency guarantees
- Business logic requires validation based on current state
- Failure of one operation should rollback all changes

❌ **Don't Use Transactions When:**
- Simple single-document operations (use `editDocument` instead)
- Reading data only (use `getDocument` or `findDocument`)
- Operations don't need atomicity

## Wallet Balance Transfer

Transfer money between two wallets atomically with validation.

```typescript
import admin from 'firebase-admin';
import FirestoreHelper from 'ts-firestore-admin-helper';

interface Wallet {
  userId: string;
  balance: number;
  currency: string;
  lastTransactionAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

const db = admin.firestore();
const walletsCollection = new FirestoreHelper<Wallet>(db, 'wallets');

async function transferMoney(
  senderWalletId: string,
  receiverWalletId: string,
  amount: number
) {
  return await walletsCollection.runTransaction(async (transaction) => {
    // Get document references
    const senderRef = walletsCollection.doc(senderWalletId);
    const receiverRef = walletsCollection.doc(receiverWalletId);

    // Read both wallets
    const senderDoc = await transaction.get(senderRef);
    const receiverDoc = await transaction.get(receiverRef);

    // Validate documents exist
    if (!senderDoc.exists || !receiverDoc.exists) {
      throw new Error('Wallet not found');
    }

    const senderData = senderDoc.data();
    const receiverData = receiverDoc.data();

    if (!senderData || !receiverData) {
      throw new Error('Invalid wallet data');
    }

    // Business logic validation
    if (senderData.balance < amount) {
      throw new Error(
        `Insufficient balance. Available: ${senderData.balance}, Required: ${amount}`
      );
    }

    if (senderData.currency !== receiverData.currency) {
      throw new Error(
        `Currency mismatch. Sender: ${senderData.currency}, Receiver: ${receiverData.currency}`
      );
    }

    if (amount <= 0) {
      throw new Error('Transfer amount must be positive');
    }

    // Atomic updates - both succeed or both fail
    transaction.update(senderRef, {
      balance: senderData.balance - amount,
      lastTransactionAt: Date.now(),
      updatedAt: Date.now(),
    });

    transaction.update(receiverRef, {
      balance: receiverData.balance + amount,
      lastTransactionAt: Date.now(),
      updatedAt: Date.now(),
    });

    return {
      success: true,
      amount,
      senderNewBalance: senderData.balance - amount,
      receiverNewBalance: receiverData.balance + amount,
    };
  });
}

// Usage
try {
  const result = await transferMoney('wallet-1', 'wallet-2', 50);
  console.log('Transfer successful:', result);
} catch (error) {
  console.error('Transfer failed:', error.message);
}
```

## E-commerce Inventory Management

Manage product stock during order placement with automatic rollback on failure.

```typescript
interface Product {
  name: string;
  price: number;
  stock: number;
  reserved: number;
  createdAt?: number;
  updatedAt?: number;
}

interface Order {
  userId: string;
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt?: number;
  updatedAt?: number;
}

const productsCollection = new FirestoreHelper<Product>(db, 'products');
const ordersCollection = new FirestoreHelper<Order>(db, 'orders');

async function placeOrder(
  userId: string,
  items: Array<{ productId: string; quantity: number }>
) {
  return await db.runTransaction(async (transaction) => {
    const productDocs: Map<string, admin.firestore.DocumentSnapshot<Product>> = new Map();
    let totalPrice = 0;

    // Phase 1: Read all products and validate stock
    for (const item of items) {
      const productRef = productsCollection.doc(item.productId);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) {
        throw new Error(`Product ${item.productId} not found`);
      }

      const productData = productDoc.data();
      if (!productData) {
        throw new Error(`Product ${item.productId} has no data`);
      }

      const availableStock = productData.stock - productData.reserved;
      if (availableStock < item.quantity) {
        throw new Error(
          `Insufficient stock for ${productData.name}. Available: ${availableStock}, Requested: ${item.quantity}`
        );
      }

      productDocs.set(item.productId, productDoc);
      totalPrice += productData.price * item.quantity;
    }

    // Phase 2: Reserve stock for all products
    for (const item of items) {
      const productDoc = productDocs.get(item.productId);
      if (!productDoc) continue;

      const productRef = productsCollection.doc(item.productId);
      const productData = productDoc.data();
      if (!productData) continue;

      transaction.update(productRef, {
        reserved: productData.reserved + item.quantity,
        updatedAt: Date.now(),
      });
    }

    // Phase 3: Create order
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const orderRef = ordersCollection.doc(orderId);

    const orderData: Order = {
      userId,
      items: items.map((item) => {
        const productDoc = productDocs.get(item.productId);
        const productData = productDoc?.data();
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: productData?.price || 0,
        };
      }),
      total: totalPrice,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    transaction.set(orderRef, orderData);

    return {
      orderId,
      total: totalPrice,
      items: items.length,
    };
  });
}

// Confirm order and deduct from stock
async function confirmOrder(orderId: string) {
  const orderDoc = await ordersCollection.getDocumentData(orderId);
  if (!orderDoc) {
    throw new Error('Order not found');
  }

  return await db.runTransaction(async (transaction) => {
    const orderRef = ordersCollection.doc(orderId);
    const currentOrder = await transaction.get(orderRef);

    if (!currentOrder.exists) {
      throw new Error('Order not found');
    }

    const orderData = currentOrder.data();
    if (!orderData) {
      throw new Error('Order has no data');
    }

    if (orderData.status !== 'pending') {
      throw new Error(`Order is already ${orderData.status}`);
    }

    // Deduct stock and remove reservation
    for (const item of orderData.items) {
      const productRef = productsCollection.doc(item.productId);
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) continue;

      const productData = productDoc.data();
      if (!productData) continue;

      transaction.update(productRef, {
        stock: productData.stock - item.quantity,
        reserved: productData.reserved - item.quantity,
        updatedAt: Date.now(),
      });
    }

    // Update order status
    transaction.update(orderRef, {
      status: 'confirmed',
      updatedAt: Date.now(),
    });

    return { success: true, orderId };
  });
}

// Usage
try {
  // Place order
  const order = await placeOrder('user-123', [
    { productId: 'product-1', quantity: 2 },
    { productId: 'product-2', quantity: 1 },
  ]);
  console.log('Order placed:', order);

  // Confirm order
  const confirmation = await confirmOrder(order.orderId);
  console.log('Order confirmed:', confirmation);
} catch (error) {
  console.error('Order failed:', error.message);
}
```

## Seat Reservation System

Handle concurrent seat bookings with race condition prevention.

```typescript
interface Seat {
  seatNumber: string;
  row: string;
  status: 'available' | 'reserved' | 'booked';
  reservedBy?: string;
  reservedAt?: number;
  expiresAt?: number;
  createdAt?: number;
  updatedAt?: number;
}

const seatsCollection = new FirestoreHelper<Seat>(db, 'seats');

async function reserveSeat(
  seatId: string,
  userId: string,
  durationMinutes: number = 10
) {
  return await seatsCollection.runTransaction(async (transaction) => {
    const seatRef = seatsCollection.doc(seatId);
    const seatDoc = await transaction.get(seatRef);

    if (!seatDoc.exists) {
      throw new Error('Seat not found');
    }

    const seatData = seatDoc.data();
    if (!seatData) {
      throw new Error('Seat has no data');
    }

    // Check if seat is available
    if (seatData.status === 'booked') {
      throw new Error('Seat is already booked');
    }

    if (seatData.status === 'reserved') {
      // Check if reservation expired
      const now = Date.now();
      if (seatData.expiresAt && seatData.expiresAt > now) {
        throw new Error(
          `Seat is reserved by another user until ${new Date(seatData.expiresAt).toISOString()}`
        );
      }
    }

    // Reserve the seat
    const now = Date.now();
    const expiresAt = now + durationMinutes * 60 * 1000;

    transaction.update(seatRef, {
      status: 'reserved',
      reservedBy: userId,
      reservedAt: now,
      expiresAt: expiresAt,
      updatedAt: now,
    });

    return {
      success: true,
      seatId,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  });
}

async function confirmBooking(seatId: string, userId: string) {
  return await seatsCollection.runTransaction(async (transaction) => {
    const seatRef = seatsCollection.doc(seatId);
    const seatDoc = await transaction.get(seatRef);

    if (!seatDoc.exists) {
      throw new Error('Seat not found');
    }

    const seatData = seatDoc.data();
    if (!seatData) {
      throw new Error('Seat has no data');
    }

    // Validate reservation
    if (seatData.status !== 'reserved') {
      throw new Error('Seat is not reserved');
    }

    if (seatData.reservedBy !== userId) {
      throw new Error('Seat is reserved by another user');
    }

    const now = Date.now();
    if (seatData.expiresAt && seatData.expiresAt < now) {
      throw new Error('Reservation has expired');
    }

    // Confirm booking
    transaction.update(seatRef, {
      status: 'booked',
      expiresAt: admin.firestore.FieldValue.delete(),
      updatedAt: now,
    });

    return { success: true, seatId };
  });
}

// Usage
try {
  // Reserve seat
  const reservation = await reserveSeat('seat-A1', 'user-123', 10);
  console.log('Seat reserved:', reservation);

  // Confirm booking
  const booking = await confirmBooking('seat-A1', 'user-123');
  console.log('Booking confirmed:', booking);
} catch (error) {
  console.error('Reservation failed:', error.message);
}
```

## Document Counter with Rollback

Implement a distributed counter with automatic rollback on failure.

```typescript
interface Counter {
  value: number;
  lastUpdatedBy?: string;
  createdAt?: number;
  updatedAt?: number;
}

interface AuditLog {
  counterId: string;
  operation: 'increment' | 'decrement';
  previousValue: number;
  newValue: number;
  userId: string;
  createdAt?: number;
}

const countersCollection = new FirestoreHelper<Counter>(db, 'counters');
const auditLogsCollection = new FirestoreHelper<AuditLog>(db, 'auditLogs');

async function updateCounterWithAudit(
  counterId: string,
  change: number,
  userId: string
) {
  return await db.runTransaction(async (transaction) => {
    // Read counter
    const counterRef = countersCollection.doc(counterId);
    const counterDoc = await transaction.get(counterRef);

    if (!counterDoc.exists) {
      throw new Error('Counter not found');
    }

    const counterData = counterDoc.data();
    if (!counterData) {
      throw new Error('Counter has no data');
    }

    const previousValue = counterData.value;
    const newValue = previousValue + change;

    // Validate new value
    if (newValue < 0) {
      throw new Error('Counter cannot be negative');
    }

    // Update counter
    transaction.update(counterRef, {
      value: newValue,
      lastUpdatedBy: userId,
      updatedAt: Date.now(),
    });

    // Create audit log
    const auditLogId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const auditLogRef = auditLogsCollection.doc(auditLogId);

    transaction.set(auditLogRef, {
      counterId,
      operation: change > 0 ? 'increment' : 'decrement',
      previousValue,
      newValue,
      userId,
      createdAt: Date.now(),
    });

    return {
      success: true,
      previousValue,
      newValue,
      change,
    };
  });
}

// Usage
try {
  const result = await updateCounterWithAudit('counter-1', 5, 'user-123');
  console.log('Counter updated:', result);
} catch (error) {
  console.error('Counter update failed:', error.message);
  // Transaction automatically rolled back - both counter and audit log
}
```

## Best Practices

### 1. Read First, Write Last

```typescript
// ✅ Good - Read all documents first, then write
await collection.runTransaction(async (transaction) => {
  const doc1 = await transaction.get(ref1);
  const doc2 = await transaction.get(ref2);
  const doc3 = await transaction.get(ref3);

  // Validate all data
  // ...

  // Then perform all writes
  transaction.update(ref1, data1);
  transaction.update(ref2, data2);
  transaction.update(ref3, data3);
});
```

### 2. Validate Before Writing

```typescript
// ✅ Validate all business rules before any writes
await collection.runTransaction(async (transaction) => {
  const docs = await Promise.all(refs.map(ref => transaction.get(ref)));

  // Validate everything first
  for (const doc of docs) {
    if (!doc.exists) throw new Error('Document not found');
    // More validations...
  }

  // Only write if all validations pass
  docs.forEach((doc, i) => {
    transaction.update(refs[i], updates[i]);
  });
});
```

### 3. Keep Transactions Short

```typescript
// ❌ Bad - Transaction doing too much
await collection.runTransaction(async (transaction) => {
  // Complex calculations
  const result = await expensiveOperation();
  
  // API calls (don't do this!)
  await fetch('https://api.example.com/...');
  
  // File operations (don't do this!)
  await fs.writeFile('...', '...');
  
  transaction.update(ref, data);
});

// ✅ Good - Prepare data outside, transaction only for DB operations
const result = await expensiveOperation();
const apiData = await fetch('https://api.example.com/...');

await collection.runTransaction(async (transaction) => {
  const doc = await transaction.get(ref);
  transaction.update(ref, { ...result, ...apiData });
});
```

### 4. Handle Transaction Retries

```typescript
// Firestore automatically retries transactions on contention
// Design your transactions to be idempotent when possible

const maxRetries = 3;
let attempts = 0;

async function executeWithRetry() {
  try {
    return await collection.runTransaction(async (transaction) => {
      attempts++;
      console.log(`Transaction attempt ${attempts}`);
      
      // Your transaction logic
      // ...
    });
  } catch (error) {
    if (attempts < maxRetries && error.message.includes('contention')) {
      await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
      return executeWithRetry();
    }
    throw error;
  }
}
```

### 5. Use Appropriate Transaction Scope

```typescript
// ✅ Good - Use helper methods for simple operations
await collection.atomicIncrement('doc-id', 'views', 1);

// ✅ Good - Use transactions for complex multi-step operations
await collection.runTransaction(async (transaction) => {
  // Multiple related operations
});

// ❌ Bad - Don't use transactions for simple single-document updates
await collection.runTransaction(async (transaction) => {
  const ref = collection.doc('doc-id');
  transaction.update(ref, { views: views + 1 });
});
```

## Error Handling

Common transaction errors and how to handle them:

```typescript
try {
  await collection.runTransaction(async (transaction) => {
    // Transaction logic
  });
} catch (error) {
  if (error.message.includes('not found')) {
    // Handle missing document
  } else if (error.message.includes('already exists')) {
    // Handle duplicate
  } else if (error.message.includes('contention')) {
    // Transaction was retried and failed
    // Firestore already retried, this is final failure
  } else {
    // Handle other errors
  }
}
```

## Related Resources

- [Main README](../README.md)
- [Query Examples](./QUERIES.md)
- [Batch Operations](./BATCH_OPERATIONS.md)

---

[← Back to Documentation](../README.md#links)
