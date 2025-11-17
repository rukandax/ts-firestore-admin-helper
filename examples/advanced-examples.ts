/**
 * Advanced Examples - TypeScript Firestore Admin Helper
 *
 * This file contains comprehensive examples including:
 * - Custom Transactions (wallet transfers, inventory, reservations)
 * - Multiple OrderBy queries (e-commerce, social media, employee directory)
 * - Complex query patterns
 * - Real-world use cases
 */

import admin from 'firebase-admin';
import FirestoreHelper, {BaseDocument} from '../src/index';

// Initialize Firebase Admin (replace with your config)
// admin.initializeApp({ ... });
const db = admin.firestore();

// ============================================
// PART 1: TRANSACTION EXAMPLES
// ============================================

interface Wallet extends BaseDocument {
  userId: string;
  balance: number;
  currency: string;
  lastTransactionAt?: number;
}

// Example 1: Wallet Balance Transfer
// ============================================

const walletsCollection = new FirestoreHelper<Wallet>(db, 'wallets');

async function transferMoney(
  senderWalletId: string,
  receiverWalletId: string,
  amount: number
) {
  try {
    return await walletsCollection.runTransaction(async transaction => {
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
  } catch (error) {
    if (error instanceof Error) {
      console.error('Transfer failed:', error.message);
      throw error;
    }
    throw new Error('Unknown error occurred during transfer');
  }
}

// ============================================
// Example 2: E-commerce Inventory Management
// ============================================

interface Product extends BaseDocument {
  name: string;
  stock: number;
  reservedStock: number;
  price: number;
  isAvailable: boolean;
}

const productsCollection = new FirestoreHelper<Product>(db, 'products');

async function reserveProduct(productId: string, quantity: number) {
  return await productsCollection.runTransaction(async transaction => {
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

async function confirmPurchase(productId: string, quantity: number) {
  return await productsCollection.runTransaction(async transaction => {
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

    return {success: true, newStock: product.stock - quantity};
  });
}

// ============================================
// Example 3: Atomic Increment for Counters
// ============================================

interface Post extends BaseDocument {
  title: string;
  content: string;
  views: number;
  likes: number;
  shares: number;
}

const postsCollection = new FirestoreHelper<Post>(db, 'posts');

async function incrementViewCount(postId: string) {
  const result = await postsCollection.atomicIncrement(postId, 'views', 1);
  console.log('New view count:', result.data.views);
  return result;
}

async function likePost(postId: string) {
  const result = await postsCollection.atomicIncrement(postId, 'likes', 1);
  console.log('New like count:', result.data.likes);
  return result;
}

async function unlikePost(postId: string) {
  const result = await postsCollection.atomicIncrement(postId, 'likes', -1);
  console.log('New like count:', result.data.likes);
  return result;
}

// ============================================
// Example 4: Optimistic Locking for Orders
// ============================================

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
    console.log(
      'Order already being processed by another worker or not in pending state'
    );
    return null;
  }

  console.log(`Worker ${workerId} claimed order ${orderId}`);

  // Simulate processing
  // ... do payment, send email, etc ...

  // Mark as completed
  await ordersCollection.editDocument(orderId, {
    status: 'completed',
  });

  return result;
}

// ============================================
// Example 5: Event Booking with Capacity
// ============================================

interface Event extends BaseDocument {
  name: string;
  capacity: number;
  bookedSeats: number;
  availableSeats: number;
  startDate: number;
}

const eventsCollection = new FirestoreHelper<Event>(db, 'events');

async function bookEventSeats(
  eventId: string,
  seatsRequested: number,
  userId: string
) {
  return await eventsCollection.runTransaction(async transaction => {
    const eventRef = eventsCollection.doc(eventId);
    const eventDoc = await transaction.get(eventRef);

    if (!eventDoc.exists) {
      throw new Error('Event not found');
    }

    const event = eventDoc.data();

    if (!event) {
      throw new Error('Invalid event data');
    }

    if (event.availableSeats < seatsRequested) {
      throw new Error(
        `Not enough seats available. Requested: ${seatsRequested}, Available: ${event.availableSeats}`
      );
    }

    if (event.startDate < Date.now()) {
      throw new Error('Event has already started');
    }

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
    };
  });
}

// ============================================
// Example 6: Version-based Collaborative Editing
// ============================================

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

// ============================================
// Example 7: Loyalty Points with Tier Upgrade
// ============================================

interface UserLoyalty extends BaseDocument {
  userId: string;
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalSpent: number;
}

const loyaltyCollection = new FirestoreHelper<UserLoyalty>(db, 'userLoyalty');

async function awardPoints(
  userId: string,
  pointsToAdd: number,
  purchaseAmount: number
) {
  return await loyaltyCollection.runTransaction(async transaction => {
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
    if (newPoints >= 10000) newTier = 'platinum';
    else if (newPoints >= 5000) newTier = 'gold';
    else if (newPoints >= 1000) newTier = 'silver';
    else newTier = 'bronze';

    const tierUpgraded = newTier !== userData.tier;

    transaction.update(userRef, {
      points: newPoints,
      totalSpent: newTotalSpent,
      tier: newTier,
      updatedAt: Date.now(),
    });

    return {
      success: true,
      newPoints,
      newTier,
      tierUpgraded,
      pointsAdded: pointsToAdd,
    };
  });
}

// ============================================
// Usage Examples
// ============================================

async function runExamples() {
  try {
    // Example 1: Transfer money
    console.log('Example 1: Wallet Transfer');
    const transferResult = await transferMoney('wallet-1', 'wallet-2', 100);
    console.log('Transfer result:', transferResult);

    // Example 2: Reserve product
    console.log('\nExample 2: Product Reservation');
    const reserveResult = await reserveProduct('product-123', 5);
    console.log('Reserve result:', reserveResult);

    // Example 3: Increment view count
    console.log('\nExample 3: Increment Views');
    await incrementViewCount('post-456');

    // Example 4: Process order
    console.log('\nExample 4: Process Order');
    const orderResult = await processOrder('order-789', 'worker-1');
    console.log('Order result:', orderResult);

    // Example 5: Book event
    console.log('\nExample 5: Book Event');
    const bookingResult = await bookEventSeats('event-101', 3, 'user-abc');
    console.log('Booking result:', bookingResult);

    // Example 6: Update document
    console.log('\nExample 6: Version-based Update');
    const doc = await documentsCollection.getDocumentData('doc-202');
    if (doc) {
      const updateResult = await updateDocumentWithVersion(
        'doc-202',
        'New content',
        doc.data.version,
        'user-xyz'
      );
      console.log('Update result:', updateResult);
    }

    // Example 7: Award loyalty points
    console.log('\nExample 7: Loyalty Points');
    const loyaltyResult = await awardPoints('user-303', 500, 250);
    console.log('Loyalty result:', loyaltyResult);
  } catch (error) {
    console.error('Error:', error);
  }
}

export {
  transferMoney,
  reserveProduct,
  confirmPurchase,
  incrementViewCount,
  likePost,
  unlikePost,
  processOrder,
  bookEventSeats,
  updateDocumentWithVersion,
  awardPoints,
  runExamples,
};

// ============================================
// PART 2: MULTIPLE ORDERBY QUERY EXAMPLES
// ============================================

// E-commerce Product Sorting
interface ProductItem {
  name: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  featured: boolean;
  createdAt?: number;
  updatedAt?: number;
}

const productsStore = new FirestoreHelper<ProductItem>(db, 'products');

// Get best deals - sorted by rating (high to low), then price (low to high)
export async function getBestDeals() {
  const results = await productsStore.findDocumentsData(
    [{field: 'stock', operator: '>', value: 0}],
    {
      orderBy: [
        {field: 'rating', direction: 'desc'},
        {field: 'price', direction: 'asc'},
      ],
      limit: 20,
    }
  );

  console.log('Best rated, cheapest products:');
  results.forEach(p => {
    console.log(
      `${p.data.name} - Rating: ${p.data.rating}, Price: $${p.data.price}`
    );
  });
  return results;
}

// Get products by category with featured items first
export async function getProductsByCategory(category: string) {
  const results = await productsStore.findDocumentsData(
    [{field: 'category', operator: '==', value: category}],
    {
      orderBy: [
        {field: 'featured', direction: 'desc'},
        {field: 'rating', direction: 'desc'},
        {field: 'price', direction: 'asc'},
      ],
      limit: 50,
    }
  );

  console.log(`Products in ${category}:`);
  results.forEach(p => {
    const badge = p.data.featured ? '[FEATURED]' : '';
    console.log(
      `${badge} ${p.data.name} - $${p.data.price} (${p.data.rating}★)`
    );
  });
  return results;
}

// Social Media Feed
interface FeedPost {
  authorId: string;
  authorName: string;
  content: string;
  likes: number;
  comments: number;
  isPinned: boolean;
  createdAt?: number;
  updatedAt?: number;
}

const feedCollection = new FirestoreHelper<FeedPost>(db, 'posts');

// Get feed with pinned posts first, then by date
export async function getFeedPosts() {
  const results = await feedCollection.findDocumentsData([], {
    orderBy: [
      {field: 'isPinned', direction: 'desc'},
      {field: 'createdAt', direction: 'desc'},
    ],
    limit: 50,
  });

  console.log('Feed:');
  results.forEach(p => {
    const pin = p.data.isPinned ? '📌 ' : '';
    const engagement = p.data.likes + p.data.comments;
    console.log(
      `${pin}${p.data.authorName}: ${p.data.content.substring(0, 50)}... (${engagement} interactions)`
    );
  });
  return results;
}

// Get trending posts
export async function getTrendingPosts() {
  const results = await feedCollection.findDocumentsData([], {
    orderBy: [
      {field: 'likes', direction: 'desc'},
      {field: 'comments', direction: 'desc'},
      {field: 'createdAt', direction: 'desc'},
    ],
    limit: 20,
  });

  console.log('Trending posts:');
  results.forEach((p, index) => {
    console.log(
      `${index + 1}. ${p.data.content.substring(0, 60)}... (${p.data.likes} ❤️, ${p.data.comments} 💬)`
    );
  });
  return results;
}

// Employee Directory
interface Employee {
  name: string;
  department: string;
  position: string;
  level: number;
  performance: number;
  hireDate: number;
  createdAt?: number;
  updatedAt?: number;
}

const employeesStore = new FirestoreHelper<Employee>(db, 'employees');

// Get employees by department, sorted by level and performance
export async function getEmployeesByDepartment(department: string) {
  const results = await employeesStore.findDocumentsData(
    [{field: 'department', operator: '==', value: department}],
    {
      orderBy: [
        {field: 'level', direction: 'desc'},
        {field: 'performance', direction: 'desc'},
        {field: 'name', direction: 'asc'},
      ],
    }
  );

  console.log(`Employees in ${department}:`);
  results.forEach(e => {
    console.log(
      `${e.data.name} - L${e.data.level} ${e.data.position} (Performance: ${e.data.performance}/5)`
    );
  });
  return results;
}

// Get top performers
export async function getTopPerformers() {
  const results = await employeesStore.findDocumentsData(
    [{field: 'performance', operator: '>=', value: 4}],
    {
      orderBy: [
        {field: 'performance', direction: 'desc'},
        {field: 'level', direction: 'desc'},
        {field: 'hireDate', direction: 'asc'},
      ],
      limit: 10,
    }
  );

  console.log('Top performers:');
  results.forEach((e, index) => {
    const tenure = Math.floor(
      (Date.now() - e.data.hireDate) / (365 * 24 * 60 * 60 * 1000)
    );
    console.log(
      `${index + 1}. ${e.data.name} - ${e.data.performance}/5 performance, ${tenure} years tenure`
    );
  });
  return results;
}
