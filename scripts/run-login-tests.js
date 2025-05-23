/**
 * Login Test Runner
 * 
 * This script runs the login tests for the Sepet Takip application.
 * It tests all four user roles and verifies the login functionality.
 */

// Enable ES modules support to use import/export syntax
import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __dirname = dirname(fileURLToPath(import.meta.url));

// Path to the TypeScript test file
const testFilePath = join(__dirname, '..', 'tests', 'login-test.ts');

console.log('🚀 Running login tests...');
console.log(`📂 Test file: ${testFilePath}`);

// Use ts-node to run the TypeScript test file
const child = spawn('npx', ['ts-node', testFilePath], {
  stdio: 'inherit',
  shell: true
});

child.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Login tests completed successfully!');
  } else {
    console.error(`❌ Login tests failed with code ${code}`);
  }
});

// Handle errors
child.on('error', (error) => {
  console.error('❌ Error running login tests:', error);
}); 