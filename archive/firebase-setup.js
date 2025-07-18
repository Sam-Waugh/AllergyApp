#!/usr/bin/env node

/**
 * Firebase Production Setup Script
 * 
 * This script helps you switch from mock data to real Firebase production mode.
 * Run this after setting up your Firebase project and updating environment variables.
 */

const fs = require('fs');
const path = require('path');

const FRONTEND_ENV_PATH = path.join(__dirname, 'frontend', '.env');
const BACKEND_ENV_PATH = path.join(__dirname, 'backend', '.env');

function updateEnvFile(filePath, updates) {
  try {
    let envContent = fs.readFileSync(filePath, 'utf8');
    
    Object.entries(updates).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (envContent.match(regex)) {
        envContent = envContent.replace(regex, `${key}=${value}`);
      } else {
        envContent += `\n${key}=${value}`;
      }
    });
    
    fs.writeFileSync(filePath, envContent);
    console.log(`✅ Updated ${filePath}`);
  } catch (error) {
    console.error(`❌ Failed to update ${filePath}:`, error.message);
  }
}

function enableProductionMode() {
  console.log('🚀 Switching to Firebase Production Mode...\n');
  
  // Frontend updates
  const frontendUpdates = {
    'EXPO_PUBLIC_FIREBASE_TEST_MODE': 'false',
    'EXPO_PUBLIC_USE_FIRESTORE_EMULATOR': 'false',
    'EXPO_PUBLIC_ENV': 'production'
  };
  
  // Backend updates
  const backendUpdates = {
    'FIREBASE_TEST_MODE': 'false'
  };
  
  updateEnvFile(FRONTEND_ENV_PATH, frontendUpdates);
  updateEnvFile(BACKEND_ENV_PATH, backendUpdates);
  
  console.log('\n✅ Production mode enabled!');
  console.log('\n⚠️  IMPORTANT NEXT STEPS:');
  console.log('1. Make sure you\'ve updated Firebase config in frontend/.env');
  console.log('2. Make sure you\'ve updated Firebase Admin SDK config in backend/.env');
  console.log('3. Restart both frontend and backend servers');
  console.log('4. Test data persistence by creating a child and daily log');
  console.log('\nTo restart servers:');
  console.log('   Frontend: npm start in frontend/ directory');
  console.log('   Backend: uvicorn main:app --reload in backend/ directory');
}

function enableTestMode() {
  console.log('🧪 Switching to Firebase Test Mode (Mock Data)...\n');
  
  // Frontend updates
  const frontendUpdates = {
    'EXPO_PUBLIC_FIREBASE_TEST_MODE': 'true',
    'EXPO_PUBLIC_USE_FIRESTORE_EMULATOR': 'true',
    'EXPO_PUBLIC_ENV': 'development'
  };
  
  // Backend updates
  const backendUpdates = {
    'FIREBASE_TEST_MODE': 'true'
  };
  
  updateEnvFile(FRONTEND_ENV_PATH, frontendUpdates);
  updateEnvFile(BACKEND_ENV_PATH, backendUpdates);
  
  console.log('\n✅ Test mode enabled!');
  console.log('\n📝 Mock data will be used and persisted to AsyncStorage');
  console.log('💡 This is safe for development and testing');
}

function checkCurrentMode() {
  try {
    const frontendEnv = fs.readFileSync(FRONTEND_ENV_PATH, 'utf8');
    const backendEnv = fs.readFileSync(BACKEND_ENV_PATH, 'utf8');
    
    const frontendTestMode = frontendEnv.match(/EXPO_PUBLIC_FIREBASE_TEST_MODE=(.*)$/m)?.[1] === 'true';
    const backendTestMode = backendEnv.match(/FIREBASE_TEST_MODE=(.*)$/m)?.[1] === 'true';
    
    console.log('📊 Current Firebase Mode Status:');
    console.log(`   Frontend Test Mode: ${frontendTestMode ? '🧪 ENABLED (Mock Data)' : '🚀 DISABLED (Real Firebase)'}`);
    console.log(`   Backend Test Mode:  ${backendTestMode ? '🧪 ENABLED (Mock Data)' : '🚀 DISABLED (Real Firebase)'}`);
    
    if (frontendTestMode !== backendTestMode) {
      console.log('\n⚠️  WARNING: Frontend and backend modes don\'t match!');
    }
    
    return { frontendTestMode, backendTestMode };
  } catch (error) {
    console.error('❌ Failed to check current mode:', error.message);
    return { frontendTestMode: null, backendTestMode: null };
  }
}

function showHelp() {
  console.log(`
🏥 Firebase Setup Script for Allergy App

Usage: node firebase-setup.js [command]

Commands:
  production    Switch to Firebase production mode (real data persistence)
  test         Switch to test mode (mock data)
  status       Check current mode status
  help         Show this help message

Examples:
  node firebase-setup.js production    # Enable real Firebase
  node firebase-setup.js test          # Enable mock data mode
  node firebase-setup.js status        # Check current configuration
`);
}

// Main execution
const command = process.argv[2];

switch (command) {
  case 'production':
    enableProductionMode();
    break;
  case 'test':
    enableTestMode();
    break;
  case 'status':
    checkCurrentMode();
    break;
  case 'help':
  case '--help':
  case '-h':
    showHelp();
    break;
  default:
    console.log('🏥 Firebase Setup Script\n');
    checkCurrentMode();
    console.log('\nRun "node firebase-setup.js help" for usage information');
}
