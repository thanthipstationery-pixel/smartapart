/**
 * patch-wasm.js - Fix Prisma WASM for Cloudflare Workers
 * 
 * wasm-worker-loader.mjs uses dynamic import('./query_engine_bg.wasm') 
 * which wrangler does NOT follow for WASM bundling.
 * Fix: Use STATIC import so wrangler handles it via CompiledWasm rule.
 */
const fs = require('fs');
const path = require('path');

const PRISMA_CLIENT_DIR = path.join(__dirname, '../node_modules/.prisma/client');
const loaderMjs = path.join(PRISMA_CLIENT_DIR, 'wasm-worker-loader.mjs');

if (!fs.existsSync(loaderMjs)) {
  console.warn('[patch-wasm] wasm-worker-loader.mjs not found - skipping');
  process.exit(0);
}

// Use STATIC import so wrangler bundles the WASM via CompiledWasm rule
// We use import * as because Turbopack will fail if it's a default export.
const patchedContent = `// Patched by scripts/patch-wasm.js
// STATIC import instead of dynamic - wrangler handles static WASM imports via CompiledWasm rule
import * as wasmModule from './query_engine_bg.wasm';
export default Promise.resolve(wasmModule.default || wasmModule);
`;

const current = fs.readFileSync(loaderMjs, 'utf8');
if (current.includes("import * as wasmModule from './query_engine_bg.wasm'")) {
  console.log('[patch-wasm] wasm-worker-loader.mjs already patched with static import');
} else {
  fs.writeFileSync(loaderMjs, patchedContent, 'utf8');
  console.log('[patch-wasm] Patched wasm-worker-loader.mjs: dynamic→static import');
}

// Also revert wasm.js if we previously patched it back to original
const wasmJsPath = path.join(PRISMA_CLIENT_DIR, 'wasm.js');
const wasmJsContent = fs.readFileSync(wasmJsPath, 'utf8');
if (wasmJsContent.includes("import('#wasm-engine-loader')")) {
  const patchedWasmJs = wasmJsContent.replace(
    `getQueryEngineWasmModule: async () => {
    const loader = (await import('#wasm-engine-loader')).default
    const engine = (await loader).default
    return engine 
  }`,
    `getQueryEngineWasmModule: async () => {
    // Patched to avoid Turbopack/esbuild misresolving #wasm-engine-loader to wasm.js
    let loader = await import('./wasm-worker-loader.mjs');
    if (loader.default) loader = loader.default;
    let resolved = await loader;
    if (resolved && resolved.default) resolved = resolved.default;
    return resolved;
  }`
  );
  if (patchedWasmJs !== wasmJsContent) {
    fs.writeFileSync(wasmJsPath, patchedWasmJs, 'utf8');
    console.log('[patch-wasm] Patched wasm.js to avoid Turbopack/esbuild alias misresolution');
  }
} else if (wasmJsContent.includes('./wasm-worker-loader.mjs')) {
  console.log('[patch-wasm] wasm.js already patched for Turbopack/esbuild alias resolution');
}

console.log('[patch-wasm] Done.');
