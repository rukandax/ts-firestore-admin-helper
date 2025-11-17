# Query Examples and Patterns

Comprehensive guide to querying Firestore documents with type safety and best practices.

## Table of Contents

- [Basic Queries](#basic-queries)
- [Complex Queries](#complex-queries)
- [Pagination](#pagination)
- [Ordering and Limiting](#ordering-and-limiting)
- [Query Performance](#query-performance)
- [Common Patterns](#common-patterns)

## Basic Queries

### Single Field Query

```typescript
interface User {
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive';
  createdAt?: number;
  updatedAt?: number;
}

const usersCollection = new FirestoreHelper<User>(db, 'users');

// Find users by status
const activeUsers = await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' }
]);

// Find user by email
const user = await usersCollection.findDocumentData([
  { field: 'email', operator: '==', value: 'john@example.com' }
]);
```

### Multiple Field Queries

```typescript
// Find active users over 18
const adults = await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' },
  { field: 'age', operator: '>=', value: 18 }
]);

// Find users with non-null email
const verified = await usersCollection.findDocumentsData([
  { field: 'email', operator: '!=', value: null },
  { field: 'status', operator: '==', value: 'active' }
]);
```

### Range Queries

```typescript
// Find users between ages 18 and 65
const workingAge = await usersCollection.findDocumentsData([
  { field: 'age', operator: '>=', value: 18 },
  { field: 'age', operator: '<=', value: 65 }
]);

// Find recent users (last 7 days)
const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
const recentUsers = await usersCollection.findDocumentsData([
  { field: 'createdAt', operator: '>=', value: sevenDaysAgo }
]);
```

## Complex Queries

### Array Membership

```typescript
interface Post {
  title: string;
  tags: string[];
  author: string;
  published: boolean;
  createdAt?: number;
  updatedAt?: number;
}

const postsCollection = new FirestoreHelper<Post>(db, 'posts');

// Find posts with specific tag
const techPosts = await postsCollection.findDocumentsData([
  { field: 'tags', operator: 'array-contains', value: 'technology' }
]);

// Find posts with any of multiple tags
const multiTagPosts = await postsCollection.findDocumentsData([
  { field: 'tags', operator: 'array-contains-any', value: ['tech', 'science', 'programming'] }
]);
```

### IN Queries

```typescript
// Find users by multiple IDs
const specificStatuses = await usersCollection.findDocumentsData([
  { field: 'status', operator: 'in', value: ['active', 'pending', 'suspended'] }
]);

// Find posts by specific authors
const authorPosts = await postsCollection.findDocumentsData([
  { field: 'author', operator: 'in', value: ['user-1', 'user-2', 'user-3'] }
]);
```

### NOT IN Queries

```typescript
// Find users excluding certain statuses
const nonDeletedUsers = await usersCollection.findDocumentsData([
  { field: 'status', operator: 'not-in', value: ['deleted', 'banned'] }
]);
```

## Pagination

### Cursor-based Pagination

```typescript
// First page
const firstPage = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: 'createdAt',
    orderDirection: 'desc',
    limit: 10
  }
);

// Next page using last document ID
const lastDoc = firstPage[firstPage.length - 1];
const secondPage = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: 'createdAt',
    orderDirection: 'desc',
    limit: 10,
    startAfterId: lastDoc.id
  }
);

// Check if there are more pages
const hasMore = secondPage.length === 10;
```

### Complete Pagination Helper

```typescript
class PaginationHelper<T extends { createdAt?: number; updatedAt?: number }> {
  constructor(
    private collection: FirestoreHelper<T>,
    private pageSize: number = 10
  ) {}

  async getPage(
    query: QueryPayload<T>[],
    pageNumber: number,
    orderBy: keyof T = 'createdAt' as keyof T,
    orderDirection: 'asc' | 'desc' = 'desc'
  ) {
    const options: QueryOptions<T> = {
      orderBy,
      orderDirection,
      limit: this.pageSize
    };

    // For pages beyond the first, we need to skip documents
    // Note: Firestore doesn't have offset, so this requires fetching all previous pages
    if (pageNumber > 1) {
      const previousPages = await this.collection.findDocumentsData(query, {
        orderBy,
        orderDirection,
        limit: (pageNumber - 1) * this.pageSize
      });

      if (previousPages.length > 0) {
        options.startAfterId = previousPages[previousPages.length - 1].id;
      }
    }

    const results = await this.collection.findDocumentsData(query, options);

    return {
      data: results,
      page: pageNumber,
      pageSize: this.pageSize,
      hasMore: results.length === this.pageSize
    };
  }
}

// Usage
const paginator = new PaginationHelper(usersCollection, 20);
const page1 = await paginator.getPage(
  [{ field: 'status', operator: '==', value: 'active' }],
  1
);
```

### Efficient Cursor Pagination

```typescript
// Better approach: Store cursor tokens
interface PaginationResult<T> {
  data: Array<{ id: string; data: T }>;
  nextCursor: string | null;
  hasMore: boolean;
}

async function paginateWithCursor<T extends { createdAt?: number; updatedAt?: number }>(
  collection: FirestoreHelper<T>,
  query: QueryPayload<T>[],
  limit: number = 10,
  cursor?: string
): Promise<PaginationResult<T>> {
  const options: QueryOptions<T> = {
    orderBy: 'createdAt' as keyof T,
    orderDirection: 'desc',
    limit: limit + 1 // Fetch one extra to check if there are more
  };

  if (cursor) {
    options.startAfterId = cursor;
  }

  const results = await collection.findDocumentsData(query, options);
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, limit) : results;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return {
    data,
    nextCursor,
    hasMore
  };
}

// Usage
let cursor: string | null = null;

// First page
const page1 = await paginateWithCursor(
  usersCollection,
  [{ field: 'status', operator: '==', value: 'active' }],
  10
);
console.log('Page 1:', page1.data);

// Next page
if (page1.hasMore) {
  const page2 = await paginateWithCursor(
    usersCollection,
    [{ field: 'status', operator: '==', value: 'active' }],
    10,
    page1.nextCursor!
  );
  console.log('Page 2:', page2.data);
}
```

## Ordering and Limiting

### Basic Ordering

```typescript
// Order by age ascending
const youngestFirst = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: 'age',
    orderDirection: 'asc',
    limit: 10
  }
);

// Order by creation date descending (newest first)
const newestFirst = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: 'createdAt',
    orderDirection: 'desc',
    limit: 10
  }
);
```

### Multiple Order By Fields

⚠️ **Note**: Firestore requires composite indexes for multiple orderBy fields.

```typescript
// Multiple orderBy using the helper (recommended)
const results = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: [
      { field: 'age', direction: 'asc' },
      { field: 'createdAt', direction: 'desc' }
    ],
    limit: 10
  }
);

// Backward compatible - single orderBy still works
const results2 = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: 'age',
    orderDirection: 'desc',
    limit: 10
  }
);

// You can also use buildQuery for more complex scenarios
const query = usersCollection.buildQuery([
  { field: 'status', operator: '==', value: 'active' }
]);

const snapshot = await query
  .orderBy('age', 'asc')
  .orderBy('createdAt', 'desc')
  .limit(10)
  .get();

const manualResults = snapshot.docs.map(doc => ({
  id: doc.id,
  data: doc.data()
}));
```

### Multiple OrderBy Examples

```typescript
interface Product {
  name: string;
  category: string;
  price: number;
  rating: number;
  stock: number;
  createdAt?: number;
  updatedAt?: number;
}

const productsCollection = new FirestoreHelper<Product>(db, 'products');

// Sort by category (asc) then price (asc)
const productsByCategory = await productsCollection.findDocumentsData(
  [{ field: 'stock', operator: '>', value: 0 }],
  {
    orderBy: [
      { field: 'category', direction: 'asc' },
      { field: 'price', direction: 'asc' }
    ],
    limit: 50
  }
);

// Sort by rating (desc) then price (asc) - best rated, cheapest first
const bestDeals = await productsCollection.findDocumentsData(
  [{ field: 'stock', operator: '>', value: 0 }],
  {
    orderBy: [
      { field: 'rating', direction: 'desc' },
      { field: 'price', direction: 'asc' }
    ],
    limit: 20
  }
);

// Complex sort: category, then rating, then price
const complexSort = await productsCollection.findDocumentsData(
  [{ field: 'category', operator: '==', value: 'electronics' }],
  {
    orderBy: [
      { field: 'rating', direction: 'desc' },
      { field: 'price', direction: 'asc' },
      { field: 'createdAt', direction: 'desc' }
    ],
    limit: 10
  }
);
```

### TypeScript Support for Multiple OrderBy

The library provides full type safety:

```typescript
import { QueryOptions, OrderByOption } from 'ts-firestore-admin-helper';

// Type-safe orderBy options
const options: QueryOptions<Product> = {
  orderBy: [
    { field: 'category', direction: 'asc' }, // ✅ Type checked
    { field: 'price', direction: 'desc' }    // ✅ Type checked
    // { field: 'invalid', direction: 'asc' } // ❌ TypeScript error
  ],
  limit: 10
};

const results = await productsCollection.findDocumentsData([], options);
```

### Pagination with Multiple OrderBy

```typescript
// First page
const page1 = await collection.findDocumentsData(
  query,
  {
    orderBy: [
      { field: 'rating', direction: 'desc' },
      { field: 'price', direction: 'asc' }
    ],
    limit: 10
  }
);

// Next page - must use same orderBy
const lastDoc = page1[page1.length - 1];
const page2 = await collection.findDocumentsData(
  query,
  {
    orderBy: [
      { field: 'rating', direction: 'desc' },
      { field: 'price', direction: 'asc' }
    ],
    limit: 10,
    startAfterId: lastDoc.id
  }
);
```

## Query Performance

### Index Requirements

Firestore requires indexes for:
- Queries with inequality filters on different fields
- Queries with multiple fields
- Queries with orderBy on a field different from the equality filter
- **Queries with multiple orderBy fields (composite index required)**

```typescript
// ✅ No index needed - single equality filter
await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' }
]);

// ⚠️ Index required - inequality filter
await usersCollection.findDocumentsData([
  { field: 'age', operator: '>', value: 18 }
]);

// ⚠️ Index required - multiple fields
await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' },
  { field: 'age', operator: '>', value: 18 }
]);

// ⚠️ Composite index required - multiple orderBy
await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  {
    orderBy: [
      { field: 'age', direction: 'asc' },
      { field: 'createdAt', direction: 'desc' }
    ]
  }
);
```

### Creating Indexes

When you get an error like:
```
Firestore index is required for this query. Please create the necessary index.
```

The error message includes a link to create the index automatically in Firebase Console.

Alternatively, define indexes in `firestore.indexes.json`:

```json
{
  "indexes": [
    {
      "collectionGroup": "users",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "age", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "products",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "rating", "order": "DESCENDING" },
        { "fieldPath": "price", "order": "ASCENDING" }
      ]
    }
  ]
}
```

**Example for Multiple OrderBy:**

If you're using this query:
```typescript
await productsCollection.findDocumentsData(
  [{ field: 'stock', operator: '>', value: 0 }],
  {
    orderBy: [
      { field: 'category', direction: 'asc' },
      { field: 'price', direction: 'asc' }
    ]
  }
);
```

You need this index:
```json
{
  "collectionGroup": "products",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "stock", "order": "ASCENDING" },
    { "fieldPath": "category", "order": "ASCENDING" },
    { "fieldPath": "price", "order": "ASCENDING" }
  ]
}
```

### Query Optimization Tips

```typescript
// ❌ Bad - Fetching all then filtering in code
const allUsers = await usersCollection.findDocumentsData([]);
const activeUsers = allUsers.filter(u => u.data.status === 'active');

// ✅ Good - Let Firestore filter
const activeUsers = await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' }
]);

// ❌ Bad - No limit, could fetch thousands
const users = await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' }
]);

// ✅ Good - Always use limits for large datasets
const users = await usersCollection.findDocumentsData(
  [{ field: 'status', operator: '==', value: 'active' }],
  { limit: 100 }
);
```

## Common Patterns

### Search by Partial Match

⚠️ **Note**: Firestore doesn't support LIKE queries. Use alternatives:

```typescript
// Option 1: Array of keywords
interface Product {
  name: string;
  keywords: string[];
  price: number;
  createdAt?: number;
  updatedAt?: number;
}

const productsCollection = new FirestoreHelper<Product>(db, 'products');

// When creating a product, generate keywords
function generateKeywords(text: string): string[] {
  const words = text.toLowerCase().split(' ');
  const keywords: string[] = [];
  
  for (const word of words) {
    for (let i = 1; i <= word.length; i++) {
      keywords.push(word.substring(0, i));
    }
  }
  
  return [...new Set(keywords)];
}

await productsCollection.addDocument({
  name: 'Laptop Computer',
  keywords: generateKeywords('Laptop Computer'),
  price: 999
});

// Search
const results = await productsCollection.findDocumentsData([
  { field: 'keywords', operator: 'array-contains', value: 'lap' }
]);

// Option 2: Use Algolia or similar for full-text search
// Option 3: Use >= and < for prefix matching
const searchTerm = 'Lap';
const results = await productsCollection.findDocumentsData([
  { field: 'name', operator: '>=', value: searchTerm },
  { field: 'name', operator: '<', value: searchTerm + '\uf8ff' }
]);
```

### Date Range Queries

```typescript
// Get documents from specific date range
const startDate = new Date('2024-01-01').getTime();
const endDate = new Date('2024-12-31').getTime();

const documentsIn2024 = await usersCollection.findDocumentsData([
  { field: 'createdAt', operator: '>=', value: startDate },
  { field: 'createdAt', operator: '<=', value: endDate }
]);

// Get documents from last N days
function getLastNDays(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

const lastWeek = await usersCollection.findDocumentsData([
  { field: 'createdAt', operator: '>=', value: getLastNDays(7) }
]);

const lastMonth = await usersCollection.findDocumentsData([
  { field: 'createdAt', operator: '>=', value: getLastNDays(30) }
]);
```

### Count Documents

⚠️ **Note**: Firestore doesn't have a built-in count. You need to fetch and count.

```typescript
// For small datasets - fetch and count
const activeUsers = await usersCollection.findDocumentsData([
  { field: 'status', operator: '==', value: 'active' }
]);
const count = activeUsers.length;

// For large datasets - maintain a counter document
interface Counter {
  count: number;
  lastUpdated: number;
  createdAt?: number;
  updatedAt?: number;
}

const countersCollection = new FirestoreHelper<Counter>(db, 'counters');

// Increment counter when adding user
async function addUserWithCounter(userData: User) {
  const result = await usersCollection.addDocument(userData);
  await countersCollection.atomicIncrement('active-users', 'count', 1);
  return result;
}

// Get count
const counterDoc = await countersCollection.getDocumentData('active-users');
console.log('Active users:', counterDoc?.data.count);
```

### Distinct Values

```typescript
// Get unique values (requires fetching all and filtering)
async function getDistinctValues<T extends { createdAt?: number; updatedAt?: number }>(
  collection: FirestoreHelper<T>,
  field: keyof T,
  query: QueryPayload<T>[] = []
): Promise<Array<T[keyof T]>> {
  const docs = await collection.findDocumentsData(query);
  const values = docs.map(doc => doc.data[field]);
  return [...new Set(values)];
}

// Usage
const uniqueStatuses = await getDistinctValues(usersCollection, 'status');
console.log('Unique statuses:', uniqueStatuses);
```

### Geo Queries

For location-based queries, use the `geofirestore` library:

```typescript
// Install: npm install geofirestore

import { GeoFirestore } from 'geofirestore';

const geofirestore = new GeoFirestore(db);
const geocollection = geofirestore.collection('locations');

// Add location
await geocollection.add({
  name: 'Coffee Shop',
  coordinates: new admin.firestore.GeoPoint(40.7128, -74.0060)
});

// Query nearby locations (within 5km)
const query = geocollection.near({
  center: new admin.firestore.GeoPoint(40.7128, -74.0060),
  radius: 5
});

const snapshot = await query.get();
snapshot.forEach(doc => {
  console.log(doc.id, doc.data());
});
```

### Real-time Filtered Queries

```typescript
// Subscribe to filtered results
const unsubscribe = usersCollection.subscribeQuery(
  [
    { field: 'status', operator: '==', value: 'active' },
    { field: 'age', operator: '>=', value: 18 }
  ],
  (snapshot) => {
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
    
    console.log('Active adult users:', users.length);
    
    // Track changes
    snapshot.docChanges().forEach(change => {
      if (change.type === 'added') {
        console.log('New user:', change.doc.data());
      }
      if (change.type === 'modified') {
        console.log('Modified user:', change.doc.data());
      }
      if (change.type === 'removed') {
        console.log('Removed user:', change.doc.data());
      }
    });
  }
);

// Don't forget to unsubscribe
// unsubscribe();
```

## Query Limitations

### Firestore Query Constraints

The library automatically validates queries against Firestore constraints and throws `QueryValidationError` before execution:

1. **Can't use multiple `!=` operators**
2. **Can't combine `!=` and `not-in` in same query**
3. **Can't combine `!=` and `in` in same query**
4. **Can't use multiple `array-contains` in same query**
5. **Can't combine `array-contains` and `array-contains-any`**
6. **Can't use multiple "in" family operators (`in`, `not-in`, `array-contains-any`)**
7. **Can't use `in`, `not-in`, or `array-contains-any` with more than 10 values**
8. **Can't use range operators (`<`, `<=`, `>`, `>=`, `!=`) on multiple fields**
9. **Can't order by field not in equality filter**
10. **Maximum 100 composite indexes per database**

### Automatic Query Validation

The library validates all queries **before** sending them to Firestore:

```typescript
import { QueryValidationError } from 'ts-firestore-admin-helper';

// ❌ This will throw QueryValidationError
try {
  await usersCollection.findDocumentsData([
    { field: 'status', operator: '!=', value: 'deleted' },
    { field: 'role', operator: '!=', value: 'admin' } // Multiple != not allowed
  ]);
} catch (error) {
  if (error instanceof QueryValidationError) {
    console.error('Invalid query:', error.message);
    // "Cannot use multiple "!=" operators in the same query"
  }
}

// ❌ This will throw QueryValidationError
try {
  await usersCollection.findDocumentsData([
    { field: 'status', operator: '!=', value: 'deleted' },
    { field: 'role', operator: 'not-in', value: ['admin', 'moderator'] }
  ]);
} catch (error) {
  if (error instanceof QueryValidationError) {
    console.error('Invalid query:', error.message);
    // "Cannot combine "!=" and "not-in" operators in the same query"
  }
}

// ❌ This will throw QueryValidationError
try {
  await usersCollection.findDocumentsData([
    { field: 'age', operator: '>', value: 18 },
    { field: 'score', operator: '<', value: 100 } // Range on different fields
  ]);
} catch (error) {
  if (error instanceof QueryValidationError) {
    console.error('Invalid query:', error.message);
    // "Cannot use range operators on multiple fields"
  }
}

// ❌ This will throw QueryValidationError
try {
  const tooManyIds = Array.from({ length: 15 }, (_, i) => `id-${i}`);
  await usersCollection.findDocumentsData([
    { field: 'id', operator: 'in', value: tooManyIds } // Max 10 values
  ]);
} catch (error) {
  if (error instanceof QueryValidationError) {
    console.error('Invalid query:', error.message);
    // "Operator "in" supports maximum 10 values, but 15 were provided"
  }
}

// ❌ This will throw QueryValidationError
try {
  await postsCollection.findDocumentsData([
    { field: 'tags', operator: 'array-contains', value: 'tech' },
    { field: 'categories', operator: 'array-contains', value: 'science' }
  ]);
} catch (error) {
  if (error instanceof QueryValidationError) {
    console.error('Invalid query:', error.message);
    // "Cannot use multiple "array-contains" operators in the same query"
  }
}

// ❌ This will throw QueryValidationError
try {
  await usersCollection.findDocumentsData([
    { field: 'status', operator: 'in', value: ['active', 'pending'] },
    { field: 'role', operator: 'not-in', value: ['admin', 'moderator'] }
  ]);
} catch (error) {
  if (error instanceof QueryValidationError) {
    console.error('Invalid query:', error.message);
    // "Cannot use multiple "in" family operators"
  }
}
```

### Error Handling Best Practices

```typescript
import { QueryValidationError } from 'ts-firestore-admin-helper';

async function safeQuery() {
  try {
    const results = await usersCollection.findDocumentsData([
      { field: 'status', operator: '!=', value: 'deleted' },
      { field: 'age', operator: '>', value: 18 }
    ]);
    return results;
  } catch (error) {
    if (error instanceof QueryValidationError) {
      // Handle constraint violation
      console.error('Query validation failed:', error.message);
      // Return alternative result or throw custom error
      return [];
    }
    // Handle other errors (network, permissions, etc.)
    throw error;
  }
}
```

### Workarounds

#### Problem: Multiple `!=` or `not-in` operators

```typescript
// ❌ Invalid - multiple != operators
await usersCollection.findDocumentsData([
  { field: 'status', operator: '!=', value: 'deleted' },
  { field: 'role', operator: '!=', value: 'admin' }
]);

// ✅ Solution 1: Use 'not-in' for one field
await usersCollection.findDocumentsData([
  { field: 'status', operator: 'not-in', value: ['deleted', 'banned'] },
  { field: 'role', operator: '==', value: 'user' }
]);

// ✅ Solution 2: Filter in application code
const allUsers = await usersCollection.findDocumentsData([
  { field: 'status', operator: '!=', value: 'deleted' }
]);
const filtered = allUsers.filter(u => u.data.role !== 'admin');

// ✅ Solution 3: Use separate queries and merge
const [nonDeleted, nonBanned] = await Promise.all([
  usersCollection.findDocumentsData([
    { field: 'status', operator: '!=', value: 'deleted' }
  ]),
  usersCollection.findDocumentsData([
    { field: 'status', operator: '!=', value: 'banned' }
  ])
]);
// Merge and deduplicate results
const uniqueUsers = Array.from(
  new Map([...nonDeleted, ...nonBanned].map(u => [u.id, u])).values()
);
```

#### Problem: Multiple array-contains

```typescript
// ❌ Invalid - multiple array-contains
await postsCollection.findDocumentsData([
  { field: 'tags', operator: 'array-contains', value: 'tech' },
  { field: 'categories', operator: 'array-contains', value: 'science' }
]);

// ✅ Solution 1: Combine into single array field
interface Post {
  title: string;
  allTags: string[]; // Combine tags and categories
  createdAt?: number;
  updatedAt?: number;
}

await postsCollection.findDocumentsData([
  { field: 'allTags', operator: 'array-contains-any', value: ['tech', 'science'] }
]);

// ✅ Solution 2: Query one, filter the other
const techPosts = await postsCollection.findDocumentsData([
  { field: 'tags', operator: 'array-contains', value: 'tech' }
]);
const techAndScience = techPosts.filter(
  p => p.data.categories?.includes('science')
);

// ✅ Solution 3: Denormalize with computed field
interface Post {
  title: string;
  tags: string[];
  categories: string[];
  hasTechAndScience: boolean; // Computed on write
  createdAt?: number;
  updatedAt?: number;
}

await postsCollection.findDocumentsData([
  { field: 'hasTechAndScience', operator: '==', value: true }
]);
```

#### Problem: IN/NOT-IN limited to 10 values

```typescript
// ❌ Invalid - more than 10 values
const userIds = Array.from({ length: 25 }, (_, i) => `user-${i}`);
await usersCollection.findDocumentsData([
  { field: 'id', operator: 'in', value: userIds } // QueryValidationError
]);

// ✅ Solution: Split into chunks of 10
async function queryWithLargeIn<T extends BaseDocument>(
  collection: FirestoreHelper<T>,
  field: keyof T,
  values: any[]
): Promise<Array<{ id: string; data: T }>> {
  const chunks: any[][] = [];
  for (let i = 0; i < values.length; i += 10) {
    chunks.push(values.slice(i, i + 10));
  }

  const results = await Promise.all(
    chunks.map(chunk =>
      collection.findDocumentsData([
        { field, operator: 'in', value: chunk }
      ])
    )
  );

  return results.flat();
}

// Usage
const userIds = Array.from({ length: 25 }, (_, i) => `user-${i}`);
const users = await queryWithLargeIn(usersCollection, 'userId', userIds);
```

#### Problem: Range operators on multiple fields

```typescript
// ❌ Invalid - range on different fields
await usersCollection.findDocumentsData([
  { field: 'age', operator: '>', value: 18 },
  { field: 'score', operator: '<', value: 100 }
]);

// ✅ Solution 1: Query one range, filter the other
const adults = await usersCollection.findDocumentsData([
  { field: 'age', operator: '>', value: 18 }
]);
const filtered = adults.filter(u => u.data.score < 100);

// ✅ Solution 2: Use composite field (if ranges are common)
interface User {
  name: string;
  age: number;
  score: number;
  ageScoreCategory: string; // e.g., "adult_low", "adult_high", "minor_low"
  createdAt?: number;
  updatedAt?: number;
}

// Set on write:
// ageScoreCategory = `${age > 18 ? 'adult' : 'minor'}_${score < 100 ? 'low' : 'high'}`

await usersCollection.findDocumentsData([
  { field: 'ageScoreCategory', operator: '==', value: 'adult_low' }
]);

// ✅ Solution 3: Use separate queries and merge
const [byAge, byScore] = await Promise.all([
  usersCollection.findDocumentsData([
    { field: 'age', operator: '>', value: 18 }
  ]),
  usersCollection.findDocumentsData([
    { field: 'score', operator: '<', value: 100 }
  ])
]);

// Find intersection
const ageIds = new Set(byAge.map(u => u.id));
const intersection = byScore.filter(u => ageIds.has(u.id));
```

#### Problem: Can't combine incompatible operators

```typescript
// ❌ Invalid - != with in
await usersCollection.findDocumentsData([
  { field: 'status', operator: '!=', value: 'deleted' },
  { field: 'role', operator: 'in', value: ['admin', 'moderator'] }
]);

// ✅ Solution: Use not-in instead of !=
await usersCollection.findDocumentsData([
  { field: 'status', operator: 'not-in', value: ['deleted'] },
  { field: 'role', operator: '==', value: 'admin' } // Change to equality if possible
]);

// ✅ Or filter in code
const users = await usersCollection.findDocumentsData([
  { field: 'role', operator: 'in', value: ['admin', 'moderator'] }
]);
const nonDeleted = users.filter(u => u.data.status !== 'deleted');
```

## Related Resources

- [Main README](../README.md)
- [Transactions](./TRANSACTIONS.md)
- [Batch Operations](./BATCH_OPERATIONS.md)

---

[← Back to Documentation](../README.md#links)
