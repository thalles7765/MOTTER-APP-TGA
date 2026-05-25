const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const buildGradlePath = path.join(projectRoot, 'android', 'app', 'build.gradle');
const flavor = process.argv[2] || 'debug';

const source = fs.readFileSync(buildGradlePath, 'utf8');
const versionCodeMatch = source.match(/versionCode\s*=\s*(\d+)/);
const versionNameMatch = source.match(/versionName\s*=\s*"([^"]+)"/);

if (!versionCodeMatch || !versionNameMatch) {
  console.error('Nao foi possivel localizar versionCode/versionName em android/app/build.gradle.');
  process.exit(1);
}

const nextVersionCode = Number(versionCodeMatch[1]) + 1;
const currentVersionName = versionNameMatch[1];
const nameParts = currentVersionName.split('.').map((part) => Number(part));
const major = Number.isFinite(nameParts[0]) ? nameParts[0] : 1;
const minor = Number.isFinite(nameParts[1]) ? nameParts[1] : 0;
const nextVersionName = `${major}.${minor}.${nextVersionCode}`;

const updated = source
  .replace(/versionCode\s*=\s*\d+/, `versionCode = ${nextVersionCode}`)
  .replace(/versionName\s*=\s*"[^"]+"/, `versionName = "${nextVersionName}"`);

fs.writeFileSync(buildGradlePath, updated);

console.log(`Android debug ${flavor}: versionCode ${versionCodeMatch[1]} -> ${nextVersionCode}`);
console.log(`Android debug ${flavor}: versionName ${currentVersionName} -> ${nextVersionName}`);
