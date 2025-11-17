"use strict";
/**
 * Advanced Examples - TypeScript Firestore Admin Helper
 *
 * This file contains comprehensive examples including:
 * - Custom Transactions (wallet transfers, inventory, reservations)
 * - Multiple OrderBy queries (e-commerce, social media, employee directory)
 * - Complex query patterns
 * - Real-world use cases
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferMoney = transferMoney;
exports.reserveProduct = reserveProduct;
exports.confirmPurchase = confirmPurchase;
exports.incrementViewCount = incrementViewCount;
exports.likePost = likePost;
exports.unlikePost = unlikePost;
exports.processOrder = processOrder;
exports.bookEventSeats = bookEventSeats;
exports.updateDocumentWithVersion = updateDocumentWithVersion;
exports.awardPoints = awardPoints;
exports.runExamples = runExamples;
exports.getBestDeals = getBestDeals;
exports.getProductsByCategory = getProductsByCategory;
exports.getFeedPosts = getFeedPosts;
exports.getTrendingPosts = getTrendingPosts;
exports.getEmployeesByDepartment = getEmployeesByDepartment;
exports.getTopPerformers = getTopPerformers;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const index_1 = __importDefault(require("../src/index"));
// Initialize Firebase Admin (replace with your config)
// admin.initializeApp({ ... });
const db = firebase_admin_1.default.firestore();
// Example 1: Wallet Balance Transfer
// ============================================
const walletsCollection = new index_1.default(db, 'wallets');
async function transferMoney(senderWalletId, receiverWalletId, amount) {
    try {
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
                throw new Error(`Insufficient balance. Available: ${senderData.balance}, Required: ${amount}`);
            }
            if (senderData.currency !== receiverData.currency) {
                throw new Error(`Currency mismatch. Sender: ${senderData.currency}, Receiver: ${receiverData.currency}`);
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
    catch (error) {
        if (error instanceof Error) {
            console.error('Transfer failed:', error.message);
            throw error;
        }
        throw new Error('Unknown error occurred during transfer');
    }
}
const productsCollection = new index_1.default(db, 'products');
async function reserveProduct(productId, quantity) {
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
            throw new Error(`Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`);
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
async function confirmPurchase(productId, quantity) {
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
const postsCollection = new index_1.default(db, 'posts');
async function incrementViewCount(postId) {
    const result = await postsCollection.atomicIncrement(postId, 'views', 1);
    console.log('New view count:', result.data.views);
    return result;
}
async function likePost(postId) {
    const result = await postsCollection.atomicIncrement(postId, 'likes', 1);
    console.log('New like count:', result.data.likes);
    return result;
}
async function unlikePost(postId) {
    const result = await postsCollection.atomicIncrement(postId, 'likes', -1);
    console.log('New like count:', result.data.likes);
    return result;
}
const ordersCollection = new index_1.default(db, 'orders');
async function processOrder(orderId, workerId) {
    // Try to claim the order for processing
    const result = await ordersCollection.conditionalUpdate(orderId, 'status', 'pending', {
        status: 'processing',
        processedAt: Date.now(),
        processedBy: workerId,
    });
    if (!result) {
        console.log('Order already being processed by another worker or not in pending state');
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
const eventsCollection = new index_1.default(db, 'events');
async function bookEventSeats(eventId, seatsRequested, userId) {
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
        if (event.availableSeats < seatsRequested) {
            throw new Error(`Not enough seats available. Requested: ${seatsRequested}, Available: ${event.availableSeats}`);
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
const documentsCollection = new index_1.default(db, 'documents');
async function updateDocumentWithVersion(docId, newContent, expectedVersion, userId) {
    const result = await documentsCollection.conditionalUpdate(docId, 'version', expectedVersion, {
        content: newContent,
        version: expectedVersion + 1,
        lastEditedBy: userId,
        lastEditedAt: Date.now(),
    });
    if (!result) {
        throw new Error('Document was modified by another user. Please refresh and try again.');
    }
    return result;
}
const loyaltyCollection = new index_1.default(db, 'userLoyalty');
async function awardPoints(userId, pointsToAdd, purchaseAmount) {
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
        if (newPoints >= 10000)
            newTier = 'platinum';
        else if (newPoints >= 5000)
            newTier = 'gold';
        else if (newPoints >= 1000)
            newTier = 'silver';
        else
            newTier = 'bronze';
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
            const updateResult = await updateDocumentWithVersion('doc-202', 'New content', doc.data.version, 'user-xyz');
            console.log('Update result:', updateResult);
        }
        // Example 7: Award loyalty points
        console.log('\nExample 7: Loyalty Points');
        const loyaltyResult = await awardPoints('user-303', 500, 250);
        console.log('Loyalty result:', loyaltyResult);
    }
    catch (error) {
        console.error('Error:', error);
    }
}
const productsStore = new index_1.default(db, 'products');
// Get best deals - sorted by rating (high to low), then price (low to high)
async function getBestDeals() {
    const results = await productsStore.findDocumentsData([{ field: 'stock', operator: '>', value: 0 }], {
        orderBy: [
            { field: 'rating', direction: 'desc' },
            { field: 'price', direction: 'asc' },
        ],
        limit: 20,
    });
    console.log('Best rated, cheapest products:');
    results.forEach(p => {
        console.log(`${p.data.name} - Rating: ${p.data.rating}, Price: $${p.data.price}`);
    });
    return results;
}
// Get products by category with featured items first
async function getProductsByCategory(category) {
    const results = await productsStore.findDocumentsData([{ field: 'category', operator: '==', value: category }], {
        orderBy: [
            { field: 'featured', direction: 'desc' },
            { field: 'rating', direction: 'desc' },
            { field: 'price', direction: 'asc' },
        ],
        limit: 50,
    });
    console.log(`Products in ${category}:`);
    results.forEach(p => {
        const badge = p.data.featured ? '[FEATURED]' : '';
        console.log(`${badge} ${p.data.name} - $${p.data.price} (${p.data.rating}★)`);
    });
    return results;
}
const feedCollection = new index_1.default(db, 'posts');
// Get feed with pinned posts first, then by date
async function getFeedPosts() {
    const results = await feedCollection.findDocumentsData([], {
        orderBy: [
            { field: 'isPinned', direction: 'desc' },
            { field: 'createdAt', direction: 'desc' },
        ],
        limit: 50,
    });
    console.log('Feed:');
    results.forEach(p => {
        const pin = p.data.isPinned ? '📌 ' : '';
        const engagement = p.data.likes + p.data.comments;
        console.log(`${pin}${p.data.authorName}: ${p.data.content.substring(0, 50)}... (${engagement} interactions)`);
    });
    return results;
}
// Get trending posts
async function getTrendingPosts() {
    const results = await feedCollection.findDocumentsData([], {
        orderBy: [
            { field: 'likes', direction: 'desc' },
            { field: 'comments', direction: 'desc' },
            { field: 'createdAt', direction: 'desc' },
        ],
        limit: 20,
    });
    console.log('Trending posts:');
    results.forEach((p, index) => {
        console.log(`${index + 1}. ${p.data.content.substring(0, 60)}... (${p.data.likes} ❤️, ${p.data.comments} 💬)`);
    });
    return results;
}
const employeesStore = new index_1.default(db, 'employees');
// Get employees by department, sorted by level and performance
async function getEmployeesByDepartment(department) {
    const results = await employeesStore.findDocumentsData([{ field: 'department', operator: '==', value: department }], {
        orderBy: [
            { field: 'level', direction: 'desc' },
            { field: 'performance', direction: 'desc' },
            { field: 'name', direction: 'asc' },
        ],
    });
    console.log(`Employees in ${department}:`);
    results.forEach(e => {
        console.log(`${e.data.name} - L${e.data.level} ${e.data.position} (Performance: ${e.data.performance}/5)`);
    });
    return results;
}
// Get top performers
async function getTopPerformers() {
    const results = await employeesStore.findDocumentsData([{ field: 'performance', operator: '>=', value: 4 }], {
        orderBy: [
            { field: 'performance', direction: 'desc' },
            { field: 'level', direction: 'desc' },
            { field: 'hireDate', direction: 'asc' },
        ],
        limit: 10,
    });
    console.log('Top performers:');
    results.forEach((e, index) => {
        const tenure = Math.floor((Date.now() - e.data.hireDate) / (365 * 24 * 60 * 60 * 1000));
        console.log(`${index + 1}. ${e.data.name} - ${e.data.performance}/5 performance, ${tenure} years tenure`);
    });
    return results;
}
//# sourceMappingURL=advanced-examples.js.map