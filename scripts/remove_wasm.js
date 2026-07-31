const fs = require('fs');
const path = require('path');

function removeWasm(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeWasm(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.wasm') && entry.name.includes('query_engine')) {
      try {
        fs.unlinkSync(fullPath);
        console.log('Removed unused WASM engine:', fullPath);
      } catch (e) {
        console.error('Failed to remove:', fullPath, e.message);
      }
    }
  }
}

removeWasm(path.join(__dirname, '../node_modules/@prisma/client'));
removeWasm(path.join(__dirname, '../node_modules/.prisma/client'));
