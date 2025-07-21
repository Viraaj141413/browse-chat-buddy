#!/usr/bin/env node

/**
 * Start script for the BROWSER server
 * This script ensures all required dependencies are available and starts the real browser automation server
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log(`
🚀 Starting BROWSER Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Checking dependencies...
`);

// Check if BROWSER.js exists
if (!fs.existsSync('./BROWSER.js')) {
  console.error('❌ BROWSER.js not found! Please make sure the file exists.');
  process.exit(1);
}

// Set environment variables if not set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.BROWSER_PORT = process.env.BROWSER_PORT || '8080';
process.env.SCREENSHOT_INTERVAL = process.env.SCREENSHOT_INTERVAL || '1000';

// Supabase configuration
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://ggojmfbpsqzcyazwnibd.supabase.co';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdnb2ptZmJwc3F6Y3lhenduaWJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NDIwNTEsImV4cCI6MjA2ODUxODA1MX0.1Q7rWqqg3REYUI7pqT36hJXkKbO2njS3ZhVpvtHWaKw';

console.log('✅ Environment configured');
console.log('🌐 Starting real browser automation server...\n');

// Start the BROWSER server
const browserProcess = spawn('node', ['BROWSER.js'], {
  stdio: 'inherit',
  env: process.env
});

// Handle process events
browserProcess.on('error', (error) => {
  console.error('❌ Failed to start BROWSER server:', error);
  process.exit(1);
});

browserProcess.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`❌ BROWSER server exited with code ${code}`);
  }
  if (signal) {
    console.log(`📡 BROWSER server terminated by signal ${signal}`);
  }
  process.exit(code || 0);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down BROWSER server...');
  browserProcess.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Terminating BROWSER server...');
  browserProcess.kill('SIGTERM');
});