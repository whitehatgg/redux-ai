# @redux-ai/runtime

## 2.5.0

### Minor Changes

- refactor: remove debug functionality for more consistent error handling
  - Remove debug property from RuntimeBase interface
  - Remove debug functionality from provider
  - Simplify error propagation
  - Update tests to remove debug references

## 2.4.0

### Minor Changes

- 708c35e: refactor: simplify tests and align implementations with standards
  - Remove workflow-related tests from runtime package
  - Update LangChain provider to match runtime patterns and error handling
  - Align NextJS adapter with express adapter implementation standards

## 2.3.0

### Minor Changes

- feat: simplify tests and align implementations
  - Remove workflow-related tests from runtime to match current implementation
  - Update LangChain provider to follow runtime patterns and standards
  - Align NextJS adapter with express adapter implementation standards

## 2.2.0

### Minor Changes

- refactor: simplify tests and align implementations
  - Simplified runtime tests to focus on core functionality
  - Updated LangChain provider to match runtime standards
  - Aligned NextJS adapter implementation with express adapter patterns

## 2.1.0

### Minor Changes

- Simplified runtime tests and aligned implementations:
  - Removed workflow-related tests from runtime
  - Updated LangChain provider to match runtime patterns
  - Aligned NextJS adapter with express adapter implementation

## 2.0.0

### Major Changes

- f552a34: release packages

### Minor Changes

- Simplified runtime tests and aligned implementations:
  - Removed workflow-related tests from runtime
  - Updated LangChain provider to match runtime patterns
  - Aligned NextJS adapter with express adapter implementation

### Patch Changes

- Updated dependencies [f552a34]
  - @redux-ai/schema@2.0.0

## 1.0.0

### Major Changes

- fdec1bf: release
- 7881cf0: first major release

### Patch Changes

- 5584c9b: Standardized test configuration across all packages, updated to latest Vitest version and ensured consistent test behavior across the monorepo. Changes include:

  - Unified Vitest configuration across all packages
  - Fixed test suite structure and improved test coverage
  - Added standardized test runners and configuration options
  - Fixed deprecated imports and warnings
  - Updated to latest Vitest version
  - Improved test reporting and feedback

- Updated documentation across all packages to reflect latest changes and features:
  - Enhanced package descriptions and feature lists
  - Added comprehensive API documentation
  - Updated installation and usage instructions
  - Improved TypeScript examples and type definitions
  - Added missing component documentation
  - Updated architecture diagrams and explanations