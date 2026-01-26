# ZMOS Development Workflow Guide

## 🎯 Overview

This guide ensures **seamless Git workflow** for the ZMOS project. All commits, pushes, and branch operations are automated and follow conventional commit standards.

## 🔧 Initial Setup

### One-Time Setup
```bash
# Run workflow setup (configures Git and branches)
npm run workflow:setup

# Set up GitHub CLI (optional, for PR management)
gh auth login
```

### Git Configuration Already Set
```bash
user.name=Capra-Nubiana
user.email=ikambili34@gmail.com
credential.helper=store
init.defaultBranch=main
pull.rebase=false
push.default=simple
```

## 🛡️ Branch Protection Rules

### Main Branch (`main`)
**Protected by GitHub rules:**
- ✅ Requires pull request before merging
- ✅ Requires 1 approval
- ✅ Requires status checks (build, test, lint)
- ✅ No force pushes allowed
- ✅ No deletions allowed
- ✅ Only admins can push directly

### Develop Branch (`develop`)
**Protected by GitHub rules:**
- ✅ Requires pull request before merging
- ✅ Requires 1 approval
- ✅ Requires status checks
- ✅ No force pushes allowed
- ✅ No deletions allowed

### Feature Branches
- **Prefix**: `capra-nubiana/{type}/{description}` (e.g., `capra-nubiana/feature/dashboard`)
- **Base Branch**: **MUST** branch off the `develop` branch.
- **Workflow**: Automated tracking and linear history enforcement.

## 🚀 Daily Development Workflow

### Starting New Work
> [!IMPORTANT]
> All new features and fixes must branch off `develop`. Direct changes to `main` or `develop` are prohibited.

```bash
# Sync with latest develop
npm run sync

# Create new feature branch
# Format: capra-nubiana/feature/description
git checkout develop
git pull origin develop
git checkout -b capra-nubiana/feature/my-feature
git push -u origin capra-nubiana/feature/my-feature
```

### Commit Strategy & Linear History
> [!IMPORTANT]
> A **linear commit history** is mandatory. Avoid merge commits on `main` and `develop`. Use squashed merges for PRs to keep the integration history clean.

### Making Changes
```bash
# Edit files...

# Stage changes
git add .

# Create conventional commit (interactive)
npm run commit

# Or manual commit (follows same format)
git commit -m "feat(auth): add password reset functionality"
```

### Pushing Changes
```bash
# Push current branch (automatic branch detection)
npm run push

# Or manually:
git push origin capra-nubiana/feature/my-feature
```

### Creating Pull Request
```bash
# Create PR with GitHub CLI (recommended)
npm run pr:create

# Or manually via GitHub web interface
# PR: capra-nubiana/feature/my-feature → develop
```

## 📋 Available Commands

### Workflow Automation
```bash
npm run workflow:setup    # Initial Git configuration
npm run new-branch        # Interactive branch creation
npm run sync             # Sync with develop branch
npm run push             # Push current branch
npm run pull             # Pull current branch
npm run pr:create        # Create pull request
npm run pr:view          # View current PR
```

### Development
```bash
npm run start:dev        # Start development server
npm run test            # Run unit tests
npm run test:e2e        # Run E2E tests
npm run lint            # Lint and fix code
npm run build           # Build for production
npm run commit          # Interactive conventional commit
```

### Release Management
```bash
npm run release:prepare # Update version (patch/minor/major)
npm run release:tag     # Create git tag for release
```

## 🔄 Branch Management

### Never Delete These Branches
- ❌ `main` - Production code (protected)
- ❌ `develop` - Integration branch (protected)
- ❌ `origin/main` - Remote production
- ❌ `origin/develop` - Remote integration

### Feature Branch Lifecycle
```bash
# Create
npm run new-branch

# Work + commit
npm run commit
npm run push

# Create PR
npm run pr:create

# After merge → delete local branch
git branch -d capra-nubiana/feature/completed-feature

# Remote branch deleted automatically via GitHub
```

## 🏷️ Conventional Commit Standards

### Commit Format
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types & Examples
```
feat(auth): add JWT token validation
fix(db): resolve connection timeout issue
docs(readme): update installation instructions
chore(deps): update NestJS to version 11
refactor(prisma): optimize tenant filtering queries
test(auth): add unit tests for login service
```

### Automated Enforcement
- **Husky**: Pre-commit hooks (linting)
- **Commitlint**: Message format validation
- **Commitizen**: Interactive commit creation

## 🔐 Security & Access

### Branch Access Control
- **main/develop**: Admin/Owner only
- **feature branches**: All collaborators
- **Protected operations**: Require PR approval

### Authentication
- **GitHub**: Personal Access Token (stored securely)
- **Git**: Credential helper configured
- **SSH**: Optional alternative to HTTPS

## 🚨 Emergency Procedures

### Force Push Prevention
```bash
# NEVER use force push on protected branches
git push --force  # ❌ BLOCKED by GitHub

# If you need to force push a feature branch:
git push --force-with-lease origin capra-nubiana/feature/my-branch
```

### Branch Recovery
```bash
# If you accidentally delete a branch
git reflog  # Find the commit hash
git checkout -b recovered-branch <commit-hash>
```

### Conflict Resolution
```bash
# When pulling latest changes
npm run sync

# If conflicts occur:
# 1. Resolve conflicts in files
# 2. Stage resolved files: git add .
# 3. Commit: npm run commit
# 4. Push: npm run push
```

## 📊 Status Monitoring

### Check Repository Status
```bash
# Overall status
git status

# Branch information
git branch -v

# Remote status
git remote -v

# Unpushed commits
git log --oneline origin/main..HEAD
```

### Verify Protection Rules
```bash
# Check if branch protection is active
# Visit: https://github.com/Capra-Nubiana/ZMOS/settings/branches
```

## 🔗 Related Documentation

- `test/COMMIT_CONVENTIONS.md` - Detailed commit standards
- `docs/IMPLEMENTATION_PLAN.md` - Development roadmap
- `PROJECT_STATE.md` - Complete project context
- `docs/PHASE1_API_DOCUMENTATION.md` - API specifications

## 🆘 Getting Help

### Common Issues
1. **"Permission denied"** → Check PAT token and repository access
2. **"Branch protection"** → Create PR instead of direct push
3. **"Merge conflicts"** → Run `npm run sync` and resolve conflicts
4. **"Commit rejected"** → Use `npm run commit` for proper format

### Contact
- **Repository**: https://github.com/Capra-Nubiana/ZMOS
- **Issues**: Create GitHub issue for workflow problems
- **Discussions**: Use GitHub discussions for process questions

---

**This workflow ensures consistent, safe, and efficient development across the entire team.** 🚀
