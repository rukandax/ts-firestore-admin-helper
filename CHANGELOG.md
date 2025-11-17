# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### 🔒 Security Fixes

- **CRITICAL**: Replaced `Math.random()` with cryptographically secure `crypto.randomBytes()` for ID generation
- Added comprehensive input validation for all document operations
- Added custom ID format validation to prevent invalid Firestore IDs
- Replaced all `any` types with proper TypeScript types for better type safety

### 🐛 Bug Fixes

- **CRITICAL**: Fixed race condition in batch operations by generating all IDs before transaction starts
- **CRITICAL**: Fixed constructor error handling - removed async check from constructor to prevent unhandled rejections
- Fixed transaction consistency in `editDocument` - all reads now happen within transaction scope
- Fixed potential memory leaks in subscription methods by adding proper error handling and cleanup
- Added null safety checks for `snapshot.data()` and other potentially undefined values
- Fixed type safety issues by removing `any` usage throughout codebase

### ✨ New Features

- Added `validateConnection()` method for explicit connection validation
- Added batch size validation - prevents exceeding Firestore's 500 write limit
- Added comprehensive error messages for better debugging
- Added support for ES2020 features in compiled output

### 📝 Documentation

- Added comprehensive API documentation in README
- Added detailed usage examples
- Added error handling guide
- Added information about security improvements
- Created CHANGELOG to track version history

### 🔧 Configuration Changes

- Updated TypeScript target from ES6 to ES2020
- Enabled strict TypeScript compiler options:
  - `noUnusedLocals`
  - `noUnusedParameters`
  - `noImplicitReturns`
  - `noFallthroughCasesInSwitch`
  - `noUncheckedIndexedAccess`
- Updated package.json with proper metadata:
  - Added `files` field to control published content
  - Added `exports` field for better module resolution
  - Added `repository`, `bugs`, and `homepage` fields
  - Added relevant keywords for npm discoverability
  - Added `@types/node` as dev dependency

### 🔨 Internal Improvements

- Extracted magic numbers to named constants:
  - `DEFAULT_ID_LENGTH = 30`
  - `MAX_BATCH_SIZE = 500`
  - `ID_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'`
- Improved error messages with consistent formatting
- Added JSDoc comments for public methods
- Refactored transaction handling for better consistency
- Updated `.eslintignore` to properly exclude dist folder

### ⚠️ Breaking Changes

None - All changes are backward compatible.

### 📦 Dependencies

- Added `@types/node` (^20.0.0) for Node.js type definitions

### 🧪 Testing

- All changes compile successfully with strict TypeScript settings
- Linter passes with no errors
- Build output is clean and optimized

## [1.2.3] - Previous Release

Previous version before comprehensive security and bug fixes.
