# TypeScript Firestore Admin Helper - Documentation

Complete documentation for the TypeScript Firestore Admin Helper library.

## 📚 Table of Contents

### Getting Started

- [Main README](../README.md) - Quick start, installation, and basic usage
- [Examples](../examples/advanced-examples.ts) - Comprehensive code examples

### Guides

1. **[Advanced Transactions](./TRANSACTIONS.md)**
   - Wallet balance transfers
   - E-commerce inventory management
   - Seat reservation systems
   - Document counters with rollback
   - Transaction best practices

2. **[Query & OrderBy Patterns](./QUERIES.md)**
   - Basic and complex queries
   - Multiple orderBy fields (single & multi-field sorting)
   - Pagination strategies
   - Ordering and limiting
   - Query performance optimization
   - Common search patterns
   - Firestore limitations and workarounds

3. **[Batch Operations](./BATCH_OPERATIONS.md)**
   - Batch add, update, and delete
   - Bulk imports from CSV/JSON
   - Performance optimization
   - Error handling
   - Progress tracking

4. **[Real-time Subscriptions](./REALTIME.md)**
   - Live document updates
   - Query subscriptions
   - Chat applications
   - Real-time dashboards
   - Presence systems

5. **[Custom Logger](./CUSTOM_LOGGER.md)**
   - Winston integration
   - Pino integration
   - Custom logger implementations
   - Debug mode
   - Production logging strategies
   - Queue-based processing

4. **[Real-time Subscriptions](./REALTIME.md)**
   - Document subscriptions
   - Collection subscriptions
   - Query subscriptions
   - Subscription management
   - Use cases (chat, presence, notifications)
   - Best practices for real-time data

## 🎯 Quick Navigation

### By Use Case

**Building a Chat Application?**
- [Real-time Subscriptions - Chat Example](./REALTIME.md#chat-application)
- [Query Patterns - Live Messages](./QUERIES.md#real-time-filtered-queries)

**E-commerce Platform?**
- [Transactions - Inventory Management](./TRANSACTIONS.md#e-commerce-inventory-management)
- [Batch Operations - Product Updates](./BATCH_OPERATIONS.md#batch-update-with-dynamic-data)

**Financial Application?**
- [Transactions - Wallet Transfers](./TRANSACTIONS.md#wallet-balance-transfer)
- [Transactions - Atomic Operations](../README.md#atomic-operations)

**User Management?**
- [Query Patterns - User Queries](./QUERIES.md#basic-queries)
- [Batch Operations - User Import](./BATCH_OPERATIONS.md#bulk-import-from-csvjson)
- [Real-time - Presence System](./REALTIME.md#live-presence-system)

**Analytics Dashboard?**
- [Real-time - Live Dashboard](./REALTIME.md#real-time-dashboard)
- [Query Patterns - Date Ranges](./QUERIES.md#date-range-queries)

**Booking System?**
- [Transactions - Seat Reservation](./TRANSACTIONS.md#seat-reservation-system)
- [Conditional Updates](../README.md#conditional-updates)

### By Operation Type

**Single Document Operations**
- [Add Document](../README.md#adding-documents)
- [Update Document](../README.md#basic-operations)
- [Delete Document](../README.md#basic-operations)
- [Get Document](../README.md#basic-operations)

**Multiple Document Operations**
- [Batch Add](./BATCH_OPERATIONS.md#batch-add)
- [Batch Update](./BATCH_OPERATIONS.md#batch-update)
- [Batch Delete](./BATCH_OPERATIONS.md#batch-delete)
- [Find Documents](./QUERIES.md#basic-queries)

**Advanced Operations**
- [Transactions](./TRANSACTIONS.md)
- [Atomic Increment](../README.md#atomic-operations)
- [Conditional Update](../README.md#conditional-updates)
- [Real-time Listeners](./REALTIME.md)

## 🔍 Search by Feature

### Data Reading
- [Get single document](../README.md#basic-operations)
- [Query multiple documents](./QUERIES.md#basic-queries)
- [Pagination](./QUERIES.md#pagination)
- [Real-time updates](./REALTIME.md)

### Data Writing
- [Add documents](../README.md#adding-documents)
- [Update documents](../README.md#basic-operations)
- [Batch operations](./BATCH_OPERATIONS.md)
- [Transactions](./TRANSACTIONS.md)

### Advanced Features
- [Custom transactions](./TRANSACTIONS.md)
- [Atomic operations](../README.md#atomic-operations)
- [Conditional updates](../README.md#conditional-updates)
- [Subscriptions](./REALTIME.md)

## 💡 Best Practices

Essential best practices are covered in each guide:

- **[Transaction Best Practices](./TRANSACTIONS.md#best-practices)** - When and how to use transactions
- **[Query Optimization](./QUERIES.md#query-performance)** - Indexes and performance tips
- **[Batch Operation Patterns](./BATCH_OPERATIONS.md#best-practices)** - Chunking and error handling
- **[Subscription Management](./REALTIME.md#best-practices)** - Memory leaks and cleanup

## 🚀 Performance Tips

### For Large Datasets
- [Batch Processing](./BATCH_OPERATIONS.md#performance-optimization)
- [Query Limits](./QUERIES.md#query-optimization-tips)
- [Pagination](./QUERIES.md#pagination)
- [Parallel Operations](./BATCH_OPERATIONS.md#parallel-batch-processing)

### For Real-time Applications
- [Subscription Scope](./REALTIME.md#best-practices)
- [Query Optimization](./QUERIES.md#query-performance)
- [Update Throttling](./REALTIME.md#best-practices)

## 🐛 Troubleshooting

### Common Issues

**"Index is required for this query"**
- See [Query Performance - Index Requirements](./QUERIES.md#index-requirements)

**"Batch size exceeds limit"**
- See [Batch Operations - Chunking](./BATCH_OPERATIONS.md#best-practices)

**"Transaction failed due to contention"**
- See [Transaction Best Practices](./TRANSACTIONS.md#best-practices)

**Memory leaks with subscriptions**
- See [Subscription Management](./REALTIME.md#managing-subscriptions)

## 📖 API Reference

Full API reference available in the [Main README](../README.md#api-reference).

## 🤝 Contributing

Found an issue or want to improve the documentation?
- [Open an Issue](https://github.com/rukandax/ts-firestore-admin-helper/issues)
- [Submit a Pull Request](https://github.com/rukandax/ts-firestore-admin-helper/pulls)

## 📄 License

MIT © [Rukanda Faridsi](https://github.com/rukandax)

---

[← Back to Main README](../README.md)
