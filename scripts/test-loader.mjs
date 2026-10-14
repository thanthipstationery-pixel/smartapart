import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const rootUrl = pathToFileURL(process.cwd() + '/').href;
globalThis.require = createRequire(rootUrl);

export function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') {
    return nextResolve('next/server.js', context);
  }
  if (specifier.startsWith('@/')) {
    const sub = specifier.slice(2);
    const resolvedUrl = new URL('./src/' + sub + '.ts', rootUrl).href;
    return nextResolve(resolvedUrl, context);
  }
  return nextResolve(specifier, context);
}
