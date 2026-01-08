#!/usr/bin/env node

/**
 * Full deployment script for Firebase (frontend + backend functions)
 * 
 * This script:
 * 1. Builds the frontend
 * 2. Prepares the Firebase Functions for backend
 * 3. Deploys to Firebase (requires Blaze plan for functions)
 */

const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Directory paths
const CLIENT_DIST_DIR = path.resolve(__dirname, '../client/dist');
const FUNCTIONS_DIR = path.resolve(__dirname, '../functions');
const SERVER_DIR = path.resolve(__dirname, '../server');
const FUNCTIONS_SRC_DIR = path.resolve(FUNCTIONS_DIR, 'src');

console.log('📦 Starting full deployment preparation...');

// Step 1: Ensure directories exist
console.log('\n📂 Checking directories...');
if (!fs.existsSync(CLIENT_DIST_DIR)) {
  fs.mkdirSync(CLIENT_DIST_DIR, { recursive: true });
}

// Step 2: Build the frontend
console.log('\n🔨 Building frontend...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Frontend build complete.');
} catch (error) {
  console.error('❌ Frontend build failed:', error);
  process.exit(1);
}

// Step 3: Check if Firebase CLI is installed
console.log('\n🔍 Checking for Firebase CLI...');
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is already installed.');
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

// Step 4: Check if user is logged in to Firebase
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

// Step 5: Check if .firebaserc has a project ID
console.log('\n🔍 Checking Firebase project configuration...');
const firebaserc = JSON.parse(fs.readFileSync('.firebaserc', 'utf8'));
if (firebaserc.projects.default === 'YOUR_FIREBASE_PROJECT_ID') {
  console.error('❌ Please update .firebaserc with your Firebase project ID before deploying.');
  process.exit(1);
} else {
  console.log(`✅ Deploying to Firebase project: ${firebaserc.projects.default}`);
}

// Step 6: Verify functions directory has package.json
console.log('\n🔍 Checking Functions directory setup...');
const functionsPackageJsonPath = path.join(FUNCTIONS_DIR, 'package.json');
if (!fs.existsSync(functionsPackageJsonPath)) {
  console.error('❌ Functions directory is not properly set up. Missing package.json');
  console.log('🔄 Please run the following commands to set up the Functions directory:');
  console.log('cd functions && npm install firebase-functions firebase-admin cors express && cd ..');
  process.exit(1);
} else {
  console.log('✅ Functions directory has package.json.');
}

// Step 7: Deploy to Firebase
console.log('\n🚀 Ready to deploy!');
console.log('🔔 IMPORTANT: Firebase Functions requires the Blaze (pay-as-you-go) plan');
console.log('🔔 If you only want to deploy the frontend, run: firebase deploy --only hosting');
console.log('\n🚀 Deploying to Firebase...');

try {
  console.log('🔄 Running: firebase deploy');
  execSync('firebase deploy', { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
  console.log(`🌐 Your app is now available at: https://${firebaserc.projects.default}.web.app`);
} catch (error) {
  console.error('❌ Deployment failed. See error details above.');
  console.log('🔔 If you received a billing error, you may need to upgrade to the Blaze plan.');
  console.log('🔔 You can still deploy just the frontend with: firebase deploy --only hosting');
  process.exit(1);
}