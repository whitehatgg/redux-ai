pnpm install

````

2. Start development:

```bash
pnpm run dev
````

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
