import { access, readFile, writeFile } from 'node:fs/promises';

const sourceCandidates = [
  new URL('../cardinalops/common/src/data/mitreMap.json', import.meta.url),
  new URL('../common/src/data/mitreMap.json', import.meta.url),
];
let sourcePath;
for (const candidate of sourceCandidates) {
  try {
    await access(candidate);
    sourcePath = candidate;
    break;
  } catch {
    continue;
  }
}
if (!sourcePath) throw new Error('Could not find common/src/data/mitreMap.json in the CardinalOps repository.');
const destinationPath = new URL('./mitre-data.js', import.meta.url);
const mitreMap = JSON.parse(await readFile(sourcePath, 'utf8'));

const tactics = mitreMap.tactics.map(({ id, name, techniques = [] }) => ({
  id,
  name,
  techniques: techniques.map(({ id: techniqueId, name: techniqueName, subTechniques = [] }) => ({
    id: techniqueId,
    name: techniqueName,
    subTechniqueCount: subTechniques.length,
  })),
}));

const output = `window.CARDINAL_MITRE_V19 = ${JSON.stringify(tactics, null, 2)};\n`;
await writeFile(destinationPath, output);
