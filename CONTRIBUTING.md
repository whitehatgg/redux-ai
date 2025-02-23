# Contributing to Redux AI

## Getting Started

```bash
pnpm install
```

## Code Style & Formatting

We use Prettier for code formatting and ESLint for code quality. To format your code:

```bash
# Format all files
pnpm exec prettier --write "**/*.{ts,tsx,js,jsx,json,md,css}" --ignore-path .prettierignore

# Check formatting without making changes
pnpm exec prettier --check "**/*.{ts,tsx,js,jsx,json,md,css}" --ignore-path .prettierignore
```

Our formatting rules include:

- Semi-colons
- Single quotes
- 100 character line width
- 2 space indentation
- Trailing commas in objects and arrays
- Organized imports using @ianvs/prettier-plugin-sort-imports

## Making Changes

1. Create a new branch for your changes:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and test them locally:

```bash
pnpm run lint
pnpm run test
```

3. Create a changeset to document your changes:

```bash
pnpm changeset
```

Follow the prompts to:

- Select the packages that have changed
- Choose the type of change (major/minor/patch)
- Write a description of your changes

4. Commit your changes:

```bash
git add .
git commit -m "feat: your feature description"
```

5. Push your changes:

```bash
git push origin feature/your-feature-name
```

## Release Process

We use [Changesets](https://github.com/changesets/changesets) to manage versions and package publishing. The process is:

1. Changes are documented using `pnpm changeset`
2. When changes are merged to main:
   - CI will automatically build and test the changes
   - If tests pass, changes will be published using `pnpm run release`
   - This process is handled by our CI/CD pipeline, no manual intervention needed

Note: Pull requests are not automatically created by our CI. All version management and publishing is handled through Changesets.

## Package Dependencies

The project uses a monorepo structure with the following package dependencies:

- `@redux-ai/schema`: Base types and validation schemas
- `@redux-ai/vector`: Vector storage and similarity search
- `@redux-ai/state`: Redux state management and XState machines
- `@redux-ai/react`: React components and hooks

Dependencies flow upward in this order. To avoid circular dependencies:

1. `schema` should not depend on any other package
2. `vector` can only depend on `schema`
3. `state` can depend on `schema` and `vector`
4. `react` can depend on all other packages

## Type Checking

Type checking is enforced through pre-commit hooks and should be run during development:

```bash
# Check types for all packages
pnpm exec tsc -b packages/*/tsconfig.json client/tsconfig.json

# Check single package
cd packages/<package-name>
pnpm exec tsc
```

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/). When making changes:

- MAJOR version for incompatible API changes (1.0.0)
- MINOR version for added functionality in a backward compatible manner (0.1.0)
- PATCH version for backward compatible bug fixes (0.0.1)

Use changesets to document your changes:

```bash
# Add a changeset
pnpm changeset

# Version packages based on changesets (maintainers only)
pnpm changeset version

# Publish packages (handled by CI, maintainers only)
pnpm changeset publish
```

## Tests

### Running Tests

```bash
# Check single package
cd packages/<package-name>
pnpm test

# Check all packages
pnpm test
```

### Testing Best Practices

When writing tests, always follow these guidelines to ensure consistent behavior between local and CI/CD environments:

1. **Module Mocking**
   - Use the factory pattern with `vi.mock` to ensure proper hoisting
   - Define mock factories inside `vi.mock` to avoid initialization order issues
   - Return class constructors that create fresh mock instances
   - Avoid using top-level variables in mock definitions

Example of proper mocking:

```typescript
vi.mock('some-module', () => {
  const createMockInstance = () => ({
    someMethod: vi.fn(),
  });

  return {
    default: class MockClass {
      constructor() {
        return createMockInstance();
      }
    },
  };
});
```

2. **Test Isolation**

   - Reset all mocks before each test using `vi.clearAllMocks()`
   - Avoid shared state between tests
   - Create fresh instances of mocked dependencies for each test

3. **Type Safety**
   - Use the `createMock` utility from test-utils.ts for type-safe mocking
   - Provide explicit type annotations for mock implementations
   - Leverage TypeScript to catch mocking errors at compile time

### Local vs CI/CD Environment Considerations

To ensure tests behave consistently across all environments:

1. **Running Tests**

   - Always run tests in non-interactive mode locally using `vitest run` or `pnpm test`
   - Avoid tests that depend on user input or interactive prompts
   - Use the `--run` flag to simulate CI environment behavior

2. **Environment Setup**

   - Clear module cache between test runs if needed
   - Don't rely on module hoisting behavior that might differ between environments
   - Use proper module mocking patterns as described above

3. **Common Issues & Solutions**
   - If tests pass locally but fail in CI:
     - Check for timing issues or race conditions
     - Verify module mocking patterns follow the factory pattern
     - Ensure all test dependencies are properly declared
     - Run tests in CI-like conditions locally (clean environment, non-interactive)
