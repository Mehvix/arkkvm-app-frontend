/**
 * Version number increment script
 * Usage: tsx scripts/bump-version.ts [major|minor|patch]
 * Increment patch version by default
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Emulate __dirname in ESM environment
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Get the corresponding .env file path based on the environment name (such as .env.pro / .env.test)
function getEnvFilePath(envName: string): string {
  return path.join(__dirname, `../.env.${envName}`)
}

function readVersion(envFilePath: string): string {
  try {
    const content = fs.readFileSync(envFilePath, 'utf-8')
    const match = content.match(/^RSB_APP_VERSION=(.*)$/m)
    if (match && match[1]) {
      return match[1].trim()
    }
    return '0.0.0'
  } catch (error) {
    console.error(`❌ Failed to read .env.pro: ${error}`)
    return '0.0.0'
  }
}

function parseVersion(versionStr: string): [number, number, number] {
  // Supported formats: 0.0.002, 0.0.2, 1.2.3, etc.
  const parts = versionStr.split('.').map(p => parseInt(p, 10))
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid version format: ${versionStr}`)
  }
  return [parts[0], parts[1], parts[2]]
}

function formatVersion(major: number, minor: number, patch: number): string {
  // Keep original format: if original version is 0.0.002, keep 3 digits
  return `${major}.${minor}.${String(patch).padStart(3, '0')}`
}

function bumpVersion(
  versionStr: string,
  bumpType: 'major' | 'minor' | 'patch' = 'patch'
): string {
  const [major, minor, patch] = parseVersion(versionStr)

  let newMajor = major
  let newMinor = minor
  let newPatch = patch

  switch (bumpType) {
    case 'major':
      newMajor += 1
      newMinor = 0
      newPatch = 0
      break
    case 'minor':
      newMinor += 1
      newPatch = 0
      break
    case 'patch':
    default:
      newPatch += 1
      break
  }

  return formatVersion(newMajor, newMinor, newPatch)
}

function writeVersion(envFilePath: string, versionStr: string): void {
  try {
    let content = ''
    try {
      content = fs.readFileSync(envFilePath, 'utf-8')
    } catch {
      content = ''
    }

    if (/^RSB_APP_VERSION=/m.test(content)) {
      content = content.replace(
        /^RSB_APP_VERSION=.*$/m,
        `RSB_APP_VERSION=${versionStr}`
      )
    } else {
      if (content && !content.endsWith('\n')) content += '\n'
      content += `RSB_APP_VERSION=${versionStr}\n`
    }

    fs.writeFileSync(envFilePath, content, 'utf-8')
    console.log(`✅ RSB_APP_VERSION updated to: ${versionStr}`)
  } catch (error) {
    console.error(`❌ Failed to write .env.pro: ${error}`)
    process.exit(1)
  }
}

// main function
async function main() {
  const args = process.argv.slice(2)
  const bumpType = (args[0] || 'patch') as 'major' | 'minor' | 'patch'
  const envName = (args[1] || 'pro').trim() // Corresponds to .env.pro / .env.test

  if (!['major', 'minor', 'patch'].includes(bumpType)) {
    console.error(
      `❌ Invalid bump type: ${bumpType}. Use: major, minor, or patch`
    )
    process.exit(1)
  }

  const envFilePath = getEnvFilePath(envName)

  const currentVersion = readVersion(envFilePath)
  console.log(`📦 Current version: ${currentVersion}`)

  const newVersion = bumpVersion(currentVersion, bumpType)
  console.log(`📝 Bumping ${bumpType}...`)

  writeVersion(envFilePath, newVersion)
}

main().catch(error => {
  console.error(`❌ Error: ${error.message}`)
  process.exit(1)
})
