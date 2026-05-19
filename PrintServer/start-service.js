/**
 * Start the Windows Service
 */

const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Starting Manpasand Print Server service...');
console.log('');

// Try using Windows sc command first (more reliable)
exec('sc start "Manpasand Print Server"', (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error starting service:', error.message);
    console.error('');
    
    // If sc command fails, try using node-windows
    console.log('Trying alternative method...');
    
    try {
      const { Service } = require('node-windows');
      const scriptPath = path.resolve(__dirname, 'server.js');

      const svc = new Service({
        name: 'Manpasand Print Server',
        script: scriptPath
      });

      svc.on('start', function() {
        console.log('✅ Print Server service started!');
        console.log('🌐 Server running on http://localhost:3001');
      });

      svc.on('error', function(err) {
        console.error('❌ Error starting service:', err);
        console.error('');
        console.error('Troubleshooting:');
        console.error('1. Make sure service is installed: node install-service.js');
        console.error('2. Run this script as Administrator');
        console.error('3. Check Event Viewer for errors: eventvwr.msc');
        console.error('4. Check if port 3001 is in use: netstat -ano | findstr :3001');
      });

      svc.start();
    } catch (requireError) {
      console.error('❌ Could not load node-windows:', requireError.message);
      console.error('');
      console.error('Please run as Administrator or check service status in Services (services.msc)');
    }
  } else {
    console.log(stdout);
    console.log('✅ Service start command sent!');
    console.log('');
    console.log('Waiting 3 seconds...');
    
    setTimeout(() => {
      exec('sc query "Manpasand Print Server"', (queryError, queryStdout) => {
        if (!queryError) {
          console.log(queryStdout);
          
          if (queryStdout.includes('RUNNING')) {
            console.log('');
            console.log('✅ Service is RUNNING!');
            console.log('🌐 Server should be available at http://localhost:3001');
            console.log('');
            console.log('Test it:');
            console.log('  http://localhost:3001/health');
            console.log('  http://localhost:3001/printers');
          } else {
            console.log('');
            console.log('⚠️  Service may not have started. Check Event Viewer for errors.');
          }
        }
      });
    }, 3000);
  }
});

