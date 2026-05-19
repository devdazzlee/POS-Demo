/**
 * Windows Service Installer for Manpasand POS Print Server
 * 
 * This script installs the print server as a Windows service that:
 * - Starts automatically when Windows boots
 * - Automatically restarts if it crashes or closes
 * - Runs in the background without user interaction
 * 
 * Run: node install-service.js
 * Uninstall: node uninstall-service.js
 */

const path = require('path');
const os = require('os');
const fs = require('fs');

// Check if node-windows is installed
let Service;
try {
  Service = require('node-windows').Service;
} catch (error) {
  console.error('');
  console.error('❌ ERROR: node-windows module not found!');
  console.error('');
  console.error('Please install it first:');
  console.error('  npm install node-windows --save');
  console.error('');
  console.error('Or use the batch file which installs it automatically:');
  console.error('  install-service.bat');
  console.error('');
  process.exit(1);
}

// Get the directory where this script is located
const scriptPath = path.resolve(__dirname, 'server.js');

// Create a new service object
const svc = new Service({
  name: 'Manpasand Print Server',
  description: 'Local print server for Manpasand POS receipt printing',
  script: scriptPath,
  nodeOptions: [
    '--max_old_space_size=4096'
  ],
  env: [
    {
      name: "NODE_ENV",
      value: "production"
    }
  ],
  // Set to start automatically on Windows boot - no user interaction required
  grow: 0.5,
  wait: 2,
  maxRestarts: 5
});

// Listen for the "install" event, which indicates the process is available as a service
svc.on('install', function() {
  console.log('✅ Print Server service installed successfully!');
  
  // Set startup type to Automatic - CRITICAL for auto-start
  const { execSync } = require('child_process');
  
  // Wait a moment for service to be fully registered
  setTimeout(() => {
    try {
      console.log('🔧 Setting startup type to AUTOMATIC...');
      
      // Use sc config to set startup type - this is the most reliable method
      execSync('sc config "Manpasand Print Server" start= auto', { 
        stdio: 'inherit',
        windowsHide: true 
      });
      
      // Verify it was set correctly
      const verifyOutput = execSync('sc qc "Manpasand Print Server"', { 
        encoding: 'utf8',
        windowsHide: true 
      });
      
      if (verifyOutput.includes('AUTO_START') || verifyOutput.includes('2')) {
        console.log('✅ Startup type confirmed: AUTOMATIC - will start on boot!');
      } else {
        console.log('⚠️  Startup type may not be set correctly');
      }
      
      // Configure recovery options (auto-restart on failure)
      try {
        execSync('sc failure "Manpasand Print Server" reset= 86400 actions= restart/60000/restart/60000/restart/60000', {
          stdio: 'inherit',
          windowsHide: true
        });
        console.log('✅ Recovery options configured (auto-restart on failure)');
      } catch (recoveryError) {
        console.log('⚠️  Could not configure recovery options (non-critical)');
      }
      
      // Start the service automatically
      console.log('🚀 Starting service...');
      execSync('sc start "Manpasand Print Server"', { 
        stdio: 'inherit',
        windowsHide: true 
      });
      
      // Wait and verify service started
      setTimeout(() => {
        try {
          const statusOutput = execSync('sc query "Manpasand Print Server"', {
            encoding: 'utf8',
            windowsHide: true
          });
          
          if (statusOutput.includes('RUNNING')) {
            console.log('✅ Service started successfully and is RUNNING!');
          } else {
            console.log('⚠️  Service may still be starting...');
          }
        } catch (statusError) {
          console.log('⚠️  Could not verify service status');
        }
      }, 3000);
      
    } catch (error) {
      console.log('⚠️  Could not set startup type automatically');
      console.log('   Error: ' + error.message);
      console.log('   Run manually: sc config "Manpasand Print Server" start= auto');
    }
  }, 2000);
  
  console.log('');
  console.log('📋 Service will start automatically on Windows boot');
  console.log('🔄 Service will auto-restart if it crashes or closes');
  console.log('');
  console.log('Test it: http://localhost:3001/health');
  console.log('');
  console.log('To uninstall the service, run:');
  console.log('  node uninstall-service.js');
});

// Listen for the "alreadyinstalled" event
svc.on('alreadyinstalled', function() {
  console.log('⚠️  Service is already installed!');
  console.log('To reinstall, first run: node uninstall-service.js');
});

// Listen for errors during installation
svc.on('error', function(err) {
  console.error('❌ Error installing service:', err);
  console.error('');
  console.error('Common issues:');
  console.error('1. Run this script as Administrator');
  console.error('2. Make sure node-windows is installed: npm install node-windows --save');
  console.error('3. Check if the service is already installed');
});

// Install the service
console.log('🔧 Installing Manpasand Print Server as Windows service...');
console.log('📁 Service path: ' + scriptPath);
console.log('');

// Check if running as administrator
if (os.userInfo().username === 'Administrator' || process.getuid && process.getuid() === 0) {
  svc.install();
} else {
  console.log('⚠️  WARNING: This script should be run as Administrator');
  console.log('⚠️  Right-click and select "Run as administrator"');
  console.log('');
  console.log('Installing anyway (may fail if not admin)...');
  console.log('');
  svc.install();
}

