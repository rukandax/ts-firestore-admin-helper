# Undefined Value Handling

Library ini secara otomatis menangani nilai `undefined` pada operasi add dan update untuk mencegah error dari Firestore.

## Behavior

### Add Operations (addDocument, batchAdd, batchAddLarge)

Field dengan nilai `undefined` akan **dihapus otomatis** sebelum dokumen disimpan ke Firestore.

**Contoh:**

```typescript
// Data dengan undefined values
const userData = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: undefined, // akan dihapus
  address: undefined, // akan dihapus
};

await collection.addDocument(userData);

// Yang tersimpan di Firestore:
// {
//   name: 'John Doe',
//   email: 'john@example.com',
//   createdAt: 1234567890,
//   updatedAt: 1234567890
// }
// Field 'phone' dan 'address' tidak ada di database
```

### Update Operations (editDocument, batchEdit, batchEditLarge)

Field dengan nilai `undefined` akan **menghapus field tersebut dari Firestore** menggunakan `FieldValue.delete()`.

**Contoh:**

```typescript
// Dokumen existing di Firestore:
// {
//   id: 'user123',
//   name: 'John Doe',
//   email: 'john@example.com',
//   phone: '+1234567890',
//   address: '123 Main St'
// }

// Update dengan undefined values
await collection.editDocument('user123', {
  email: 'newemail@example.com', // akan di-update
  phone: undefined, // akan dihapus dari Firestore
  address: undefined, // akan dihapus dari Firestore
});

// Hasil akhir di Firestore:
// {
//   id: 'user123',
//   name: 'John Doe',
//   email: 'newemail@example.com',
//   updatedAt: 1234567891
// }
// Field 'phone' dan 'address' sudah tidak ada
```

## Use Cases

### 1. Conditional Fields

```typescript
interface User {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
}

const createUser = async (data: {
  name: string;
  email: string;
  includePhone?: boolean;
  includeBio?: boolean;
}) => {
  const user: User = {
    name: data.name,
    email: data.email,
    phone: data.includePhone ? '+1234567890' : undefined,
    bio: data.includeBio ? 'User bio...' : undefined,
  };

  // Field undefined akan otomatis tidak disimpan
  return await userCollection.addDocument(user);
};
```

### 2. Clearing Optional Fields

```typescript
// Menghapus field optional dari dokumen yang sudah ada
await userCollection.editDocument('user123', {
  bio: undefined, // menghapus bio
  socialMedia: undefined, // menghapus socialMedia
});
```

### 3. Batch Operations

```typescript
// Batch add - undefined fields akan dihapus
await collection.batchAdd([
  {
    data: {
      name: 'User 1',
      email: 'user1@example.com',
      phone: undefined, // tidak akan disimpan
    },
  },
  {
    data: {
      name: 'User 2',
      email: 'user2@example.com',
      phone: '+1234567890', // akan disimpan
    },
  },
]);

// Batch edit - undefined fields akan dihapus dari Firestore
await collection.batchEdit([
  {
    id: 'user1',
    data: {
      phone: undefined, // akan menghapus field phone
    },
  },
  {
    id: 'user2',
    data: {
      email: 'newemail@example.com',
      address: undefined, // akan menghapus field address
    },
  },
]);
```

## Implementation Details

Library menggunakan dua helper function internal:

1. **`removeUndefinedFields(data)`**: Membersihkan object dari field yang bernilai `undefined`
2. **`extractUndefinedFields(data)`**: Mengekstrak field `undefined` dan mengkonversinya menjadi `FieldValue.delete()`

Proses ini terjadi secara otomatis dan transparan untuk developer.

## Benefits

✅ **Tidak perlu manual cleanup** - Library otomatis handle undefined values  
✅ **Mencegah Firestore errors** - Firestore tidak support undefined sebagai value  
✅ **Intuitive API** - Menggunakan undefined untuk delete fields terasa natural  
✅ **Type-safe** - Tetap mendukung TypeScript dengan baik  
✅ **Performance** - Proses cleaning dilakukan di memory sebelum network call

## Notes

- Field dengan nilai `null` akan tetap disimpan (Firestore mendukung `null`)
- Timestamp fields (`createdAt`, `updatedAt`) tidak terpengaruh oleh logic ini
- Validasi dokumen dilakukan setelah undefined fields dibersihkan
- Behavior ini berlaku untuk semua operasi add dan edit (termasuk batch operations)
