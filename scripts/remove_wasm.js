const fs = require('fs');
const path = require('path');

function removeUnusedWasm(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      removeUnusedWasm(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.wasm')) {
      // Keep query_engine_bg.sqlite.wasm and .prisma/client/query_engine_bg.wasm, remove mysql and postgresql
      const isKept = fullPath.includes('query_engine_bg.sqlite.wasm') || 
                     fullPath.includes('.prisma\\client\\query_engine_bg.wasm') || 
                     fullPath.includes('.prisma/client/query_engine_bg.wasm');
      if (!isKept) {
        try {
          fs.unlinkSync(fullPath);
          console.log('Removed unused WASM engine:', fullPath);
        } catch (e) {
          console.error('Error removing WASM:', fullPath, e.message);
        }
      }
    }
  }
}

removeUnusedWasm(path.join(__dirname, '../node_modules/@prisma/client'));
removeUnusedWasm(path.join(__dirname, '../node_modules/.prisma/client'));
