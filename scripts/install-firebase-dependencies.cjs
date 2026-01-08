#!/usr/bin/env node

/**
 * Install required dependencies for Firebase Functions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Directory where Firebase Functions are located
const FUNCTIONS_DIR = path.resolve(__dirname, '../functions');

console.log('📦 Installing Firebase Functions dependencies...');

// Ensure functions directory exists
if (!fs.existsSync(FUNCTIONS_DIR)) {
  console.error('❌ Functions directory not found!');
  process.exit(1);
}

// Required dependencies for Functions
const dependencies = [
  'firebase-admin',
  'firebase-functions',
  'express',
  'cors',
  'express-session',
  'memorystore',
  'passport',
  'passport-local',
  'drizzle-orm',
  '@neondatabase/serverless',
  'connect-pg-simple',
  'multer',
  'uuid'
];

// Required dev dependencies
const devDependencies = [
  '@types/express',
  '@types/cors',
  '@types/express-session',
  '@types/passport',
  '@types/passport-local'
];

try {
  // Install production dependencies
  console.log('Installing production dependencies...');
  execSync(`cd ${FUNCTIONS_DIR} && npm install --save ${dependencies.join(' ')}`, { 
    stdio: 'inherit' 
  });
  
  // Install development dependencies
  console.log('Installing development dependencies...');
  execSync(`cd ${FUNCTIONS_DIR} && npm install --save-dev ${devDependencies.join(' ')}`, { 
    stdio: 'inherit' 
  });
  
  console.log('✅ All Firebase Functions dependencies installed successfully');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error);
  process.exit(1);
}