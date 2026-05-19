/**
 * Windows Service Uninstaller for Manpasand POS Print Server
 * 
 * Run: node uninstall-service.js
 */

const path = require('path');
const { Service } = require('node-windows');

const scriptPath = path.resolve(__dirname, 'server.js');

const svc = new Service({
  name: 'Manpasand Print Server',
  script: scriptPath
});

// Listen for the "uninstall" event
svc.on('uninstall', function() {
  console.log('✅ Print Server service uninstalled successfully!');
});

// Listen for errors
svc.on('error', function(err) {
  console.error('❌ Error uninstalling service:', err);
  console.error('');
  console.error('Common issues:');
  console.error('1. Run this script as Administrator');
  console.error('2. Stop the service first if it\'s running');
});

// Uninstall the service
console.log('🗑️  Uninstalling Manpasand Print Server service...');
svc.uninstall();






