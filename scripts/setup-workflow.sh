#!/bin/bash

# ZMOS Development Workflow Setup Script
# This script configures your environment for seamless Git workflow

set -e

echo "🚀 Setting up ZMOS Development Workflow..."

# Configure Git for seamless operation
echo "📝 Configuring Git..."
git config --global init.defaultBranch main
git config --global pull.rebase false  # Merge strategy for safety
git config --global push.default simple
git config --global credential.helper store

# Verify current branch setup
echo "🔍 Verifying branch structure..."
git branch -r

# Set up local tracking for main and develop
echo "🔗 Setting up branch tracking..."
if ! git show-ref --verify --quiet refs/remotes/origin/main; then
    echo "⚠️  Remote main branch not found. This is normal for new repos."
else
    git branch --set-upstream-to=origin/main main 2>/dev/null || true
fi

if ! git show-ref --verify --quiet refs/remotes/origin/develop; then
    echo "⚠️  Remote develop branch not found. Creating locally..."
    git checkout -b develop
    git push -u origin develop
else
    git checkout develop
    git branch --set-upstream-to=origin/develop develop
fi

git checkout develop

echo "✅ Git workflow configured!"
echo ""
echo "📋 Workflow Commands:"
echo "  npm run commit     # Interactive conventional commit"
echo "  npm run push       # Push current branch"
echo "  npm run pr         # Create pull request"
echo "  npm run new-branch # Create new feature branch"
echo ""
echo "🔒 Branch Protection Reminder:"
echo "  - main: Requires PR + approval + status checks"
echo "  - develop: Requires PR + approval + status checks"
echo "  - Never delete main or develop branches"
echo ""
echo "🎯 Next Steps:"
echo "  1. Set up branch protection rules on GitHub"
echo "  2. Configure CI/CD pipeline for status checks"
echo "  3. Add collaborators to repository"
