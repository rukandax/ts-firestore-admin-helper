# Undefined Value Handling - Test Scenarios

## Test Case 1: Add Document with Undefined Fields

**Input:**
```typescript
const data = {
  name: 'John',
  email: 'john@example.com',
  phone: undefined,
  bio: undefined
};

await collection.addDocument(data);
```

**Expected Firestore Document:**
```json
{
  "name": "John",
  "email": "john@example.com",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

**✅ Result:** Fields `phone` and `bio` should NOT exist in Firestore

---

## Test Case 2: Edit Document - Delete Fields with Undefined

**Initial Firestore Document:**
```json
{
  "id": "user123",
  "name": "John",
  "email": "john@example.com",
  "phone": "+1234567890",
  "bio": "Software Developer",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

**Update Operation:**
```typescript
await collection.editDocument('user123', {
  phone: undefined,  // Should delete this field
  bio: undefined,    // Should delete this field
  email: 'newemail@example.com'  // Should update this field
});
```

**Expected Firestore Document:**
```json
{
  "id": "user123",
  "name": "John",
  "email": "newemail@example.com",
  "createdAt": 1234567890,
  "updatedAt": 1234567891
}
```

**✅ Result:** Fields `phone` and `bio` should be completely removed from Firestore

---

## Test Case 3: Batch Add with Mixed Undefined Values

**Input:**
```typescript
await collection.batchAdd([
  {
    data: {
      name: 'User 1',
      email: 'user1@example.com',
      phone: '+1111111111',
      bio: undefined  // Should not be saved
    }
  },
  {
    data: {
      name: 'User 2',
      email: 'user2@example.com',
      phone: undefined,  // Should not be saved
      bio: 'Active user'
    }
  }
]);
```

**Expected Documents:**

Document 1:
```json
{
  "name": "User 1",
  "email": "user1@example.com",
  "phone": "+1111111111",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

Document 2:
```json
{
  "name": "User 2",
  "email": "user2@example.com",
  "bio": "Active user",
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

**✅ Result:** Each document should only contain fields with defined values

---

## Test Case 4: Batch Edit - Delete Multiple Fields

**Initial Documents:**

User 1:
```json
{
  "id": "user1",
  "name": "Alice",
  "email": "alice@example.com",
  "phone": "+1111111111",
  "bio": "Developer"
}
```

User 2:
```json
{
  "id": "user2",
  "name": "Bob",
  "email": "bob@example.com",
  "phone": "+2222222222",
  "bio": "Designer"
}
```

**Batch Update:**
```typescript
await collection.batchEdit([
  {
    id: 'user1',
    data: { phone: undefined }  // Delete phone
  },
  {
    id: 'user2',
    data: { 
      phone: undefined,  // Delete phone
      bio: undefined     // Delete bio
    }
  }
]);
```

**Expected Documents:**

User 1:
```json
{
  "id": "user1",
  "name": "Alice",
  "email": "alice@example.com",
  "bio": "Developer",
  "updatedAt": 1234567891
}
```

User 2:
```json
{
  "id": "user2",
  "name": "Bob",
  "email": "bob@example.com",
  "updatedAt": 1234567891
}
```

**✅ Result:** Specified fields should be deleted from each document

---

## Test Case 5: All Fields Undefined (Should Pass Validation)

**Input:**
```typescript
// This should throw error - no valid fields
await collection.editDocument('user123', {
  phone: undefined,
  bio: undefined,
  socialMedia: undefined
});
```

**Expected Behavior:**
- ❌ Should NOT throw validation error
- ✅ Should execute FieldValue.delete() for all fields
- ✅ updatedAt should still be updated

---

## Test Case 6: Mixed Null and Undefined

**Input:**
```typescript
await collection.addDocument({
  name: 'John',
  email: 'john@example.com',
  phone: null,      // Should be saved as null
  bio: undefined    // Should not be saved
});
```

**Expected Firestore Document:**
```json
{
  "name": "John",
  "email": "john@example.com",
  "phone": null,
  "createdAt": 1234567890,
  "updatedAt": 1234567890
}
```

**✅ Result:** `null` is saved, `undefined` is removed

---

## Manual Testing Steps

### Setup
```typescript
import admin from 'firebase-admin';
import FirestoreHelper from 'ts-firestore-admin-helper';

admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json')
});

const db = admin.firestore();

interface TestDoc {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  createdAt?: number;
  updatedAt?: number;
}

const collection = new FirestoreHelper<TestDoc>(db, 'test_undefined');
```

### Test 1: Add with Undefined
```typescript
const result = await collection.addDocument({
  name: 'Test User',
  email: 'test@example.com',
  phone: undefined,
  bio: undefined
});

console.log('Saved data:', result.data);
// Verify phone and bio don't exist in result.data

// Verify in Firestore console
const doc = await collection.getDocumentData(result.id);
console.log('From Firestore:', doc);
// Should not have phone or bio fields
```

### Test 2: Edit to Delete Fields
```typescript
// First create a doc with all fields
const user = await collection.addDocument({
  name: 'Full User',
  email: 'full@example.com',
  phone: '+1234567890',
  bio: 'Test bio'
});

console.log('Initial:', user.data);

// Now delete some fields
await collection.editDocument(user.id, {
  phone: undefined,
  bio: undefined
});

const updated = await collection.getDocumentData(user.id);
console.log('After delete:', updated);
// Should not have phone or bio fields
```

### Verification Checklist

- [ ] Add operation: undefined fields are not saved
- [ ] Edit operation: undefined fields are deleted from Firestore
- [ ] Batch add: undefined fields handled per document
- [ ] Batch edit: undefined fields deleted per document
- [ ] Null values are preserved (not treated as undefined)
- [ ] Empty objects after removing undefined still validate correctly
- [ ] TypeScript types still work correctly
- [ ] No compilation errors
- [ ] Build succeeds
