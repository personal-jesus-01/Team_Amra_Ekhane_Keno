#!/usr/bin/env node

/**
 * Simple script to deploy the frontend to Firebase
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '../client/dist');

function executeCommand(command) {
  try {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Ensure dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  fs.mkdirSync(DIST_DIR, { recursive: true });
}

// Build the frontend
console.log('\n📦 Building the frontend...');
if (!executeCommand('npm run build')) {
  process.exit(1);
}

// Check if firebase-tools is installed
try {
  execSync('firebase --version', { stdio: 'ignore' });
  console.log('✅ Firebase CLI is already installed');
} catch (error) {
  console.log('\n🔧 Installing Firebase CLI...');
  if (!executeCommand('npm install -g firebase-tools')) {
    process.exit(1);
  }
}

// Deploy to Firebase
console.log('\n🚀 Deploying to Firebase...');
console.log('Note: If not logged in, you will be prompted to authenticate');
if (!executeCommand('firebase deploy --only hosting')) {
  process.exit(1);
}

console.log('\n✅ Deployment complete!');
console.log('Visit your Firebase Hosting URL to see your deployed app');