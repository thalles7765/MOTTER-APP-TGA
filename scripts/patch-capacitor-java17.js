const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const targets = [
  'android/app/capacitor.build.gradle',
  'node_modules/@capacitor',
  'node_modules/@capacitor-community'
];

const replacements = [
  [/JavaVersion\.VERSION_21/g, 'JavaVersion.VERSION_17'],
  [/jvmToolchain\(21\)/g, 'jvmToolchain(17)'],
  [/JavaLanguageVersion\.of\(21\)/g, 'JavaLanguageVersion.of(17)']
];

let changed = 0;

function patchFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  for (const [pattern, replacement] of replacements) {
    updated = updated.replace(pattern, replacement);
  }

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    changed += 1;
    console.log(`patched ${path.relative(root, filePath)}`);
  }
}

function walk(entryPath) {
  if (!fs.existsSync(entryPath)) {
    return;
  }

  const stat = fs.statSync(entryPath);
  if (stat.isFile()) {
    if (entryPath.endsWith('.gradle') || entryPath.endsWith(`${path.sep}update.js`)) {
      patchFile(entryPath);
    }
    return;
  }

  for (const item of fs.readdirSync(entryPath)) {
    const childPath = path.join(entryPath, item);
    const childStat = fs.statSync(childPath);

    if (childStat.isDirectory()) {
      walk(childPath);
    } else if (item.endsWith('.gradle') || item === 'update.js') {
      patchFile(childPath);
    }
  }
}

for (const target of targets) {
  walk(path.join(root, target));
}

console.log(`Capacitor Java 17 patch complete. Files changed: ${changed}`);
