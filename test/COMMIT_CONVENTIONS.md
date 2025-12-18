# Commit Conventions

This document outlines the commit message conventions and best practices for the ZMOS project.

## Overview

Consistent commit messages make it easier to understand the history of changes, generate changelogs, and maintain the codebase. We follow the [Conventional Commits](https://conventionalcommits.org/) specification with some project-specific extensions.

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Examples

```
feat(auth): add JWT token validation
fix(db): resolve connection timeout issue
docs(readme): update installation instructions
chore(deps): update NestJS to version 11
refactor(prisma): optimize tenant filtering queries
test(auth): add unit tests for login service
```

## Types

| Type | Description | Release Impact |
|------|-------------|----------------|
| `feat` | New feature | Minor version bump |
| `fix` | Bug fix | Patch version bump |
| `docs` | Documentation changes | No version bump |
| `style` | Code style changes (formatting, semicolons, etc.) | No version bump |
| `refactor` | Code refactoring without changing functionality | No version bump |
| `perf` | Performance improvements | Patch version bump |
| `test` | Adding or updating tests | No version bump |
| `chore` | Maintenance tasks (deps, config, etc.) | No version bump |
| `ci` | CI/CD configuration changes | No version bump |
| `build` | Build system changes | No version bump |

## Scopes

Scopes help categorize the changes. Use these common scopes:

- `auth` - Authentication and authorization
- `db` / `prisma` - Database and Prisma-related changes
- `api` - API endpoints and controllers
- `config` - Configuration files
- `deps` - Dependencies
- `docs` - Documentation
- `test` - Testing
- `ui` - User interface (if applicable)
- `core` - Core business logic

## Description Rules

- Use imperative mood: "add", "fix", "update", not "added", "fixed", "updated"
- Start with lowercase
- Keep under 50 characters
- Be specific and descriptive
- No period at the end

### Good Examples

```
feat(auth): implement multi-tenant user registration
fix(prisma): handle tenant isolation in member queries
docs(api): document authentication endpoints
chore(deps): upgrade bcrypt to version 6
```

### Bad Examples

```
fixed bug
update
auth stuff
```

## Body (Optional)

Use the body for more detailed explanations when needed:

```
feat(auth): add tenant middleware

- Reads x-tenant-id header from requests
- Validates tenant exists in database
- Stores tenant ID in CLS context
- Applies globally to all routes

Closes #123
```

## Footer (Optional)

Use footers for:

- Breaking changes: `BREAKING CHANGE: description`
- Issue references: `Closes #123`, `Fixes #456`
- Co-authors: `Co-authored-by: name <email>`

## Breaking Changes

For breaking changes, add a footer:

```
feat(api): change authentication endpoint signature

BREAKING CHANGE: The /auth/login endpoint now requires tenant ID in header
```

## Commit Workflow

### Feature Branches
```
main
├── feature/user-authentication
├── feature/tenant-management
└── bugfix/login-validation
```

### Commit Process
1. Make changes
2. Stage files: `git add <files>`
3. Commit with proper message: `git commit -m "feat(auth): add password hashing"`
4. Push branch: `git push origin feature-branch`
5. Create Pull Request

### Squashing Commits
When merging feature branches, squash commits to maintain clean history:

```
feat: implement user authentication system

- Add JWT strategy and guards
- Implement signup/login endpoints
- Add tenant middleware
- Update Prisma service for multi-tenancy
```

## Tools and Automation

### Commitizen (Recommended)
Use Commitizen for interactive commit messages:

```bash
npm install -g commitizen
commitizen init cz-conventional-changelog --save-dev --save-exact
```

### Husky + Commitlint (Optional)
For enforced conventions:

```bash
npm install --save-dev @commitlint/cli @commitlint/config-conventional husky
npx husky init
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg
```

### Release Automation
Use semantic-release for automated versioning:

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/changelog",
    "@semantic-release/git"
  ]
}
```

## Examples by Category

### Features
```
feat(auth): implement JWT-based authentication
feat(db): add tenant isolation to all queries
feat(api): expose user management endpoints
```

### Bug Fixes
```
fix(auth): handle expired JWT tokens gracefully
fix(db): prevent duplicate tenant creation
fix(api): validate request body in signup endpoint
```

### Documentation
```
docs(readme): add deployment instructions
docs(api): document tenant header requirements
docs(setup): create development environment guide
```

### Chores
```
chore(deps): update all dependencies to latest versions
chore(config): add ESLint rules for TypeScript
chore(build): optimize Docker build process
```

### Refactoring
```
refactor(auth): extract JWT validation logic to separate service
refactor(db): optimize query performance with proper indexing
refactor(api): standardize error response format
```

### Testing
```
test(auth): add comprehensive test suite for login flow
test(api): cover edge cases in tenant validation
test(db): verify multi-tenant data isolation
```

## Enforcement

While we encourage following these conventions, they are guidelines rather than strict rules. Use your best judgment for clarity and consistency.

For questions about commit conventions, refer to this document or ask in the development channel.
