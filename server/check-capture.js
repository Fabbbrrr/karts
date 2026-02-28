/**
 * Quick check to see if data-capture.js is working
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const captureDir = path.join(__dirname, 'storage', 'capture');

if (!fs.existsSync(captureDir)) {
    console.log('❌ Capture directory does not exist yet');
    process.exit(1);
}

const files = fs.readdirSync(captureDir);
console.log(`\n📁 Capture directory: ${captureDir}`);
console.log(`📊 Files found: ${files.length}\n`);

if (files.length === 0) {
    console.log('⚠️  No files yet - this is normal!');
    console.log('   Files are only created when the capture script stops.');
    console.log('   Press Ctrl+C in the terminal running data-capture.js to save files.\n');
} else {
    files.forEach(file => {
        const filePath = path.join(captureDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
        console.log(`   📄 ${file}`);
        console.log(`      Size: ${sizeMB} MB`);
        console.log(`      Modified: ${stats.mtime.toLocaleString()}\n`);
    });
}




