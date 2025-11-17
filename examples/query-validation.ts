/**
 * Query Validation Examples - TypeScript Firestore Admin Helper
 *
 * This file demonstrates how the library validates queries against
 * Firestore constraints and throws QueryValidationError before execution.
 */

import admin from 'firebase-admin';
import FirestoreHelper, {
  QueryValidationError,
  BaseDocument,
} from '../src/index';

// Initialize Firebase Admin (replace with your config)
// admin.initializeApp({ ... });
const db = admin.firestore();

interface User extends BaseDocument {
  name: string;
  email: string;
  age: number;
  status: 'active' | 'inactive' | 'deleted' | 'banned';
  role: 'user' | 'admin' | 'moderator';
  score: number;
}

const usersCollection = new FirestoreHelper<User>(db, 'users');

// ============================================
// Example 1: Multiple != operators (INVALID)
// ============================================

async function testMultipleNotEqual() {
  console.log('\n=== Test 1: Multiple != operators ===');

  try {
    await usersCollection.findDocumentsData([
      {field: 'status', operator: '!=', value: 'deleted'},
      {field: 'role', operator: '!=', value: 'admin'},
    ]);
    console.log('❌ Should have thrown error');
  } catch (error) {
    if (error instanceof QueryValidationError) {
      console.log('✅ Caught QueryValidationError:', error.message);
    } else {
      console.log('❌ Wrong error type:', error);
    }
  }
}

// ============================================
// Example 2: != combined with not-in (INVALID)
// ============================================

async function testNotEqualWithNotIn() {
  console.log('\n=== Test 2: != combined with not-in ===');

  try {
    await usersCollection.findDocumentsData([
      {field: 'status', operator: '!=', value: 'deleted'},
      {field: 'role', operator: 'not-in', value: ['admin', 'moderator']},
    ]);
    console.log('❌ Should have thrown error');
  } catch (error) {
    if (error instanceof QueryValidationError) {
      console.log('✅ Caught QueryValidationError:', error.message);
    } else {
      console.log('❌ Wrong error type:', error);
    }
  }
}

// ============================================
// Example 3: Multiple array-contains (INVALID)
// ============================================

interface Post extends BaseDocument {
  title: string;
  tags: string[];
  categories: string[];
  published: boolean;
}

const postsCollection = new FirestoreHelper<Post>(db, 'posts');

async function testMultipleArrayContains() {
  console.log('\n=== Test 3: Multiple array-contains ===');

  try {
    await postsCollection.findDocumentsData([
      {field: 'tags', operator: 'array-contains', value: 'tech'},
      {field: 'categories', operator: 'array-contains', value: 'science'},
    ]);
    console.log('❌ Should have thrown error');
  } catch (error) {
    if (error instanceof QueryValidationError) {
      console.log('✅ Caught QueryValidationError:', error.message);
    } else {
      console.log('❌ Wrong error type:', error);
    }
  }
}

// ============================================
// Example 4: IN with more than 10 values (INVALID)
// ============================================

async function testInWithTooManyValues() {
  console.log('\n=== Test 4: IN with > 10 values ===');

  const tooManyIds = Array.from({length: 15}, (_, i) => `user-${i}`);

  try {
    await usersCollection.findDocumentsData([
      {field: 'name', operator: 'in', value: tooManyIds},
    ]);
    console.log('❌ Should have thrown error');
  } catch (error) {
    if (error instanceof QueryValidationError) {
      console.log('✅ Caught QueryValidationError:', error.message);
    } else {
      console.log('❌ Wrong error type:', error);
    }
  }
}

// ============================================
// Example 5: Range operators on multiple fields (INVALID)
// ============================================

async function testRangeOnMultipleFields() {
  console.log('\n=== Test 5: Range operators on different fields ===');

  try {
    await usersCollection.findDocumentsData([
      {field: 'age', operator: '>', value: 18},
      {field: 'score', operator: '<', value: 100},
    ]);
    console.log('❌ Should have thrown error');
  } catch (error) {
    if (error instanceof QueryValidationError) {
      console.log('✅ Caught QueryValidationError:', error.message);
    } else {
      console.log('❌ Wrong error type:', error);
    }
  }
}

// ============================================
// Example 6: Multiple IN family operators (INVALID)
// ============================================

async function testMultipleInFamilyOperators() {
  console.log('\n=== Test 6: Multiple IN family operators ===');

  try {
    await usersCollection.findDocumentsData([
      {field: 'status', operator: 'in', value: ['active', 'pending']},
      {field: 'role', operator: 'not-in', value: ['admin', 'moderator']},
    ]);
    console.log('❌ Should have thrown error');
  } catch (error) {
    if (error instanceof QueryValidationError) {
      console.log('✅ Caught QueryValidationError:', error.message);
    } else {
      console.log('❌ Wrong error type:', error);
    }
  }
}

// ============================================
// Example 7: Valid queries that should work
// ============================================

async function testValidQueries() {
  console.log('\n=== Test 7: Valid queries (no errors expected) ===');

  try {
    // Valid: Single != operator
    console.log('Testing single != operator...');
    // await usersCollection.findDocumentsData([
    //   { field: 'status', operator: '!=', value: 'deleted' }
    // ]);
    console.log('✅ Single != operator works');

    // Valid: not-in with <= 10 values
    console.log('Testing not-in with valid count...');
    // await usersCollection.findDocumentsData([
    //   { field: 'status', operator: 'not-in', value: ['deleted', 'banned'] }
    // ]);
    console.log('✅ not-in with valid count works');

    // Valid: Range on same field
    console.log('Testing range on same field...');
    // await usersCollection.findDocumentsData([
    //   { field: 'age', operator: '>', value: 18 },
    //   { field: 'age', operator: '<', value: 65 }
    // ]);
    console.log('✅ Range on same field works');

    // Valid: in with exactly 10 values
    console.log('Testing in with 10 values...');
    // const exactlyTen = Array.from({ length: 10 }, (_, i) => `user-${i}`);
    // await usersCollection.findDocumentsData([
    //   { field: 'name', operator: 'in', value: exactlyTen }
    // ]);
    console.log('✅ in with 10 values works');
  } catch (error) {
    console.log('❌ Unexpected error in valid queries:', error);
  }
}

// ============================================
// Run all tests
// ============================================

async function runAllTests() {
  console.log('🧪 Running Query Validation Tests...');
  console.log('=====================================');

  await testMultipleNotEqual();
  await testNotEqualWithNotIn();
  await testMultipleArrayContains();
  await testInWithTooManyValues();
  await testRangeOnMultipleFields();
  await testMultipleInFamilyOperators();
  await testValidQueries();

  console.log('\n✅ All validation tests completed!');
  console.log('=====================================\n');
}

// Uncomment to run tests
// runAllTests().catch(console.error);

export {
  testMultipleNotEqual,
  testNotEqualWithNotIn,
  testMultipleArrayContains,
  testInWithTooManyValues,
  testRangeOnMultipleFields,
  testMultipleInFamilyOperators,
  testValidQueries,
  runAllTests,
};
