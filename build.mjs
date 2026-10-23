// Packs the files the extension ships into dist/per-piece-<version>.zip for the store upload.
// The repo root is also the unpacked extension, so this keeps tests, notes and store art out of
// the package. Fixed timestamps: the same source gives the same bytes.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8'));
const popup = manifest.action.default_popup;
const popupScripts = [...fs.readFileSync(path.join(root, popup), 'utf8').matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

const files = [...new Set([
  'manifest.json',
  ...Object.values(manifest.icons),
  ...Object.values(manifest.action.default_icon),
  popup,
  ...popupScripts,
  ...manifest.content_scripts.flatMap(c => [...c.js, ...(c.css || [])]),
])].sort();

const problems = [
  ...files.filter(f => !fs.existsSync(path.join(root, f))).map(f => `missing file ${f}`),
  manifest.manifest_version !== 3 && 'manifest_version must be 3',
  manifest.name.length > 75 && 'name is over 75 characters',
  manifest.description.length > 132 && 'description is over 132 characters',
  !/^\d+(\.\d+){0,3}$/.test(manifest.version) && 'version is not dotted numbers',
  manifest.host_permissions && 'host_permissions are not expected; sites are content-script matches',
].filter(Boolean);
if (problems.length) throw new Error('manifest: ' + problems.join('; '));

function zip(names) {
  const parts = [];
  const central = [];
  let offset = 0;
  for (const name of names) {
    const data = fs.readFileSync(path.join(root, name));
    const packed = zlib.deflateRawSync(data, { level: 9 });
    const crc = zlib.crc32(data);
    const fileName = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);   // UTF-8 names
    local.writeUInt16LE(8, 8);        // deflate
    local.writeUInt16LE(0x21, 12);    // 1980-01-01
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(fileName.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(0x0800, 8);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(0x21, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(packed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(fileName.length, 28);
    entry.writeUInt32LE(offset, 42);
    parts.push(local, fileName, packed);
    central.push(entry, fileName);
    offset += local.length + fileName.length + packed.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(names.length, 8);
  end.writeUInt16LE(names.length, 10);
  end.writeUInt32LE(cd.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, cd, end]);
}

const out = path.join(root, 'dist', `per-piece-${manifest.version}.zip`);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, zip(files));
console.log(`dist/${path.basename(out)}: ${files.length} files, ${fs.statSync(out).size} bytes`);
console.log(files.join('\n'));
