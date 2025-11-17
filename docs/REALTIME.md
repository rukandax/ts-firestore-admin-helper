# Real-time Subscriptions Guide

Learn how to use Firestore's real-time listeners for live data updates in your applications.

## Table of Contents

- [Overview](#overview)
- [Document Subscriptions](#document-subscriptions)
- [Collection Subscriptions](#collection-subscriptions)
- [Query Subscriptions](#query-subscriptions)
- [Managing Subscriptions](#managing-subscriptions)
- [Use Cases](#use-cases)
- [Best Practices](#best-practices)

## Overview

Real-time subscriptions allow your application to receive instant updates when data changes in Firestore. This is perfect for:

- Live dashboards and analytics
- Chat applications
- Collaborative editing
- Real-time notifications
- Live status updates

### How It Works

When you subscribe to a document, collection, or query, Firestore:
1. Returns the current data immediately
2. Sends updates whenever the data changes
3. Continues listening until you unsubscribe

## Document Subscriptions

Listen to changes on a specific document.

### Basic Document Subscription

```typescript
import admin from 'firebase-admin';
import FirestoreHelper from 'ts-firestore-admin-helper';

interface User {
  name: string;
  email: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: number;
  createdAt?: number;
  updatedAt?: number;
}

const db = admin.firestore();
const usersCollection = new FirestoreHelper<User>(db, 'users');

// Subscribe to a user document
const unsubscribe = usersCollection.subscribeDocument('user-123', (doc) => {
  console.log('User updated:', doc.data);
  console.log('Current status:', doc.data.status);
  console.log('Last seen:', new Date(doc.data.lastSeen).toISOString());
});

// When done, unsubscribe
// unsubscribe();
```

### React Hook Example

```typescript
import { useEffect, useState } from 'react';

function useUserStatus(userId: string) {
  const [user, setUser] = useState<{ id: string; data: User } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);

    const unsubscribe = usersCollection.subscribeDocument(
      userId,
      (doc) => {
        setUser(doc);
        setLoading(false);
        setError(null);
      }
    );

    // Cleanup on unmount
    return () => unsubscribe();
  }, [userId]);

  return { user, loading, error };
}

// Usage in component
function UserStatusBadge({ userId }: { userId: string }) {
  const { user, loading } = useUserStatus(userId);

  if (loading) return <span>Loading...</span>;
  if (!user) return <span>User not found</span>;

  return (
    <span className={`status-${user.data.status}`}>
      {user.data.status}
    </span>
  );
}
```

### Vue Composable Example

```typescript
import { ref, onUnmounted } from 'vue';

export function useUserStatus(userId: string) {
  const user = ref<{ id: string; data: User } | null>(null);
  const loading = ref(true);
  const error = ref<Error | null>(null);

  const unsubscribe = usersCollection.subscribeDocument(
    userId,
    (doc) => {
      user.value = doc;
      loading.value = false;
      error.value = null;
    }
  );

  // Cleanup on component unmount
  onUnmounted(() => {
    unsubscribe();
  });

  return { user, loading, error };
}
```

## Collection Subscriptions

Listen to all changes in a collection.

### Basic Collection Subscription

```typescript
const unsubscribe = usersCollection.subscribeCollection((snapshot) => {
  console.log('Total documents:', snapshot.size);
  
  const users = snapshot.docs.map(doc => ({
    id: doc.id,
    data: doc.data()
  }));
  
  console.log('All users:', users);
});

// Cleanup
// unsubscribe();
```

### Tracking Changes

```typescript
const unsubscribe = usersCollection.subscribeCollection((snapshot) => {
  snapshot.docChanges().forEach((change) => {
    const doc = change.doc;
    const data = doc.data();

    if (change.type === 'added') {
      console.log('New user:', doc.id, data);
      // Handle new user (e.g., add to UI)
    }

    if (change.type === 'modified') {
      console.log('Updated user:', doc.id, data);
      // Handle update (e.g., update UI)
    }

    if (change.type === 'removed') {
      console.log('Removed user:', doc.id);
      // Handle removal (e.g., remove from UI)
    }
  });
});
```

### Live Counter Example

```typescript
interface Activity {
  type: 'login' | 'logout' | 'action';
  userId: string;
  timestamp: number;
  createdAt?: number;
  updatedAt?: number;
}

const activitiesCollection = new FirestoreHelper<Activity>(db, 'activities');

function setupActivityMonitor() {
  const stats = {
    total: 0,
    logins: 0,
    logouts: 0,
    actions: 0
  };

  const unsubscribe = activitiesCollection.subscribeCollection((snapshot) => {
    // Track changes
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        stats.total++;
        const activity = change.doc.data();
        stats[`${activity.type}s`]++;
      }
    });

    console.log('Activity Stats:', stats);
    // Update dashboard UI
  });

  return unsubscribe;
}
```

## Query Subscriptions

Listen to specific query results in real-time.

### Basic Query Subscription

```typescript
// Subscribe to online users
const unsubscribe = usersCollection.subscribeQuery(
  [{ field: 'status', operator: '==', value: 'online' }],
  (snapshot) => {
    const onlineUsers = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    console.log(`${onlineUsers.length} users online`);
    console.log('Online users:', onlineUsers);
  }
);
```

### Live Search Results

```typescript
interface Product {
  name: string;
  category: string;
  price: number;
  inStock: boolean;
  createdAt?: number;
  updatedAt?: number;
}

const productsCollection = new FirestoreHelper<Product>(db, 'products');

function setupLiveProductSearch(category: string, maxPrice: number) {
  return productsCollection.subscribeQuery(
    [
      { field: 'category', operator: '==', value: category },
      { field: 'price', operator: '<=', value: maxPrice },
      { field: 'inStock', operator: '==', value: true }
    ],
    (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        data: doc.data()
      }));

      console.log(`Found ${products.length} products`);
      
      // Track what changed
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          console.log('New product available:', change.doc.data().name);
        }
        if (change.type === 'modified') {
          console.log('Product updated:', change.doc.data().name);
        }
        if (change.type === 'removed') {
          console.log('Product no longer available:', change.doc.data().name);
        }
      });
    }
  );
}

// Usage
const unsubscribe = setupLiveProductSearch('electronics', 1000);
```

### Real-time Dashboard

```typescript
interface Metric {
  name: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  updatedAt: number;
  createdAt?: number;
}

const metricsCollection = new FirestoreHelper<Metric>(db, 'metrics');

class LiveDashboard {
  private unsubscribes: Array<() => void> = [];
  private metrics: Map<string, Metric> = new Map();

  start() {
    // Subscribe to all metrics
    const unsubscribe = metricsCollection.subscribeCollection((snapshot) => {
      snapshot.docChanges().forEach(change => {
        const metric = change.doc.data();
        
        if (change.type === 'added' || change.type === 'modified') {
          this.metrics.set(change.doc.id, metric);
          this.updateUI(change.doc.id, metric);
        }
        
        if (change.type === 'removed') {
          this.metrics.delete(change.doc.id);
          this.removeFromUI(change.doc.id);
        }
      });

      this.logStats();
    });

    this.unsubscribes.push(unsubscribe);
  }

  stop() {
    this.unsubscribes.forEach(fn => fn());
    this.unsubscribes = [];
  }

  private updateUI(metricId: string, metric: Metric) {
    console.log(`📊 ${metric.name}: ${metric.value} (${metric.trend})`);
    // Update your UI framework here
  }

  private removeFromUI(metricId: string) {
    console.log(`Metric removed: ${metricId}`);
  }

  private logStats() {
    const upTrend = Array.from(this.metrics.values()).filter(m => m.trend === 'up').length;
    const downTrend = Array.from(this.metrics.values()).filter(m => m.trend === 'down').length;
    
    console.log(`\n📈 Up: ${upTrend} | 📉 Down: ${downTrend} | Total: ${this.metrics.size}\n`);
  }
}

// Usage
const dashboard = new LiveDashboard();
dashboard.start();

// Later...
// dashboard.stop();
```

## Managing Subscriptions

### Subscription Manager Class

```typescript
class SubscriptionManager {
  private subscriptions: Map<string, () => void> = new Map();

  add(key: string, unsubscribe: () => void) {
    // If a subscription with this key exists, unsubscribe it first
    if (this.subscriptions.has(key)) {
      this.remove(key);
    }
    this.subscriptions.set(key, unsubscribe);
  }

  remove(key: string) {
    const unsubscribe = this.subscriptions.get(key);
    if (unsubscribe) {
      unsubscribe();
      this.subscriptions.delete(key);
    }
  }

  removeAll() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions.clear();
  }

  has(key: string): boolean {
    return this.subscriptions.has(key);
  }

  count(): number {
    return this.subscriptions.size;
  }
}

// Usage
const subscriptions = new SubscriptionManager();

// Add subscriptions
subscriptions.add('user-profile', 
  usersCollection.subscribeDocument('user-123', (doc) => {
    console.log('User:', doc.data);
  })
);

subscriptions.add('online-users',
  usersCollection.subscribeQuery(
    [{ field: 'status', operator: '==', value: 'online' }],
    (snapshot) => {
      console.log('Online users:', snapshot.size);
    }
  )
);

// Remove specific subscription
subscriptions.remove('user-profile');

// Remove all subscriptions
subscriptions.removeAll();
```

## Use Cases

### Chat Application

```typescript
interface Message {
  chatId: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  read: boolean;
  createdAt?: number;
  updatedAt?: number;
}

const messagesCollection = new FirestoreHelper<Message>(db, 'messages');

class ChatRoom {
  private unsubscribe?: () => void;

  constructor(private chatId: string) {}

  start(onMessage: (messages: Array<{ id: string; data: Message }>) => void) {
    // Subscribe to messages in this chat room
    this.unsubscribe = messagesCollection.subscribeQuery(
      [
        { field: 'chatId', operator: '==', value: this.chatId }
      ],
      (snapshot) => {
        // Sort by timestamp
        const messages = snapshot.docs
          .map(doc => ({ id: doc.id, data: doc.data() }))
          .sort((a, b) => a.data.timestamp - b.data.timestamp);

        onMessage(messages);

        // Handle new messages
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const msg = change.doc.data();
            console.log(`💬 ${msg.userName}: ${msg.text}`);
            // Play notification sound, show toast, etc.
          }
        });
      }
    );
  }

  stop() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = undefined;
    }
  }

  async sendMessage(userId: string, userName: string, text: string) {
    await messagesCollection.addDocument({
      chatId: this.chatId,
      userId,
      userName,
      text,
      timestamp: Date.now(),
      read: false
    });
  }
}

// Usage
const chat = new ChatRoom('room-123');

chat.start((messages) => {
  console.log(`${messages.length} messages in chat`);
  // Update UI with messages
});

// Send a message
await chat.sendMessage('user-1', 'John', 'Hello everyone!');

// When leaving chat
chat.stop();
```

### Live Presence System

```typescript
interface Presence {
  userId: string;
  userName: string;
  status: 'online' | 'away' | 'offline';
  lastActivity: number;
  createdAt?: number;
  updatedAt?: number;
}

const presenceCollection = new FirestoreHelper<Presence>(db, 'presence');

class PresenceSystem {
  private unsubscribe?: () => void;
  private heartbeatInterval?: NodeJS.Timeout;

  async goOnline(userId: string, userName: string) {
    // Set initial status
    await presenceCollection.addDocument(
      {
        userId,
        userName,
        status: 'online',
        lastActivity: Date.now()
      },
      userId,
      true // override if exists
    );

    // Start heartbeat
    this.heartbeatInterval = setInterval(async () => {
      await presenceCollection.editDocument(userId, {
        lastActivity: Date.now()
      });
    }, 30000); // Every 30 seconds

    // Subscribe to presence changes
    this.unsubscribe = presenceCollection.subscribeQuery(
      [{ field: 'status', operator: '!=', value: 'offline' }],
      (snapshot) => {
        const onlineUsers = snapshot.docs.map(doc => doc.data());
        console.log(`👥 ${onlineUsers.length} users online`);
        
        snapshot.docChanges().forEach(change => {
          const user = change.doc.data();
          if (change.type === 'added' || change.type === 'modified') {
            if (user.status === 'online') {
              console.log(`✅ ${user.userName} is online`);
            }
          }
        });
      }
    );
  }

  async goOffline(userId: string) {
    // Clear heartbeat
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Unsubscribe
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Update status
    await presenceCollection.editDocument(userId, {
      status: 'offline',
      lastActivity: Date.now()
    });
  }
}

// Usage
const presence = new PresenceSystem();
await presence.goOnline('user-123', 'John Doe');

// When closing app
await presence.goOffline('user-123');
```

### Live Notifications

```typescript
interface Notification {
  userId: string;
  type: 'message' | 'alert' | 'update';
  title: string;
  body: string;
  read: boolean;
  actionUrl?: string;
  createdAt?: number;
  updatedAt?: number;
}

const notificationsCollection = new FirestoreHelper<Notification>(db, 'notifications');

function setupNotificationListener(userId: string, onNotification: (notif: Notification) => void) {
  return notificationsCollection.subscribeQuery(
    [
      { field: 'userId', operator: '==', value: userId },
      { field: 'read', operator: '==', value: false }
    ],
    (snapshot) => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const notification = change.doc.data();
          onNotification(notification);
          
          // Show notification
          console.log(`🔔 ${notification.title}: ${notification.body}`);
        }
      });
    }
  );
}

// Usage
const unsubscribe = setupNotificationListener('user-123', (notif) => {
  // Show toast/alert
  showToast(notif.title, notif.body);
  
  // Play sound
  playNotificationSound();
});

// Mark as read
async function markNotificationRead(notifId: string) {
  await notificationsCollection.editDocument(notifId, { read: true });
}
```

## Best Practices

### 1. Always Unsubscribe

```typescript
// ❌ Bad - Memory leak
function badExample() {
  usersCollection.subscribeDocument('user-123', (doc) => {
    console.log(doc.data);
  });
  // No cleanup!
}

// ✅ Good - Proper cleanup
function goodExample() {
  const unsubscribe = usersCollection.subscribeDocument('user-123', (doc) => {
    console.log(doc.data);
  });

  // Later, when done
  unsubscribe();
}
```

### 2. Use Subscription Managers

```typescript
// ✅ Centralized subscription management
const subscriptions = new SubscriptionManager();

function setupUserPage(userId: string) {
  subscriptions.add('user', 
    usersCollection.subscribeDocument(userId, updateUserUI)
  );
  
  subscriptions.add('activity',
    activitiesCollection.subscribeQuery(
      [{ field: 'userId', operator: '==', value: userId }],
      updateActivityUI
    )
  );
}

function cleanup() {
  subscriptions.removeAll();
}
```

### 3. Limit Subscription Scope

```typescript
// ❌ Bad - Subscribing to entire collection
usersCollection.subscribeCollection((snapshot) => {
  // Expensive for large collections
});

// ✅ Good - Subscribe to specific queries
usersCollection.subscribeQuery(
  [
    { field: 'teamId', operator: '==', value: 'team-123' },
    { field: 'status', operator: '==', value: 'active' }
  ],
  (snapshot) => {
    // Only get relevant users
  }
);
```

### 4. Handle Errors Gracefully

```typescript
const unsubscribe = usersCollection.subscribeDocument(
  'user-123',
  (doc) => {
    try {
      // Process document
      updateUI(doc.data);
    } catch (error) {
      console.error('Error processing document update:', error);
      // Don't let errors crash the subscription
    }
  }
);
```

### 5. Throttle Updates

```typescript
import { debounce } from 'lodash';

const debouncedUpdate = debounce((data) => {
  console.log('Updating UI with:', data);
  // Expensive UI update
}, 500);

const unsubscribe = usersCollection.subscribeQuery(
  [{ field: 'status', operator: '==', value: 'online' }],
  (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data());
    debouncedUpdate(users);
  }
);
```

## Related Resources

- [Main README](../README.md)
- [Transactions](./TRANSACTIONS.md)
- [Query Patterns](./QUERIES.md)
- [Batch Operations](./BATCH_OPERATIONS.md)

---

[← Back to Documentation](../README.md#links)
