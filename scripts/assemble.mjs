import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const parts = JSON.parse(await readFile(join(root, 'scripts/parts.json'), 'utf8'));
const source = (await Promise.all(parts.map(name =>
  readFile(join(root, 'src/game/parts', name), 'utf8')
))).join('');
const demo = (await readFile(join(root, 'src/assets/audio/demo.ogg'))).toString('base64');
const marker = '__POISON_DEMO_AUDIO_BASE64__';
if (source.split(marker).length !== 2) throw new Error('Missing or duplicate demo audio marker');
const output = source.replace(marker, demo);
const dest = join(root, 'src/generated/poison-runtime.js');
await mkdir(dirname(dest), { recursive: true });
await writeFile(dest, output, 'utf8');
console.log(`Assembled ${parts.length} game sections (${output.length.toLocaleString()} characters).`);
