#!/usr/bin/env node

/**
 * Master deployment script for SlideBanai
 * This script handles the complete deployment process in one command
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting SlideBanai full deployment process...');
console.log('=============================================');

// Directory paths
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const PUBLIC_DIR = path.join(DIST_DIR, 'public');
const FUNCTIONS_DIR = path.join(ROOT_DIR, 'functions');

// Helper function to run commands
function executeCommand(command, options = {}) {
  try {
    const defaultOptions = { stdio: 'inherit', cwd: ROOT_DIR };
    const mergedOptions = { ...defaultOptions, ...options };
    
    console.log(`\n$ ${command}`);
    execSync(command, mergedOptions);
    return true;
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    console.error(error.message);
    return false;
  }
}

// Clean up existing build
console.log('\n🧹 Cleaning up previous builds...');
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
  console.log('✅ Cleaned dist directory');
}

// Check if environment variables are set in Firebase
console.log('\n🔍 Checking if environment variables are set...');
try {
  const envCheckResult = execSync('firebase functions:config:get', { stdio: 'pipe' }).toString();
  if (envCheckResult.includes('{}') || !envCheckResult.includes('session')) {
    console.log('⚠️ Firebase environment variables not set. Running setup wizard...');
    if (!executeCommand('node scripts/update-firebase-env.cjs')) {
      console.warn('⚠️ Could not set environment variables automatically. You may need to set them manually.');
    }
  } else {
    console.log('✅ Firebase environment variables are configured');
  }
} catch (error) {
  console.warn('⚠️ Could not check Firebase environment variables. You may need to set them manually.');
  console.warn('   Run: node scripts/update-firebase-env.cjs');
}

// Build frontend
console.log('\n📦 Building frontend...');
if (!executeCommand('npm run build')) {
  console.error('❌ Frontend build failed');
  process.exit(1);
}
console.log('✅ Frontend build complete');

// Ensure directories exist
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

// Prepare and build functions
console.log('\n📦 Preparing Firebase Functions...');

// Ensure functions directory exists
if (!fs.existsSync(FUNCTIONS_DIR)) {
  fs.mkdirSync(FUNCTIONS_DIR, { recursive: true });
}

// Install dependencies for functions
if (!executeCommand('node scripts/install-firebase-dependencies.cjs')) {
  console.error('❌ Failed to install Firebase Functions dependencies');
  process.exit(1);
}

// Prepare functions source code
if (!executeCommand('node scripts/prepare-firebase-functions.cjs')) {
  console.error('❌ Failed to prepare Firebase Functions');
  process.exit(1);
}

// Modify server files to work with Firebase Functions
if (!executeCommand('node scripts/modify-server-files.cjs')) {
  console.error('❌ Failed to modify server files for Firebase Functions');
  process.exit(1);
}

// Check for Firebase CLI
console.log('\n🔍 Checking for Firebase CLI...');
try {
  execSync('firebase --version', { stdio: 'pipe' });
  console.log('✅ Firebase CLI is installed');
} catch (error) {
  console.log('Installing Firebase CLI...');
  if (!executeCommand('npm install -g firebase-tools')) {
    console.error('❌ Failed to install Firebase CLI');
    process.exit(1);
  }
}

// Check Firebase login
console.log('\n🔑 Checking Firebase login status...');
try {
  const loginOutput = execSync('firebase login:list', { stdio: 'pipe' }).toString();
  if (loginOutput.includes('Logged in')) {
    console.log('✅ Already logged in to Firebase');
  } else {
    console.log('Please log in to Firebase:');
    executeCommand('firebase login --no-localhost');
  }
} catch (error) {
  console.log('Please log in to Firebase:');
  try {
    executeCommand('firebase login --no-localhost');
  } catch (loginError) {
    console.error('❌ Failed to log in to Firebase');
    process.exit(1);
  }
}

// Verify Firebase project configuration
console.log('\n📋 Verifying Firebase project configuration...');
const firebaseRcPath = path.join(ROOT_DIR, '.firebaserc');
if (!fs.existsSync(firebaseRcPath)) {
  console.error('❌ .firebaserc file not found. Run "firebase init" first');
  process.exit(1);
}

try {
  const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
  const projectId = firebaseRc.projects.default;
  console.log(`✅ Deploying to Firebase project: ${projectId}`);
} catch (error) {
  console.error('❌ Invalid .firebaserc file');
  process.exit(1);
}

// Deploy to Firebase
console.log('\n🚀 Deploying to Firebase...');
console.log('\n⚠️  IMPORTANT: Full deployment requires Firebase Blaze (pay-as-you-go) plan');
console.log('⚠️  If you only want to deploy the frontend, run: node scripts/deploy-frontend-only.cjs');

const deployCommand = 'firebase deploy';
if (!executeCommand(deployCommand)) {
  console.error('\n❌ Firebase deployment failed!');
  console.log('⚠️  If you received a billing error, you need to upgrade to the Blaze plan');
  console.log('⚠️  You can deploy just the frontend with: firebase deploy --only hosting');
  process.exit(1);
}

// Success!
console.log('\n✅ Deployment successful!');
console.log('=============================================');
console.log('🎉 SlideBanai is now fully deployed to Firebase!');

// Get project URL
try {
  const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
  const projectId = firebaseRc.projects.default;
  console.log(`\n🌐 Your app is available at: https://${projectId}.web.app`);
  console.log(`📱 API is available at: https://us-central1-${projectId}.cloudfunctions.net/api`);
} catch (error) {
  console.log('Your app should now be available on your Firebase hosting URL');
}