// In `npm run dev` macOS labels the menu bar, Dock and ⌘Tab with the name baked into
// node_modules/electron's Electron.app bundle ("Electron"). This renames that dev bundle to the
// product name. Packaged builds get their name from electron-builder and don't need this.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'

if (process.platform !== 'darwin') process.exit(0)

const require = createRequire(import.meta.url)
const { productName } = JSON.parse(
  readFileSync(new URL('../package.json', import.meta.url), 'utf8')
)
const electronBinary = require('electron')
const appBundle = join(dirname(electronBinary), '..', '..')
const plist = join(appBundle, 'Contents', 'Info.plist')

if (!existsSync(plist)) {
  console.warn(`[set-dev-app-name] ${plist} not found, skipping`)
  process.exit(0)
}

const KEYS = ['CFBundleName', 'CFBundleDisplayName']

let alreadyRenamed = true
for (const key of KEYS) {
  let value = null
  try {
    value = execFileSync('plutil', ['-extract', key, 'raw', plist], { encoding: 'utf8' }).trim()
  } catch {
    // Missing key: treat as not renamed yet.
  }
  if (value !== productName) alreadyRenamed = false
}
if (alreadyRenamed) process.exit(0)

for (const key of KEYS) {
  execFileSync('plutil', ['-replace', key, '-string', productName, plist])
}
// Nudge LaunchServices so the Dock picks up the new name instead of a cached one.
execFileSync('touch', [appBundle])
console.log(`[set-dev-app-name] dev Electron bundle renamed to "${productName}"`)
