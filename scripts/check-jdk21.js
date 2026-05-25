const { spawnSync } = require('node:child_process');

const javaHome = process.env.JAVA_HOME || '';

if (!javaHome) {
  console.error('JAVA_HOME nao esta definido. Configure para um JDK 21 LTS antes do build Android.');
  process.exit(1);
}

const result = spawnSync(`${javaHome}\\bin\\java.exe`, ['-version'], { encoding: 'utf8' });
const output = `${result.stdout || ''}${result.stderr || ''}`;

if (!/version "21\./.test(output) && !/openjdk version "21\./.test(output)) {
  console.error(`JAVA_HOME deve apontar para JDK 21 LTS. Atual: ${javaHome}`);
  console.error(output.trim());
  process.exit(1);
}

console.log(`JDK 21 OK: ${javaHome}`);
