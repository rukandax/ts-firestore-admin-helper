/**
 * Query Validation Examples - TypeScript Firestore Admin Helper
 *
 * This file demonstrates how the library validates queries against
 * Firestore constraints and throws QueryValidationError before execution.
 */
declare function testMultipleNotEqual(): Promise<void>;
declare function testNotEqualWithNotIn(): Promise<void>;
declare function testMultipleArrayContains(): Promise<void>;
declare function testInWithTooManyValues(): Promise<void>;
declare function testRangeOnMultipleFields(): Promise<void>;
declare function testMultipleInFamilyOperators(): Promise<void>;
declare function testValidQueries(): Promise<void>;
declare function runAllTests(): Promise<void>;
export { testMultipleNotEqual, testNotEqualWithNotIn, testMultipleArrayContains, testInWithTooManyValues, testRangeOnMultipleFields, testMultipleInFamilyOperators, testValidQueries, runAllTests, };
//# sourceMappingURL=query-validation.d.ts.map