import admin from 'firebase-admin';
import FirestoreHelper from '../src/index';

// Initialize Firebase Admin (replace with your credentials)
admin.initializeApp({
  credential: admin.credential.cert('./serviceAccountKey.json'),
});

const db = admin.firestore();

// Example 1: User interface with optional fields
interface User {
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  socialMedia?: string;
  createdAt?: number;
  updatedAt?: number;
}

const userCollection = new FirestoreHelper<User>(db, 'users');

/**
 * Example 1: Add document with undefined fields
 * Fields with undefined values will be automatically removed before saving
 */
async function exampleAddWithUndefined() {
  console.log('\n=== Example 1: Add with undefined fields ===');

  const userData: User = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: undefined, // This field won't be saved to Firestore
    bio: undefined, // This field won't be saved to Firestore
  };

  const result = await userCollection.addDocument(userData);
  console.log('Added user:', result.id);
  console.log('Saved data:', result.data);
  // Output will NOT include phone and bio fields
}

/**
 * Example 2: Conditional fields based on user input
 */
async function exampleConditionalFields() {
  console.log('\n=== Example 2: Conditional fields ===');

  const createUser = async (data: {
    name: string;
    email: string;
    includePhone?: boolean;
    includeBio?: boolean;
  }) => {
    const user: User = {
      name: data.name,
      email: data.email,
      // Only include phone if specified
      phone: data.includePhone ? '+1234567890' : undefined,
      // Only include bio if specified
      bio: data.includeBio ? 'User biography...' : undefined,
    };

    // Undefined fields will automatically be removed
    return await userCollection.addDocument(user);
  };

  // User without phone and bio
  const user1 = await createUser({
    name: 'Alice',
    email: 'alice@example.com',
  });
  console.log('User 1 (no optional fields):', user1.data);

  // User with phone only
  const user2 = await createUser({
    name: 'Bob',
    email: 'bob@example.com',
    includePhone: true,
  });
  console.log('User 2 (with phone):', user2.data);

  // User with both optional fields
  const user3 = await createUser({
    name: 'Charlie',
    email: 'charlie@example.com',
    includePhone: true,
    includeBio: true,
  });
  console.log('User 3 (with phone and bio):', user3.data);

  return {user1, user2, user3};
}

/**
 * Example 3: Update document and delete fields using undefined
 */
async function exampleDeleteFieldsWithUndefined() {
  console.log('\n=== Example 3: Delete fields using undefined ===');

  // First, create a user with all fields
  const user = await userCollection.addDocument({
    name: 'David',
    email: 'david@example.com',
    phone: '+1234567890',
    bio: 'Software Developer',
    socialMedia: '@david',
  });

  console.log('Created user with all fields:', user.data);

  // Now, update and delete some fields by setting them to undefined
  await userCollection.editDocument(user.id, {
    phone: undefined, // This will DELETE the phone field from Firestore
    bio: undefined, // This will DELETE the bio field from Firestore
    email: 'newemail@example.com', // This will UPDATE the email
  });

  // Get updated document
  const updatedUser = await userCollection.getDocumentData(user.id);
  console.log('After update (phone and bio deleted):', updatedUser);
  // phone and bio fields should no longer exist

  return user.id;
}

/**
 * Example 4: Batch add with undefined fields
 */
async function exampleBatchAddWithUndefined() {
  console.log('\n=== Example 4: Batch add with undefined fields ===');

  await userCollection.batchAdd([
    {
      data: {
        name: 'User 1',
        email: 'user1@example.com',
        phone: undefined, // Won't be saved
        bio: 'Active user',
      },
    },
    {
      data: {
        name: 'User 2',
        email: 'user2@example.com',
        phone: '+1111111111',
        bio: undefined, // Won't be saved
      },
    },
    {
      data: {
        name: 'User 3',
        email: 'user3@example.com',
        // All optional fields are undefined
        phone: undefined,
        bio: undefined,
        socialMedia: undefined,
      },
    },
  ]);

  console.log('Batch add completed with conditional fields');
}

/**
 * Example 5: Batch edit to delete multiple fields
 */
async function exampleBatchEditWithUndefined() {
  console.log('\n=== Example 5: Batch edit to delete fields ===');

  // First create some test users
  const user1 = await userCollection.addDocument({
    name: 'Test User 1',
    email: 'test1@example.com',
    phone: '+1111111111',
    bio: 'Bio 1',
  });

  const user2 = await userCollection.addDocument({
    name: 'Test User 2',
    email: 'test2@example.com',
    phone: '+2222222222',
    bio: 'Bio 2',
  });

  console.log('Created test users');

  // Batch delete phone fields from both users
  await userCollection.batchEdit([
    {
      id: user1.id,
      data: {
        phone: undefined, // Delete phone field
      },
    },
    {
      id: user2.id,
      data: {
        phone: undefined, // Delete phone field
        bio: undefined, // Delete bio field
      },
    },
  ]);

  console.log('Batch edit completed - fields deleted');

  // Verify
  const updated1 = await userCollection.getDocumentData(user1.id);
  const updated2 = await userCollection.getDocumentData(user2.id);

  console.log('User 1 after batch edit:', updated1);
  console.log('User 2 after batch edit:', updated2);
}

/**
 * Example 6: Form data with optional fields
 */
async function exampleFormDataWithOptionalFields() {
  console.log('\n=== Example 6: Form data processing ===');

  // Simulate form data where some fields might be empty strings or null
  const formData = {
    name: 'Emma Watson',
    email: 'emma@example.com',
    phone: '', // Empty string from form
    bio: null, // Null from form
    socialMedia: '@emma',
  };

  // Process form data - convert empty/null to undefined for cleanup
  const processedData: User = {
    name: formData.name,
    email: formData.email,
    phone: formData.phone || undefined, // Empty string becomes undefined
    bio: formData.bio || undefined, // Null becomes undefined
    socialMedia: formData.socialMedia || undefined,
  };

  const user = await userCollection.addDocument(processedData);
  console.log('User from form data:', user.data);
  // Only name, email, and socialMedia will be saved
  // phone and bio won't exist in Firestore
}

/**
 * Example 7: Clearing user profile fields
 */
async function exampleClearProfileFields() {
  console.log('\n=== Example 7: Clear profile fields ===');

  // Create user with full profile
  const user = await userCollection.addDocument({
    name: 'Frank Miller',
    email: 'frank@example.com',
    phone: '+5555555555',
    bio: 'Graphic designer and artist',
    socialMedia: '@frank_art',
  });

  console.log('Created user with full profile:', user.data);

  // User wants to clear their bio and social media
  await userCollection.editDocument(user.id, {
    bio: undefined, // Clear bio
    socialMedia: undefined, // Clear social media
  });

  const updatedUser = await userCollection.getDocumentData(user.id);
  console.log('After clearing fields:', updatedUser);
  // bio and socialMedia fields are now deleted from Firestore
}

// Run all examples
async function runAllExamples() {
  try {
    await exampleAddWithUndefined();
    await exampleConditionalFields();
    await exampleDeleteFieldsWithUndefined();
    await exampleBatchAddWithUndefined();
    await exampleBatchEditWithUndefined();
    await exampleFormDataWithOptionalFields();
    await exampleClearProfileFields();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('Error running examples:', error);
  }
}

// Uncomment to run
// runAllExamples();

export {
  exampleAddWithUndefined,
  exampleConditionalFields,
  exampleDeleteFieldsWithUndefined,
  exampleBatchAddWithUndefined,
  exampleBatchEditWithUndefined,
  exampleFormDataWithOptionalFields,
  exampleClearProfileFields,
};
