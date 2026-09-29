import { execFileSync, spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const OUT = 'build/types';
const NAME = '@enonic-types/lib-graphql';
const EXPECTED_FILES = [
    'LICENSE.txt',
    'README.md',
    'graphql-connection.d.ts',
    'graphql-rx.d.ts',
    'graphql.d.ts',
    'index.d.ts',
    'package.json',
];
const CONSUMER_PROGRAMS = ['types/test/tsconfig.json', 'types/test/tsconfig.require.json'];

const version = readFileSync('gradle.properties', 'utf8')
    .match(/^version=(.+)$/m)?.[1]
    .trim();

// npm packs silently when a `files` entry names a missing file, so ask npm what it would ship
const [pack] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
        cwd: OUT,
        shell: process.platform === 'win32',
        encoding: 'utf8',
    }),
);
const packed = pack.files.map((file) => file.path).sort();

const problems = [];
if (pack.name !== NAME) {
    problems.push(`name is ${pack.name}, expected ${NAME}`);
}
if (pack.version !== version) {
    problems.push(`version is ${pack.version}, expected ${version} from gradle.properties`);
}
if (packed.join(',') !== EXPECTED_FILES.join(',')) {
    problems.push(`npm would publish [${packed.join(', ')}], expected [${EXPECTED_FILES.join(', ')}]`);
}
if (problems.length > 0) {
    console.error(problems.join('\n'));
    process.exit(1);
}
console.log(`${pack.name}@${pack.version}: packlist ok (${packed.join(', ')})`);

// The project's TypeScript, not whatever tsc is on PATH
const typescriptManifest = createRequire(import.meta.url).resolve('typescript/package.json');
const tsc = join(dirname(typescriptManifest), JSON.parse(readFileSync(typescriptManifest, 'utf8')).bin.tsc);

for (const project of CONSUMER_PROGRAMS) {
    const { status } = spawnSync(process.execPath, [tsc, '-p', project], { stdio: 'inherit' });
    if (status !== 0) {
        process.exit(status ?? 1);
    }
    console.log(`${project}: ok`);
}
