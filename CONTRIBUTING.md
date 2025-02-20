pnpm install

````

## Code Style & Formatting

We use Prettier for code formatting and ESLint for code quality. To format your code:

```bash
# Format all files
pnpm exec prettier --write "**/*.{ts,tsx,js,jsx,json,md,css}" --ignore-path .prettierignore

# Check formatting without making changes
pnpm exec prettier --check "**/*.{ts,tsx,js,jsx,json,md,css}" --ignore-path .prettierignore
````

Our formatting rules include:

- Semi-colons
- Single quotes
- 100 character line width
- 2 space indentation
- Trailing commas in objects and arrays
- Organized imports using @ianvs/prettier-plugin-sort-imports

### ESLint Configuration

Our ESLint setup is optimized for the monorepo structure with specific rules for different file types:

1. Regular TypeScript/React files:

   - Strict type checking
   - React hooks rules enforcement
   - Import organization

2. Test files and utilities:

   - Relaxed rules for test files
   - Allows test-specific patterns
   - Disabled unused variable checks

3. Declaration files (.d.ts):

   - Specialized parsing for type definitions
   - Disabled unnecessary checks

4. Configuration files:
   - Node.js environment globals
   - Relaxed module requirements

The pre-commit hook will run ESLint checks automatically. You can also run them manually:

```bash
# Check all files
pnpm exec eslint .

# Fix auto-fixable issues
pnpm exec eslint . --fix
```

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

The pre-commit hook runs type checking across all packages to ensure type safety.

## Making Changes

1. Create a new branch for your changes
2. Format your code using Prettier (see above)
3. Run tests and linting:

```bash
pnpm run lint
pnpm run test
```

4. Create a changeset to document your changes:

```bash
pnpm changeset
```

## Semantic Versioning

We follow [Semantic Versioning](https://semver.org/). When making changes:

- MAJOR version for incompatible API changes (1.0.0)
- MINOR version for added functionality in a backward compatible manner (0.1.0)
- PATCH version for backward compatible bug fixes (0.0.1)

Use changesets to document your changes and automate version management:

```bash
# Add a changeset
pnpm changeset

# Version packages based on changesets
pnpm changeset version

# Publish packages (maintainers only)
pnpm changeset publish
```
