import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);

const backupFiles = [
  "/Users/mac/Desktop/pppa/Manpasand-Pos-/Backend/.env.backup"
];

console.log('Found backup files:');
backupFiles.forEach((f, i) => console.log(`${i+1}. ${f}`));
console.log('\nTo restore, run: npx ts-node scripts/restore-database-from-backup.ts <backup-file-path>');
