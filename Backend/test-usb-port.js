const fs = require('fs');

// Test if USB002 port actually exists and is writable
const port = 'USB002';

console.log('Testing USB002 port...');

try {
  // Check if file/port exists
  try {
    const stats = fs.statSync(port);
    console.log('Port exists:', stats);
  } catch (e) {
    console.log('Port does not exist as file:', e.message);
  }

  // Try to append a test string
  const testData = Buffer.from('TEST\n\n\n');
  
  try {
    fs.appendFileSync(port, testData);
    console.log('Successfully wrote test data to USB002');
    console.log('Check your printer now for "TEST"');
  } catch (writeError) {
    console.log('Failed to write to port:', writeError.message);
    console.log('Port might not be a valid USB port');
  }

  // Try to find actual USB printers
  console.log('\nLooking for actual USB devices...');
  
} catch (error) {
  console.error('Error:', error);
}

console.log('\nTry manually checking: Control Panel > Devices and Printers');














