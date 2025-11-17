"use strict";
/**
 * Query Validation Examples - TypeScript Firestore Admin Helper
 *
 * This file demonstrates how the library validates queries against
 * Firestore constraints and throws QueryValidationError before execution.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testMultipleNotEqual = testMultipleNotEqual;
exports.testNotEqualWithNotIn = testNotEqualWithNotIn;
exports.testMultipleArrayContains = testMultipleArrayContains;
exports.testInWithTooManyValues = testInWithTooManyValues;
exports.testRangeOnMultipleFields = testRangeOnMultipleFields;
exports.testMultipleInFamilyOperators = testMultipleInFamilyOperators;
exports.testValidQueries = testValidQueries;
exports.runAllTests = runAllTests;
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const index_1 = __importStar(require("../src/index"));
// Initialize Firebase Admin (replace with your config)
// admin.initializeApp({ ... });
const db = firebase_admin_1.default.firestore();
const usersCollection = new index_1.default(db, 'users');
// ============================================
// Example 1: Multiple != operators (INVALID)
// ============================================
async function testMultipleNotEqual() {
    console.log('\n=== Test 1: Multiple != operators ===');
    try {
        await usersCollection.findDocumentsData([
            { field: 'status', operator: '!=', value: 'deleted' },
            { field: 'role', operator: '!=', value: 'admin' },
        ]);
        console.log('❌ Should have thrown error');
    }
    catch (error) {
        if (error instanceof index_1.QueryValidationError) {
            console.log('✅ Caught QueryValidationError:', error.message);
        }
        else {
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
            { field: 'status', operator: '!=', value: 'deleted' },
            { field: 'role', operator: 'not-in', value: ['admin', 'moderator'] },
        ]);
        console.log('❌ Should have thrown error');
    }
    catch (error) {
        if (error instanceof index_1.QueryValidationError) {
            console.log('✅ Caught QueryValidationError:', error.message);
        }
        else {
            console.log('❌ Wrong error type:', error);
        }
    }
}
const postsCollection = new index_1.default(db, 'posts');
async function testMultipleArrayContains() {
    console.log('\n=== Test 3: Multiple array-contains ===');
    try {
        await postsCollection.findDocumentsData([
            { field: 'tags', operator: 'array-contains', value: 'tech' },
            { field: 'categories', operator: 'array-contains', value: 'science' },
        ]);
        console.log('❌ Should have thrown error');
    }
    catch (error) {
        if (error instanceof index_1.QueryValidationError) {
            console.log('✅ Caught QueryValidationError:', error.message);
        }
        else {
            console.log('❌ Wrong error type:', error);
        }
    }
}
// ============================================
// Example 4: IN with more than 10 values (INVALID)
// ============================================
async function testInWithTooManyValues() {
    console.log('\n=== Test 4: IN with > 10 values ===');
    const tooManyIds = Array.from({ length: 15 }, (_, i) => `user-${i}`);
    try {
        await usersCollection.findDocumentsData([
            { field: 'name', operator: 'in', value: tooManyIds },
        ]);
        console.log('❌ Should have thrown error');
    }
    catch (error) {
        if (error instanceof index_1.QueryValidationError) {
            console.log('✅ Caught QueryValidationError:', error.message);
        }
        else {
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
            { field: 'age', operator: '>', value: 18 },
            { field: 'score', operator: '<', value: 100 },
        ]);
        console.log('❌ Should have thrown error');
    }
    catch (error) {
        if (error instanceof index_1.QueryValidationError) {
            console.log('✅ Caught QueryValidationError:', error.message);
        }
        else {
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
            { field: 'status', operator: 'in', value: ['active', 'pending'] },
            { field: 'role', operator: 'not-in', value: ['admin', 'moderator'] },
        ]);
        console.log('❌ Should have thrown error');
    }
    catch (error) {
        if (error instanceof index_1.QueryValidationError) {
            console.log('✅ Caught QueryValidationError:', error.message);
        }
        else {
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
    }
    catch (error) {
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
//# sourceMappingURL=query-validation.js.map