#!/usr/bin/env node

/**
 * Updates Firebase Functions environment variables
 * Run this script to automatically set the required environment variables for your Firebase project
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Helper function to ask a question and get user input
function ask(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// Check if Firebase CLI is installed and user is logged in
async function checkFirebasePrerequisites() {
  console.log('🔍 Checking Firebase CLI and login status...');
  
  try {
    execSync('firebase --version', { stdio: 'pipe' });
    console.log('✅ Firebase CLI is installed');
  } catch (error) {
    console.log('⚠️ Firebase CLI not installed. Installing...');
    try {
      execSync('npm install -g firebase-tools', { stdio: 'inherit' });
      console.log('✅ Firebase CLI installed successfully');
    } catch (installError) {
      console.error('❌ Failed to install Firebase CLI:', installError.message);
      process.exit(1);
    }
  }
  
  // Check login status
  try {
    const loginOutput = execSync('firebase login:list', { stdio: 'pipe' }).toString();
    if (!loginOutput.includes('Logged in')) {
      console.log('⚠️ Not logged in to Firebase. Please log in:');
      execSync('firebase login', { stdio: 'inherit' });
    } else {
      console.log('✅ Already logged in to Firebase');
    }
  } catch (error) {
    console.log('⚠️ Login check failed. Please log in:');
    execSync('firebase login', { stdio: 'inherit' });
  }
}

// Get the current Firebase project ID
function getFirebaseProjectId() {
  try {
    const firebaseRcPath = path.join(__dirname, '../.firebaserc');
    if (fs.existsSync(firebaseRcPath)) {
      const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
      return firebaseRc.projects.default;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Main function to update Firebase environment variables
async function updateFirebaseEnv() {
  try {
    // Check prerequisites
    await checkFirebasePrerequisites();
    
    // Get project ID
    let projectId = getFirebaseProjectId();
    if (!projectId) {
      projectId = await ask('Enter your Firebase project ID: ');
      // Update .firebaserc or create it if it doesn't exist
      const firebaseRc = { projects: { default: projectId } };
      fs.writeFileSync(
        path.join(__dirname, '../.firebaserc'),
        JSON.stringify(firebaseRc, null, 2)
      );
    }
    
    console.log(`\n📌 Setting environment variables for Firebase project: ${projectId}`);
    
    // Ask for required environment variables
    console.log('\n⚠️ Note: These values will be stored in your Firebase project configuration.');
    console.log('⚠️ Never commit sensitive keys to version control.\n');
    
    const SESSION_SECRET = await ask('Enter SESSION_SECRET (for session encryption) or press enter to generate random: ');
    const OPENAI_API_KEY = await ask('Enter OPENAI_API_KEY (for AI features) or press enter to skip: ');
    const CANVA_API_KEY = await ask('Enter CANVA_API_KEY (for Canva integration) or press enter to skip: ');
    const CANVA_APP_ID = await ask('Enter CANVA_APP_ID (for Canva integration) or press enter to skip: ');
    
    // Generate random SESSION_SECRET if not provided
    const finalSessionSecret = SESSION_SECRET || require('crypto').randomBytes(32).toString('hex');
    
    // Build the environment variables configuration command
    let envCommand = `firebase functions:config:set session.secret="${finalSessionSecret}"`;
    
    if (OPENAI_API_KEY) {
      envCommand += ` openai.apikey="${OPENAI_API_KEY}"`;
    }
    
    if (CANVA_API_KEY) {
      envCommand += ` canva.apikey="${CANVA_API_KEY}"`;
    }
    
    if (CANVA_APP_ID) {
      envCommand += ` canva.appid="${CANVA_APP_ID}"`;
    }
    
    // Set the environment variables in Firebase
    console.log('\n📤 Updating Firebase environment variables...');
    execSync(envCommand, { stdio: 'inherit' });
    
    console.log('✅ Environment variables updated successfully!');
    console.log('\n🔒 For security, these values are stored in Firebase and not on your local machine.');
    console.log('🔍 You can view them with: firebase functions:config:get');
    
  } catch (error) {
    console.error('❌ Error updating environment variables:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Run the main function
updateFirebaseEnv();