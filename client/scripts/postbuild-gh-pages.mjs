// Prepares dist/ for GitHub Pages:
//  - .nojekyll so folders beginning with _ are served
//  - 404.html as an SPA fallback so deep links like /projects/task-flow work
import { copyFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const dist = join(process.cwd(), 'dist', 'portfolio', 'browser');

if (!existsSync(dist)) {
  console.error(`Build output not found at ${dist}. Run "ng build" first.`);
  process.exit(1);
}

writeFileSync(join(dist, '.nojekyll'), '');
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));

console.log('GitHub Pages post-build complete:');
console.log('  + .nojekyll');
console.log('  + 404.html (SPA fallback)');
