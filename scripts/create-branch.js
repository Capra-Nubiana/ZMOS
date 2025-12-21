#!/usr/bin/env node

const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function createBranch() {
  try {
    console.log('🚀 ZMOS Branch Creation Tool');
    console.log('==========================');

    // Get current branch
    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
    console.log(`📍 Current branch: ${currentBranch}`);

    // Ask for branch type
    const branchType = await askQuestion('Branch type (feature/bugfix/docs/chore)? [feature]: ') || 'feature';

    // Ask for description
    const description = await askQuestion('Branch description (kebab-case): ');
    if (!description) {
      console.error('❌ Branch description is required');
      process.exit(1);
    }

    // Create branch name
    const branchName = `capra-nubiana/${branchType}/${description}`;

    // Validate branch name format
    if (!/^[a-z0-9-]+\/(feature|bugfix|docs|chore)\/[a-z0-9-]+$/.test(branchName)) {
      console.error('❌ Invalid branch name format. Use: capra-nubiana/{type}/{description}');
      console.error('   Type must be: feature, bugfix, docs, or chore');
      console.error('   Description must be kebab-case (lowercase, hyphens only)');
      process.exit(1);
    }

    // Check if branch already exists
    try {
      execSync(`git show-ref --verify --quiet refs/heads/${branchName}`);
      console.error(`❌ Branch '${branchName}' already exists locally`);
      process.exit(1);
    } catch (e) {
      // Branch doesn't exist, which is good
    }

    // Create and switch to branch
    console.log(`📝 Creating branch: ${branchName}`);
    execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });

    // Push to remote and set upstream
    console.log('🚀 Pushing to remote...');
    execSync(`git push -u origin ${branchName}`, { stdio: 'inherit' });

    console.log('');
    console.log('✅ Branch created successfully!');
    console.log(`🔗 Branch: ${branchName}`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('  1. Make your changes');
    console.log('  2. npm run commit    # Create conventional commits');
    console.log('  3. npm run push      # Push your changes');
    console.log('  4. npm run pr:create # Create pull request');

    rl.close();
  } catch (error) {
    console.error('❌ Error creating branch:', error.message);
    rl.close();
    process.exit(1);
  }
}

createBranch();
