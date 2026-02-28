/**
 * Delete all session files to start fresh
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionsDir = path.join(__dirname, 'storage', 'sessions');

console.log('🗑️  Cleaning up session files...');
console.log(`   Directory: ${sessionsDir}`);

try {
    const files = fs.readdirSync(sessionsDir);
    let count = 0;
    
    for (const file of files) {
        if (file.endsWith('.json')) {
            fs.unlinkSync(path.join(sessionsDir, file));
            count++;
            console.log(`   ✅ Deleted: ${file}`);
        }
    }
    
    console.log(`\n✅ Cleanup complete! Deleted ${count} session files.`);
    console.log('   Ready for fresh session tracking.\n');
} catch (error) {
    console.error('❌ Error during cleanup:', error.message);
}
