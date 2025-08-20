#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 *
 * This script validates all required environment variables for the NestJS API
 * and provides clear feedback about missing or invalid configurations.
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Define required and optional environment variables
const REQUIRED_VARIABLES = [
  {
    name: 'MONGO_URL',
    description: 'MongoDB connection string',
    validator: (value) =>
      value &&
      (value.startsWith('mongodb://') || value.startsWith('mongodb+srv://')),
    example: 'mongodb://localhost:27017/pfe-api',
  },
  {
    name: 'API_KEY',
    description: 'API authentication key',
    validator: (value) => value && value.length >= 32,
    example: 'your-secure-api-key-here-min-32-chars',
  },
];

const OPTIONAL_VARIABLES = [
  {
    name: 'PORT',
    description: 'Server port number',
    validator: (value) =>
      !value ||
      (!isNaN(value) && parseInt(value) > 0 && parseInt(value) < 65536),
    example: '3000',
    defaultValue: '3000',
  },
  {
    name: 'NODE_ENV',
    description: 'Application environment',
    validator: (value) =>
      !value || ['development', 'production', 'test'].includes(value),
    example: 'development',
    defaultValue: 'development',
  },
  {
    name: 'ALLOWED_ORIGINS',
    description: 'CORS allowed origins (comma-separated)',
    validator: (value) => true, // Any value is acceptable
    example: 'http://localhost:3000,https://yourdomain.com',
  },
];

// Firebase variables (conditional - only required if Firebase is used)
const FIREBASE_VARIABLES = [
  {
    name: 'FIREBASE_PROJECT_ID',
    description: 'Firebase project ID',
    validator: (value) => !value || (value && value.length > 0),
    example: 'your-firebase-project-id',
  },
  {
    name: 'FIREBASE_CLIENT_EMAIL',
    description: 'Firebase service account client email',
    validator: (value) =>
      !value ||
      (value &&
        value.includes('@') &&
        value.includes('.iam.gserviceaccount.com')),
    example: 'firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com',
  },
  {
    name: 'FIREBASE_PRIVATE_KEY',
    description: 'Firebase service account private key',
    validator: (value) =>
      !value || (value && value.includes('-----BEGIN PRIVATE KEY-----')),
    example:
      '-----BEGIN PRIVATE KEY-----\\nYourPrivateKeyHere\\n-----END PRIVATE KEY-----',
  },
];

/**
 * Validates a single environment variable
 */
function validateVariable(variable) {
  const value = process.env[variable.name];
  const isValid = variable.validator(value);

  return {
    name: variable.name,
    value: value ? '[SET]' : '[NOT SET]',
    isValid,
    isSet: !!value,
    description: variable.description,
    example: variable.example,
    defaultValue: variable.defaultValue,
  };
}

/**
 * Checks if Firebase is being used in the project
 */
function isFirebaseUsed() {
  try {
    // Check if Firebase config file exists
    const firebaseConfigPath = path.join(
      process.cwd(),
      'src',
      'configs',
      'firebase.config.ts',
    );
    return fs.existsSync(firebaseConfigPath);
  } catch (error) {
    return false;
  }
}

/**
 * Main validation function
 */
function validateEnvironment() {
  console.log('🔍 Validating environment variables...\n');

  const results = {
    required: REQUIRED_VARIABLES.map(validateVariable),
    optional: OPTIONAL_VARIABLES.map(validateVariable),
    firebase: FIREBASE_VARIABLES.map(validateVariable),
  };

  const firebaseUsed = isFirebaseUsed();

  // Check required variables
  const missingRequired = results.required.filter((r) => !r.isSet);
  const invalidRequired = results.required.filter((r) => r.isSet && !r.isValid);

  // Check Firebase variables if Firebase is used
  const missingFirebase = firebaseUsed
    ? results.firebase.filter((r) => !r.isSet)
    : [];
  const invalidFirebase = firebaseUsed
    ? results.firebase.filter((r) => r.isSet && !r.isValid)
    : [];

  // Check optional variables for validity (if set)
  const invalidOptional = results.optional.filter((r) => r.isSet && !r.isValid);

  // Print results
  console.log('📋 VALIDATION RESULTS');
  console.log('='.repeat(50));

  // Required variables
  console.log('\n🔴 REQUIRED VARIABLES:');
  results.required.forEach((r) => {
    const status = !r.isSet
      ? '❌ MISSING'
      : r.isValid
        ? '✅ VALID'
        : '⚠️  INVALID';
    console.log(`  ${r.name}: ${status}`);
    if (!r.isSet || !r.isValid) {
      console.log(`    Description: ${r.description}`);
      console.log(`    Example: ${r.example}`);
    }
  });

  // Firebase variables
  if (firebaseUsed) {
    console.log('\n🔥 FIREBASE VARIABLES:');
    results.firebase.forEach((r) => {
      const status = !r.isSet
        ? '❌ MISSING'
        : r.isValid
          ? '✅ VALID'
          : '⚠️  INVALID';
      console.log(`  ${r.name}: ${status}`);
      if (!r.isSet || !r.isValid) {
        console.log(`    Description: ${r.description}`);
        console.log(`    Example: ${r.example}`);
      }
    });
  } else {
    console.log(
      '\n🔥 FIREBASE: Not detected in project (skipping Firebase variables)',
    );
  }

  // Optional variables
  console.log('\n🔵 OPTIONAL VARIABLES:');
  results.optional.forEach((r) => {
    const status = !r.isSet
      ? `⚪ NOT SET (default: ${r.defaultValue || 'none'})`
      : r.isValid
        ? '✅ VALID'
        : '⚠️  INVALID';
    console.log(`  ${r.name}: ${status}`);
    if (r.isSet && !r.isValid) {
      console.log(`    Description: ${r.description}`);
      console.log(`    Example: ${r.example}`);
    }
  });

  // Summary
  console.log('\n📊 SUMMARY');
  console.log('='.repeat(50));

  const totalIssues =
    missingRequired.length +
    invalidRequired.length +
    missingFirebase.length +
    invalidFirebase.length +
    invalidOptional.length;

  if (totalIssues === 0) {
    console.log('✅ All environment variables are properly configured!');
    console.log(
      '\n🚀 Your application should start without environment issues.',
    );
    return true;
  } else {
    console.log(`❌ Found ${totalIssues} environment configuration issue(s):`);

    if (missingRequired.length > 0) {
      console.log(
        `   - ${missingRequired.length} missing required variable(s)`,
      );
    }
    if (invalidRequired.length > 0) {
      console.log(
        `   - ${invalidRequired.length} invalid required variable(s)`,
      );
    }
    if (missingFirebase.length > 0) {
      console.log(
        `   - ${missingFirebase.length} missing Firebase variable(s)`,
      );
    }
    if (invalidFirebase.length > 0) {
      console.log(
        `   - ${invalidFirebase.length} invalid Firebase variable(s)`,
      );
    }
    if (invalidOptional.length > 0) {
      console.log(
        `   - ${invalidOptional.length} invalid optional variable(s)`,
      );
    }

    console.log('\n🔧 NEXT STEPS:');
    console.log('1. Create/update your .env file with the missing variables');
    console.log('2. Use .env.example as a template');
    console.log('3. Ensure all values match the expected format');
    console.log('4. Re-run this validation script');

    return false;
  }
}

/**
 * Generate .env.example if it doesn't exist
 */
function generateEnvExample() {
  const envExamplePath = path.join(process.cwd(), '.env.example');

  if (fs.existsSync(envExamplePath)) {
    console.log('ℹ️  .env.example already exists');
    return;
  }

  console.log('📝 Generating .env.example...');

  const content = [
    '# Environment Configuration',
    '# Copy this file to .env and fill in your actual values',
    '',
    '# Application Environment',
    'NODE_ENV=development',
    'PORT=3000',
    '',
    '# Database Configuration',
    'MONGO_URL=mongodb://localhost:27017/pfe-api',
    '',
    '# API Security',
    'API_KEY=your-secure-api-key-here-min-32-chars',
    '',
    '# CORS Configuration (optional)',
    'ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4200',
    '',
    '# Firebase Configuration (only if using Firebase)',
    'FIREBASE_PROJECT_ID=your-firebase-project-id',
    'FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com',
    'FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYourPrivateKeyHere\\n-----END PRIVATE KEY-----"',
    '',
  ].join('\n');

  fs.writeFileSync(envExamplePath, content);
  console.log('✅ .env.example created successfully');
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--generate-example')) {
    generateEnvExample();
    process.exit(0);
  }

  const isValid = validateEnvironment();
  process.exit(isValid ? 0 : 1);
}

module.exports = { validateEnvironment, generateEnvExample };
