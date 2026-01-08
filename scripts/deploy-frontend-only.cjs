#!/usr/bin/env node

/**
 * Frontend-only deployment script for Firebase
 * This script only deploys the hosting part (no backend functions)
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting frontend-only deployment...');

// Step 1: Build the frontend
console.log('\n📦 Building frontend application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend build complete.');
} catch (error) {
  console.error('❌ Frontend build failed:', error);
  process.exit(1);
}

// Step 2: Check if Firebase CLI is installed
console.log('\n🔍 Checking for Firebase CLI...');
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI found.');
} catch (error) {
  console.log('🔄 Firebase CLI not found. Installing...');
  try {
    execSync('npm install -g firebase-tools', { stdio: 'inherit' });
    console.log('✅ Firebase CLI installed.');
  } catch (installError) {
    console.error('❌ Failed to install Firebase CLI:', installError);
    process.exit(1);
  }
}

// Step 3: Check Firebase login
console.log('\n🔑 Checking Firebase authentication...');
try {
  const loginStatus = execSync('firebase login:list', { stdio: 'pipe' }).toString();
  if (!loginStatus.includes('Logged in')) {
    console.log('🔄 Not logged in to Firebase. Please log in:');
    execSync('firebase login --no-localhost', { stdio: 'inherit' });
  } else {
    console.log('✅ Already logged in to Firebase.');
  }
} catch (error) {
  console.log('🔄 Firebase authentication check failed. Please log in:');
  try {
    execSync('firebase login --no-localhost', { stdio: 'inherit' });
  } catch (loginError) {
    console.error('❌ Failed to log in to Firebase:', loginError);
    process.exit(1);
  }
}

// Step 4: Check if the built files exist
console.log('\n🔍 Checking if build files exist...');
const indexHtmlPath = path.resolve(__dirname, '../dist/public/index.html');
if (!fs.existsSync(indexHtmlPath)) {
  console.error('❌ Could not find built index.html at', indexHtmlPath);
  process.exit(1);
}
console.log('✅ Found index.html at', indexHtmlPath);

// Step 5: Deploy to Firebase Hosting (frontend only)
console.log('\n🚀 Deploying frontend to Firebase Hosting...');
try {
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  
  // Get the Firebase project ID
  const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
  const projectId = firebaserc.projects.default;
  
  console.log('✅ Frontend deployment successful!');
  console.log(`🌐 Your app is now available at: https://${projectId}.web.app`);
} catch (error) {
  console.error('❌ Frontend deployment failed:', error);
  process.exit(1);
}