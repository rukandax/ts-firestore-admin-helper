"use strict";
/**
 * Multiple OrderBy Examples
 * Demonstrates how to use multiple orderBy fields for complex sorting
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runExamples = runExamples;
exports.getBestDeals = getBestDeals;
exports.getProductsByCategory = getProductsByCategory;
exports.getNewArrivals = getNewArrivals;
exports.getFeedPosts = getFeedPosts;
exports.getTrendingPosts = getTrendingPosts;
exports.getEmployeesByDepartment = getEmployeesByDepartment;
exports.getTopPerformers = getTopPerformers;
exports.getUpcomingEvents = getUpcomingEvents;
exports.getEventsByAvailability = getEventsByAvailability;
exports.useTypeSafeOptions = useTypeSafeOptions;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const index_1 = __importDefault(require("../src/index"));
// Initialize Firebase Admin (replace with your config)
// admin.initializeApp({ ... });
const db = firebase_admin_1.default.firestore();
const productsCollection = new index_1.default(db, 'products');
async function getBestDeals() {
    // Sort by rating (highest first), then price (lowest first)
    const results = await productsCollection.findDocumentsData([{ field: 'stock', operator: '>', value: 0 }], {
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
async function getProductsByCategory(category) {
    // Within a category, show featured first, then sort by rating
    const results = await productsCollection.findDocumentsData([{ field: 'category', operator: '==', value: category }], {
        orderBy: [
            { field: 'featured', direction: 'desc' }, // true > false
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
async function getNewArrivals() {
    // Sort by creation date (newest first), then rating
    const results = await productsCollection.findDocumentsData([{ field: 'stock', operator: '>', value: 0 }], {
        orderBy: [
            { field: 'createdAt', direction: 'desc' },
            { field: 'rating', direction: 'desc' },
        ],
        limit: 10,
    });
    console.log('New arrivals:');
    results.forEach(p => {
        const date = new Date(p.data.createdAt).toLocaleDateString();
        console.log(`${p.data.name} - Added: ${date}, Rating: ${p.data.rating}★`);
    });
    return results;
}
const postsCollection = new index_1.default(db, 'posts');
async function getFeedPosts() {
    // Show pinned posts first, then sort by engagement (likes + comments), then by date
    const results = await postsCollection.findDocumentsData([], {
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
async function getTrendingPosts() {
    // Sort by likes (most first), then comments, then recent
    const results = await postsCollection.findDocumentsData([], {
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
const employeesCollection = new index_1.default(db, 'employees');
async function getEmployeesByDepartment(department) {
    // Within department, sort by level (senior first), then by performance
    const results = await employeesCollection.findDocumentsData([{ field: 'department', operator: '==', value: department }], {
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
async function getTopPerformers() {
    // Sort by performance, then level, then hire date (tenure)
    const results = await employeesCollection.findDocumentsData([{ field: 'performance', operator: '>=', value: 4 }], {
        orderBy: [
            { field: 'performance', direction: 'desc' },
            { field: 'level', direction: 'desc' },
            { field: 'hireDate', direction: 'asc' }, // Earlier hire date = longer tenure
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
const eventsCollection = new index_1.default(db, 'events');
async function getUpcomingEvents() {
    const now = Date.now();
    // Show featured first, then by priority, then by start date
    const results = await eventsCollection.findDocumentsData([{ field: 'startDate', operator: '>=', value: now }], {
        orderBy: [
            { field: 'featured', direction: 'desc' },
            { field: 'priority', direction: 'desc' },
            { field: 'startDate', direction: 'asc' },
        ],
        limit: 20,
    });
    console.log('Upcoming events:');
    results.forEach(e => {
        const date = new Date(e.data.startDate).toLocaleDateString();
        const availability = e.data.capacity - e.data.registered;
        const badge = e.data.featured ? '⭐ ' : '';
        console.log(`${badge}${e.data.title} - ${date} (${availability} spots left)`);
    });
    return results;
}
async function getEventsByAvailability() {
    const now = Date.now();
    // Sort by availability (capacity - registered), then by start date
    // Note: This requires a calculated field or you need to fetch and sort in code
    const results = await eventsCollection.findDocumentsData([{ field: 'startDate', operator: '>=', value: now }], {
        orderBy: [{ field: 'startDate', direction: 'asc' }],
        limit: 50,
    });
    // Sort by availability in code (since Firestore can't do computed fields)
    const sorted = results.sort((a, b) => {
        const availA = a.data.capacity - a.data.registered;
        const availB = b.data.capacity - b.data.registered;
        return availB - availA; // Most available first
    });
    console.log('Events by availability:');
    sorted.forEach(e => {
        const availability = e.data.capacity - e.data.registered;
        const percentage = Math.round((availability / e.data.capacity) * 100);
        console.log(`${e.data.title} - ${availability}/${e.data.capacity} spots (${percentage}% available)`);
    });
    return sorted;
}
// ============================================
// Example 5: Type-safe QueryOptions
// ============================================
// You can create reusable query options with full type safety
const productSortOptions = {
    orderBy: [
        { field: 'rating', direction: 'desc' },
        { field: 'price', direction: 'asc' },
    ],
    limit: 20,
};
const employeeSortOptions = {
    orderBy: [
        { field: 'level', direction: 'desc' },
        { field: 'performance', direction: 'desc' },
    ],
};
// TypeScript will catch errors
// const invalidOptions: QueryOptions<Product> = {
//   orderBy: [
//     { field: 'invalidField', direction: 'desc' } // ❌ TypeScript error!
//   ]
// };
async function useTypeSafeOptions() {
    const products = await productsCollection.findDocumentsData([{ field: 'stock', operator: '>', value: 0 }], productSortOptions);
    const employees = await employeesCollection.findDocumentsData([], employeeSortOptions);
    return { products, employees };
}
// ============================================
// Running Examples
// ============================================
async function runExamples() {
    console.log('\n=== E-commerce Examples ===\n');
    await getBestDeals();
    await getProductsByCategory('electronics');
    await getNewArrivals();
    console.log('\n=== Social Media Examples ===\n');
    await getFeedPosts();
    await getTrendingPosts();
    console.log('\n=== Employee Directory Examples ===\n');
    await getEmployeesByDepartment('Engineering');
    await getTopPerformers();
    console.log('\n=== Event Scheduling Examples ===\n');
    await getUpcomingEvents();
    await getEventsByAvailability();
    console.log('\n=== Type-safe Options ===\n');
    await useTypeSafeOptions();
}
//# sourceMappingURL=multiple-orderby.js.map