# 🎯 Real-World Examples & Advanced Use Cases

Complete examples for production-ready implementations using ts-firestore-admin-helper.

---

## 📋 Table of Contents

- [E-commerce Examples](#-e-commerce-examples)
- [Financial Examples](#-financial-examples)
- [Social Media Examples](#-social-media-examples)
- [Booking & Reservation Examples](#-booking--reservation-examples)
- [Collaboration Examples](#-collaboration-examples)
- [Gaming & Gamification Examples](#-gaming--gamification-examples)

---

## 🛒 E-commerce Examples

### Product Inventory Management

**Use Case**: Reserve inventory when user adds to cart, prevent overselling.

```typescript
interface Product extends BaseDocument {
  name: string;
  stock: number;
  reservedStock: number;
  price: number;
  isAvailable: boolean;
}

const productsCollection = new FirestoreHelper<Product>(db, 'products');

// Reserve inventory atomically
async function reserveProduct(productId: string, quantity: number) {
  return await productsCollection.runTransaction(async (transaction) => {
    const productRef = productsCollection.doc(productId);
    const productDoc = await transaction.get(productRef);

    if (!productDoc.exists) {
      throw new Error('Product not found');
    }

    const product = productDoc.data();
    if (!product) {
      throw new Error('Invalid product data');
    }

    const availableStock = product.stock - product.reservedStock;

    if (availableStock < quantity) {
      throw new Error(
        `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
      );
    }

    if (!product.isAvailable) {
      throw new Error('Product is not available for purchase');
    }

    transaction.update(productRef, {
      reservedStock: product.reservedStock + quantity,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      reservedQuantity: quantity,
      remainingStock: availableStock - quantity,
    };
  });
}

// Confirm purchase and reduce stock
async function confirmPurchase(productId: string, quantity: number) {
  return await productsCollection.runTransaction(async (transaction) => {
    const productRef = productsCollection.doc(productId);
    const productDoc = await transaction.get(productRef);

    if (!productDoc.exists) {
      throw new Error('Product not found');
    }

    const product = productDoc.data();
    if (!product) {
      throw new Error('Invalid product data');
    }

    if (product.reservedStock < quantity) {
      throw new Error('Insufficient reserved stock');
    }

    transaction.update(productRef, {
      stock: product.stock - quantity,
      reservedStock: product.reservedStock - quantity,
      isAvailable: product.stock - quantity > 0,
      updatedAt: Date.now(),
    });

    return { success: true, newStock: product.stock - quantity };
  });
}

// Cancel reservation
async function cancelReservation(productId: string, quantity: number) {
  await productsCollection.atomicIncrement(productId, 'reservedStock', -quantity);
}
```

### Order Processing with State Management

**Use Case**: Prevent double-processing of orders in distributed systems.

```typescript
interface Order extends BaseDocument {
  orderId: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  amount: number;
  userId: string;
  processedAt?: number;
  processedBy?: string;
}

const ordersCollection = new FirestoreHelper<Order>(db, 'orders');

async function processOrder(orderId: string, workerId: string) {
  // Try to claim the order for processing
  const result = await ordersCollection.conditionalUpdate(
    orderId,
    'status',
    'pending',
    {
      status: 'processing',
      processedAt: Date.now(),
      processedBy: workerId,
    }
  );

  if (!result) {
    console.log('Order already being processed by another worker');
    return null;
  }

  console.log(`Worker ${workerId} claimed order ${orderId}`);

  try {
    // Simulate payment processing
    // ... payment logic ...

    // Mark as completed
    await ordersCollection.editDocument(orderId, {
      status: 'completed',
    });

    return result;
  } catch (error) {
    // Mark as pending again on error
    await ordersCollection.editDocument(orderId, {
      status: 'pending',
      processedAt: undefined,
      processedBy: undefined,
    });
    throw error;
  }
}
```

---

## 💰 Financial Examples

### Wallet Balance Transfer

**Use Case**: Transfer money between wallets with full ACID guarantees.

```typescript
interface Wallet extends BaseDocument {
  userId: string;
  balance: number;
  currency: string;
  lastTransactionAt?: number;
}

const walletsCollection = new FirestoreHelper<Wallet>(db, 'wallets');

async function transferMoney(
  senderWalletId: string,
  receiverWalletId: string,
  amount: number
) {
  return await walletsCollection.runTransaction(async (transaction) => {
    const senderRef = walletsCollection.doc(senderWalletId);
    const receiverRef = walletsCollection.doc(receiverWalletId);

    // Read both wallets
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

    // Validate business rules
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

    // Atomic update of both wallets
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

// Safe balance update with validation
async function addBalance(walletId: string, amount: number) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }
  
  const result = await walletsCollection.atomicIncrement(walletId, 'balance', amount);
  console.log('New balance:', result.data.balance);
  return result;
}

async function deductBalance(walletId: string, amount: number) {
  if (amount <= 0) {
    throw new Error('Amount must be positive');
  }

  // Check balance first
  const wallet = await walletsCollection.getDocumentData(walletId);
  if (!wallet || wallet.data.balance < amount) {
    throw new Error('Insufficient balance');
  }

  const result = await walletsCollection.atomicIncrement(walletId, 'balance', -amount);
  return result;
}
```

---

## 📱 Social Media Examples

### Post Engagement Counters

**Use Case**: Track views, likes, shares without race conditions.

```typescript
interface Post extends BaseDocument {
  title: string;
  content: string;
  authorId: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
}

const postsCollection = new FirestoreHelper<Post>(db, 'posts');

// Increment view count
async function incrementViewCount(postId: string) {
  const result = await postsCollection.atomicIncrement(postId, 'views', 1);
  console.log('New view count:', result.data.views);
  return result;
}

// Like post
async function likePost(postId: string, userId: string) {
  // Check if already liked (store in separate collection)
  // ... check logic ...
  
  const result = await postsCollection.atomicIncrement(postId, 'likes', 1);
  console.log('New like count:', result.data.likes);
  return result;
}

// Unlike post
async function unlikePost(postId: string, userId: string) {
  const result = await postsCollection.atomicIncrement(postId, 'likes', -1);
  console.log('New like count:', result.data.likes);
  return result;
}

// Share post
async function sharePost(postId: string) {
  const result = await postsCollection.atomicIncrement(postId, 'shares', 1);
  return result;
}
```

---

## 🎫 Booking & Reservation Examples

### Event Seat Booking

**Use Case**: Book event seats with capacity management.

```typescript
interface Event extends BaseDocument {
  name: string;
  capacity: number;
  bookedSeats: number;
  availableSeats: number;
  startDate: number;
  venue: string;
}

const eventsCollection = new FirestoreHelper<Event>(db, 'events');

async function bookEventSeats(
  eventId: string,
  seatsRequested: number,
  userId: string
) {
  return await eventsCollection.runTransaction(async (transaction) => {
    const eventRef = eventsCollection.doc(eventId);
    const eventDoc = await transaction.get(eventRef);

    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }

    const event = eventDoc.data();
    if (!event) {
      throw new Error('Invalid event data');
    }

    // Validation
    if (event.availableSeats < seatsRequested) {
      throw new Error(
        `Not enough seats available. Requested: ${seatsRequested}, Available: ${event.availableSeats}`
      );
    }

    if (event.startDate < Date.now()) {
      throw new Error('Event has already started');
    }

    if (seatsRequested <= 0 || seatsRequested > 10) {
      throw new Error('Invalid number of seats (1-10)');
    }

    // Update seats atomically
    transaction.update(eventRef, {
      bookedSeats: event.bookedSeats + seatsRequested,
      availableSeats: event.availableSeats - seatsRequested,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      bookedSeats: seatsRequested,
      remainingSeats: event.availableSeats - seatsRequested,
      userId,
      eventName: event.name,
    };
  });
}

// Cancel booking
async function cancelBooking(eventId: string, seatsToCancel: number) {
  return await eventsCollection.runTransaction(async (transaction) => {
    const eventRef = eventsCollection.doc(eventId);
    const eventDoc = await transaction.get(eventRef);

    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }

    const event = eventDoc.data();
    if (!event) {
      throw new Error('Invalid event data');
    }

    transaction.update(eventRef, {
      bookedSeats: event.bookedSeats - seatsToCancel,
      availableSeats: event.availableSeats + seatsToCancel,
      updatedAt: Date.now(),
    });

    return { success: true };
  });
}
```

---

## 📝 Collaboration Examples

### Document Version Control

**Use Case**: Prevent conflicts in collaborative editing.

```typescript
interface Document extends BaseDocument {
  title: string;
  content: string;
  version: number;
  lastEditedBy: string;
  lastEditedAt: number;
}

const documentsCollection = new FirestoreHelper<Document>(db, 'documents');

async function updateDocumentWithVersion(
  docId: string,
  newContent: string,
  expectedVersion: number,
  userId: string
) {
  const result = await documentsCollection.conditionalUpdate(
    docId,
    'version',
    expectedVersion,
    {
      content: newContent,
      version: expectedVersion + 1,
      lastEditedBy: userId,
      lastEditedAt: Date.now(),
    }
  );

  if (!result) {
    throw new Error(
      'Document was modified by another user. Please refresh and try again.'
    );
  }

  return result;
}

// Client-side usage
async function editDocument(docId: string, newContent: string, userId: string) {
  try {
    // Get current version
    const doc = await documentsCollection.getDocumentData(docId);
    if (!doc) {
      throw new Error('Document not found');
    }

    // Try to update with version check
    const result = await updateDocumentWithVersion(
      docId,
      newContent,
      doc.data.version,
      userId
    );

    console.log('Document updated successfully');
    return result;
  } catch (error) {
    if (error.message.includes('modified by another user')) {
      console.log('Conflict detected - reloading document');
      // Reload and show conflict resolution UI
    }
    throw error;
  }
}
```

---

## 🎮 Gaming & Gamification Examples

### Loyalty Points System

**Use Case**: Award points with automatic tier upgrades.

```typescript
interface UserLoyalty extends BaseDocument {
  userId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
  tierUpgradedAt?: number;
}

const loyaltyCollection = new FirestoreHelper<UserLoyalty>(db, 'userLoyalty');

async function awardPoints(
  userId: string,
  pointsToAdd: number,
  purchaseAmount: number
) {
  return await loyaltyCollection.runTransaction(async (transaction) => {
    const userRef = loyaltyCollection.doc(userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists) {
      throw new Error('User loyalty account not found');
    }

    const userData = userDoc.data();
    if (!userData) {
      throw new Error('Invalid user data');
    }

    const newPoints = userData.points + pointsToAdd;
    const newTotalSpent = userData.totalSpent + purchaseAmount;
    let newTier = userData.tier;

    // Auto-upgrade tier based on points
    const oldTier = userData.tier;
    if (newPoints >= 10000) newTier = 'platinum';
    else if (newPoints >= 5000) newTier = 'gold';
    else if (newPoints >= 1000) newTier = 'silver';
    else newTier = 'bronze';

    const tierUpgraded = newTier !== oldTier;

    transaction.update(userRef, {
      points: newPoints,
      totalSpent: newTotalSpent,
      tier: newTier,
      tierUpgradedAt: tierUpgraded ? Date.now() : userData.tierUpgradedAt,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newPoints,
      newTier,
      tierUpgraded,
      pointsAdded: pointsToAdd,
      previousTier: oldTier,
    };
  });
}

// Redeem points
async function redeemPoints(userId: string, pointsToRedeem: number) {
  const user = await loyaltyCollection.getDocumentData(userId);
  
  if (!user || user.data.points < pointsToRedeem) {
    throw new Error('Insufficient points');
  }

  const result = await loyaltyCollection.atomicIncrement(
    userId,
    'points',
    -pointsToRedeem
  );

  return result;
}
```

### Leaderboard Management

**Use Case**: Update game scores atomically.

```typescript
interface PlayerScore extends BaseDocument {
  playerId: string;
  username: string;
  score: number;
  level: number;
  gamesPlayed: number;
  wins: number;
  losses: number;
}

const scoresCollection = new FirestoreHelper<PlayerScore>(db, 'playerScores');

async function updateScore(playerId: string, scoreToAdd: number, won: boolean) {
  return await scoresCollection.runTransaction(async (transaction) => {
    const playerRef = scoresCollection.doc(playerId);
    const playerDoc = await transaction.get(playerRef);

    if (!playerDoc.exists) {
      throw new Error('Player not found');
    }

    const player = playerDoc.data();
    if (!player) {
      throw new Error('Invalid player data');
    }

    const newScore = player.score + scoreToAdd;
    const newLevel = Math.floor(newScore / 1000) + 1;

    transaction.update(playerRef, {
      score: newScore,
      level: newLevel,
      gamesPlayed: player.gamesPlayed + 1,
      wins: won ? player.wins + 1 : player.wins,
      losses: won ? player.losses : player.losses + 1,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newScore,
      newLevel,
      leveledUp: newLevel > player.level,
    };
  });
}

// Get top players
async function getLeaderboard(limit: number = 10) {
  return await scoresCollection.findDocumentsData(
    [],
    {
      orderBy: 'score',
      orderDirection: 'desc',
      limit,
    }
  );
}
```

---

## 💡 Best Practices from Examples

### 1. Always Validate Before Transactions
```typescript
// ✅ Good: Validate first
if (amount <= 0) {
  throw new Error('Amount must be positive');
}
await transferMoney(sender, receiver, amount);

// ❌ Bad: Validate inside transaction (wastes transaction)
```

### 2. Handle Transaction Failures Gracefully
```typescript
try {
  await processOrder(orderId, workerId);
} catch (error) {
  // Rollback or compensate
  await rollbackOrder(orderId);
  throw error;
}
```

### 3. Use Optimistic Locking for State Machines
```typescript
// ✅ Good: Check state before transition
const result = await collection.conditionalUpdate(
  id,
  'status',
  'pending',
  { status: 'processing' }
);

if (!result) {
  // Handle already processed
}
```

### 4. Combine Operations When Possible
```typescript
// ✅ Good: Single transaction
await collection.runTransaction(async (tx) => {
  // Update multiple related documents
  tx.update(ref1, {...});
  tx.update(ref2, {...});
});

// ❌ Bad: Separate operations
await collection.editDocument(id1, {...});
await collection.editDocument(id2, {...}); // Race condition risk
```

---

## 🔗 Related Documentation

- [Main README](./README.md) - Getting started and basic usage
- [API Reference](./README.md#-api-reference) - Complete API documentation
- [Transaction Examples](./examples/transactions.ts) - Full TypeScript examples

---

**Need help?** [Open an issue](https://github.com/rukandax/ts-firestore-admin-helper/issues)
