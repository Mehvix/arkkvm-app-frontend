/*
 * @Purpose: Read the version number from the .env file and write it to the dist directory
 * @Description: Write the version number into dist/version, dist/device/version, dist/cloud/version
 * @Author: zhanglei
 * @Date: 2026-01-27
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')

// Usage: tsx scripts/write-dist-version.ts pro
const args = process.argv.slice(2)
const envName = (args[0] || 'pro').trim()

const envFilePath = path.join(root, `.env.${envName}`)
const distDir = path.join(root, 'dist')

// Read version number from .env file
function readVersionFromEnv(filePath: string): string {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const match = content.match(/^RSB_APP_VERSION=(.*)$/m)
    if (match && match[1]) {
      return match[1].trim()
    }
  } catch (err) {
    console.error(`❌ Failed to read ${path.basename(filePath)}:`, err)
  }
  return '0.0.0'
}

const version = readVersionFromEnv(envFilePath)

if (!version || version === '0.0.0') {
  console.error(
    `❌ Valid version number not found, please run generate-version.ts first`
  )
  process.exit(1)
}

// Make sure the dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true })
}

// Write dist/version
const content = version
fs.writeFileSync(path.join(distDir, 'version'), content, 'utf-8')
console.log(`✅ Written to dist/version (${version})`)

// Write dist/device/version
const deviceDistDir = path.join(distDir, 'device')
if (fs.existsSync(deviceDistDir)) {
  fs.writeFileSync(path.join(deviceDistDir, 'version'), content, 'utf-8')
  console.log(`✅ Written to dist/device/version (${version})`)
}

// Write to dist/cloud/version
const cloudDistDir = path.join(distDir, 'cloud')
if (fs.existsSync(cloudDistDir)) {
  fs.writeFileSync(path.join(cloudDistDir, 'version'), content, 'utf-8')
  console.log(`✅ Written to dist/cloud/version (${version})`)
}

console.log(
  `\n📦 Version number ${version} has been synchronized to all dist directories`
)
