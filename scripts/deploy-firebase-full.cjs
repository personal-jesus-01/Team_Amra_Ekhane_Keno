#!/usr/bin/env node

/**
 * Full deployment script for Firebase (frontend + backend functions)
 * 
 * This script:
 * 1. Builds the frontend
 * 2. Prepares Firebase Functions for the backend
 * 3. Deploys everything to Firebase (requires Blaze plan for functions)
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting full SlideBanai deployment...');

// Step 1: Build the frontend
console.log('\n📦 Building frontend application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend build complete.');
} catch (error) {
  console.error('❌ Frontend build failed:', error);
  process.exit(1);
}

// Step 2: Prepare Firebase Functions
console.log('\n📦 Preparing backend functions...');
try {
  // Install required npm packages in functions directory
  console.log('Installing required dependencies in functions directory...');
  execSync('node scripts/install-firebase-dependencies.cjs', { stdio: 'inherit' });
  
  // Run the preparation scripts
  execSync('node scripts/prepare-firebase-functions.cjs', { stdio: 'inherit' });
  execSync('node scripts/modify-server-files.cjs', { stdio: 'inherit' });
  console.log('✅ Backend functions preparation complete.');
} catch (error) {
  console.error('❌ Backend functions preparation failed:', error);
  process.exit(1);
}

// Step 3: Check if Firebase CLI is installed
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

// Step 4: Check Firebase login
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

// Step 5: Verify project configuration
console.log('\n🔍 Checking Firebase project configuration...');
const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
console.log(`📌 Deploying to Firebase project: ${firebaserc.projects.default}`);

// Step 6: Final deployment
console.log('\n🚀 Deploying to Firebase...');
console.log('⚠️ IMPORTANT: Firebase Functions requires the Blaze (pay-as-you-go) plan');
console.log('⚠️ If deployment fails due to billing, you can deploy just the frontend with:');
console.log('   firebase deploy --only hosting');
try {
  execSync('firebase deploy', { stdio: 'inherit' });
  console.log('\n✅ Deployment successful!');
  console.log(`🌐 Your app is now available at: https://${firebaserc.projects.default}.web.app`);
} catch (error) {
  console.error('❌ Deployment failed.');
  console.log('⚠️ If you received a billing error, you need to upgrade to the Blaze plan.');
  console.log('⚠️ You can deploy just the frontend with: firebase deploy --only hosting');
  process.exit(1);
}