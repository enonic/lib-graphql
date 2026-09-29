import { existsSync } from 'node:fs';
import { copyFile, mkdir, readFile, rm, writeFile } from 'node:fs/promises';

const MODULES = ['graphql', 'graphql-connection', 'graphql-rx'];
const DTS = 'build/types-dts';
const OUT = 'build/types';

// Same version source as Gradle and release-tools
const properties = await readFile('gradle.properties', 'utf8');
const version = properties.match(/^version=(.+)$/m)?.[1].trim();
if (!version) {
    console.error('gradle.properties has no version');
    process.exit(1);
}

const missing = MODULES.map((name) => `${DTS}/${name}.d.ts`).filter((file) => !existsSync(file));
if (missing.length > 0) {
    console.error(`${missing.join(', ')} missing; run tsc -p tsconfig.types.json first`);
    process.exit(1);
}

await rm(OUT, { recursive: true, force: true });
await mkdir(OUT, { recursive: true });

for (const name of MODULES) {
    await copyFile(`${DTS}/${name}.d.ts`, `${OUT}/${name}.d.ts`);
}

// The `types` entry is all a consumer's tsconfig `types` loads, so it has to reach every module's
// XpLibraries augmentation, or require() of the modules it leaves out stays untyped
const [main, ...siblings] = MODULES;
const imports = siblings.map((name) => `import type {} from './${name}';\n`).join('');
await writeFile(`${OUT}/index.d.ts`, `export * from './${main}';\n${imports}`);

await copyFile('types/README.md', `${OUT}/README.md`);
await copyFile('LICENSE.txt', `${OUT}/LICENSE.txt`);

const pkg = JSON.parse(await readFile('types/package.json', 'utf8'));
pkg.version = version;
await writeFile(`${OUT}/package.json`, `${JSON.stringify(pkg, null, 4)}\n`);

console.log(`${pkg.name}@${version} -> ${OUT}`);
