#!/usr/bin/env node
// Guard (этап 35, аудит qwen): main AndroidManifest не должен разрешать cleartext.
// Cleartext допустим только в android/app/src/debug/AndroidManifest.xml.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const manifestPath = path.join(root, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')

if (!fs.existsSync(manifestPath)) {
  console.log('[cleartext] android/app/src/main/AndroidManifest.xml отсутствует — пропускаю')
  process.exit(0)
}

const xml = fs.readFileSync(manifestPath, 'utf8')
const usesCleartext = /usesCleartextTraffic\s*=\s*"true"/i.test(xml)

if (usesCleartext) {
  console.error('[cleartext] FAIL: android:usesCleartextTraffic="true" в main манифесте.')
  console.error('  Разрешай cleartext только в android/app/src/debug/AndroidManifest.xml.')
  process.exit(1)
}

console.log('[cleartext] OK: main манифест без usesCleartextTraffic')
