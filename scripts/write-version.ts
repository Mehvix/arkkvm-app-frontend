/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2026-01-15 15:31:14
 * @LastEditors: zhanglei
 * @LastEditTime: 2026-01-27 19:00:30
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Emulate __dirname in ESM environment
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Project root directory
const root = path.join(__dirname, '..')

// Get the environment name and optional version number from the command line arguments:
// Usage examples:
//   tsx scripts/write-version.ts pro -> automatically generate X.Y.aabbccdd
//   tsx scripts/write-version.ts test 0.0.26011599 -> Force the use of the incoming version number
const args = process.argv.slice(2)
const envName = (args[0] || 'pro').trim()
const overrideVersionArg = (args[1] || '').trim()
const envFilePath = path.join(root, `.env.${envName}`)

let version = '0.0.0'
try {
  const content = fs.readFileSync(envFilePath, 'utf-8')
  const match = content.match(/^RSB_APP_VERSION=(.*)$/m)
  if (match && match[1]) {
    version = match[1].trim()
  }
} catch {
  // Keep default version if read fails
}

// Extract prefix X.Y from RSB_APP_VERSION as major version number (e.g. 0.0 or 1.2)
function getVersionPrefix(raw: string): string {
  const parts = raw.split('.')
  if (parts.length >= 2) {
    return `${parts[0]}.${parts[1]}`
  }
  return raw || '0.0'
}

let versionPrefix = getVersionPrefix(version)

// If the full version number is passed in on the command line, the prefix will be based on the passed version.
if (overrideVersionArg) {
  versionPrefix = getVersionPrefix(overrideVersionArg)
}

// Generate a version number in X.Y.aabbccdd format based on the current date and historical version.txt
function generateFullVersion(prefix: string, distDir: string): string {
  const now = new Date()
  const yy = String(now.getFullYear()).slice(-2) // Last two digits of year
  const mm = String(now.getMonth() + 1).padStart(2, '0') // Month 01-12
  const dd = String(now.getDate()).padStart(2, '0') // Date 01-31
  const dateCode = `${yy}${mm}${dd}` // aabbcc

  let seq = 1
  const versionFilePath = path.join(distDir, 'version')

  try {
    if (fs.existsSync(versionFilePath)) {
      const last = fs.readFileSync(versionFilePath, 'utf-8').trim()
      // Expected format: X.Y.aabbccdd
      const parts = last.split('.')
      if (parts.length >= 3) {
        const lastPrefix = `${parts[0]}.${parts[1]}`
        const suffix = parts[2] || ''
        if (lastPrefix === prefix && suffix.length >= 8) {
          const lastDate = suffix.slice(0, 6)
          const lastSeqStr = suffix.slice(6)
          // Only when the suffix is ​​exactly 2 digits (01-99), is it considered a legal historical serial number
          if (lastDate === dateCode && lastSeqStr.length === 2) {
            const lastSeq = Number(lastSeqStr)
            if (!Number.isNaN(lastSeq)) {
              seq = lastSeq + 1
            }
          }
        }
      }
    }
  } catch {
    // If the read fails, start from 1
    seq = 1
  }

  const seqStr = String(seq).padStart(2, '0') // dd, two-digit serial number
  const suffix = `${dateCode}${seqStr}`
  return `${prefix}.${suffix}`
}

// dist directory
const distDir = path.join(root, 'dist')
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Generate a complete version number X.Y.aabbccdd based on the prefix + date + today’s build serial number
// If overrideVersionArg exists, the passed full version number will be used first.
const fullVersion =
  overrideVersionArg || generateFullVersion(versionPrefix, distDir)

// Write to the root dist/version, containing only one line with the version number (consistent with the file name read in generateFullVersion)
const content = `${fullVersion}`
fs.writeFileSync(path.join(distDir, 'version'), content, 'utf-8')

// If there is a device/cloud subdirectory, the respective version.txt will be written synchronously.
const deviceDistDir = path.join(distDir, 'device')
const cloudDistDir = path.join(distDir, 'cloud')

try {
  if (fs.existsSync(deviceDistDir)) {
    fs.writeFileSync(path.join(deviceDistDir, 'version'), content, 'utf-8')
  }
} catch {}

try {
  if (fs.existsSync(cloudDistDir)) {
    fs.writeFileSync(path.join(cloudDistDir, 'version'), content, 'utf-8')
  }
} catch {}

// Synchronously write the complete version number generated this time back to RSB_APP_VERSION in the current environment file
try {
  let envContent = ''
  try {
    envContent = fs.readFileSync(envFilePath, 'utf-8')
  } catch {
    envContent = ''
  }

  if (/^RSB_APP_VERSION=/m.test(envContent)) {
    envContent = envContent.replace(
      /^RSB_APP_VERSION=.*$/m,
      `RSB_APP_VERSION=${fullVersion}`
    )
  } else {
    if (envContent && !envContent.endsWith('\n')) envContent += '\n'
    envContent += `RSB_APP_VERSION=${fullVersion}\n`
  }

  fs.writeFileSync(envFilePath, envContent, 'utf-8')
} catch {}

console.log(
  '[build] generated version files:',
  content.trim(),
  `(from base prefix ${versionPrefix})`
)
