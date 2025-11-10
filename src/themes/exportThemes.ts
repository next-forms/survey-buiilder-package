// resources/js/packages/survey-form-package/src/themes/exportThemes.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// IMPORTANT: include the .ts extension
// @ts-ignore  -- Node ESM requires .ts extension at runtime
import { themes } from './index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Strip undefined (e.g., "custom": undefined)
const replacer = (_k: string, v: unknown) => (v === undefined ? null : v);

// Remove entries whose value is falsy (e.g., custom: undefined/null)
const cleaned: Record<string, unknown> = {};
for (const [k, v] of Object.entries(themes)) {
  if (v) cleaned[k] = v;
}

const outFile = path.join(__dirname, 'themes.json');
fs.writeFileSync(outFile, JSON.stringify(cleaned, replacer, 2), 'utf8');
console.log(`✅ Themes exported to: ${outFile}`);
