import { cp, mkdir, access } from 'node:fs/promises';
import path from 'node:path';
const source = path.resolve('node_modules/cesium/Build/Cesium');
const target = path.resolve('public/cesium');
try {
  await access(source);
  await mkdir(target, { recursive: true });
  for (const folder of ['Assets', 'Workers', 'ThirdParty', 'Widgets']) {
    await cp(path.join(source, folder), path.join(target, folder), { recursive: true, force: true });
  }
  console.log('Cesium runtime assets copied to public/cesium');
} catch (error) {
  console.error('Cesium runtime assets are unavailable. Install dependencies before building.', error);
  process.exitCode = 1;
}
