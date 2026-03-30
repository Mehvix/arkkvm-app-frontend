/**
 * @Purpose: Automatic component export plug-in entry
 * @Author: zhanglei
 * @Date: 2025-07-24 14:57:28
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-24 14:57:28
 */
import fs from 'fs'
import path from 'path'
import type { RsbuildPlugin } from '@rsbuild/core'
import chokidar from 'chokidar'

// Import the core logic of the original component generator
import generate from './generateComponentsCore'

// Component directory path
const componentsDir = path.resolve(__dirname, '../../src/components')
// Output file path
const outPath = path.resolve(__dirname, '../../src/components/index.ts')

// Add delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Add retry logic
async function generateWithRetry(maxRetries = 3, delayMs = 1000) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      //console.log(`🔄 Try to generate component export (try ${attempt}/${maxRetries})...`);
      await generate()
      //console.log('✅ Component export and generation successful');
      return true
    } catch (error) {
      lastError = error
      console.error(
        `❌ Component export generation failed (try ${attempt}/${maxRetries}):`,
        error.message
      )

      if (attempt < maxRetries) {
        console.log(`⏳ ${delayMs}ms later retry...`)
        await delay(delayMs)
      }
    }
  }

  console.error(
    '❌ Reached maximum retry count, component export generation failed'
  )
  throw lastError
}

// Check if the file is a component file
function isComponentFile(filePath: string): boolean {
  // Supports .tsx and .ts files
  return (
    (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) &&
    !filePath.includes('index.ts') &&
    !filePath.includes('.DS_Store')
  )
}

// Monitor file changes
function watchComponentChanges() {
  console.log('👀 Start monitoring components directory changes...')

  const watcher = chokidar.watch(componentsDir, {
    ignored: [
      /(^|[\/\\])\./, // Ignore dot files
      path.join(componentsDir, 'index.ts'), // Ignore generated index.ts
    ],
    persistent: true,
  })

  // Monitor file addition, modification, and deletion events
  watcher
    .on('add', path => {
      if (isComponentFile(path)) {
        //console.log(`📁 Add component file: ${path}`);
        generateWithRetry(2, 500)
      }
    })
    .on('unlink', path => {
      if (isComponentFile(path)) {
        //console.log(`🗑️ Component file deletion: ${path}`);
        generateWithRetry(2, 500)
      }
    })
    .on('ready', () => {
      console.log('✅ Initial scan completed, monitoring file changes...')
    })

  return watcher
}

// Simple hash function used to compare whether the content has changed
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return hash.toString(16)
}

export const autoComponentsPlugin = (): RsbuildPlugin => ({
  name: 'auto-components-plugin',

  setup(api) {
    let watcher: any = null
    // Record the time and content hash of the last generation to prevent repeated generation
    let lastGenerateTime = 0
    let lastContentHash = ''

    // Execute a component export build before the development server starts
    api.modifyBundlerChain(async () => {
      console.log('🚀 Initialize component export configuration...')
      try {
        await generateWithRetry()
      } catch (error) {
        console.error(
          '❌ Initialize component export configuration failed:',
          error
        )
        // Do not throw errors to avoid blocking the development server startup
      }
      return
    })

    // In development mode, start file monitoring
    api.modifyRsbuildConfig(config => {
      const isDev = process.env.NODE_ENV === 'development'

      if (isDev && !watcher) {
        // Use setTimeout to ensure that the listening is started after Rsbuild initialization is completed.
        setTimeout(() => {
          console.log('🔄 Start component automatic export monitoring...')
          watcher = watchComponentChanges()
        }, 1000)
      }

      return config
    })

    // Monitor development and compilation completion events
    api.onDevCompileDone(async () => {
      // Check if component exports need to be regenerated
      const now = Date.now()
      const timeSinceLastGenerate = now - lastGenerateTime

      // If the time since the last generation is less than 2 seconds, skip to avoid an infinite loop.
      if (timeSinceLastGenerate < 2000) {
        console.log(
          `Only ${timeSinceLastGenerate}ms since last generation, skip this generation`
        )
        return
      }

      console.log(
        '🔄 Development build completed, checking component updates...'
      )

      // Check the content hash of the current index.ts
      let currentContent = ''
      let currentHash = ''

      if (fs.existsSync(outPath)) {
        try {
          currentContent = fs.readFileSync(outPath, 'utf-8')
          currentHash = simpleHash(currentContent)

          // If content has not changed, skip generation
          if (currentHash === lastContentHash) {
            console.log('Component export content unchanged, skip generation')
            return
          }
        } catch (err) {
          console.warn('Failed to read current component export file:', err)
        }
      }

      try {
        await generateWithRetry(2, 500)

        // Update last generated time
        lastGenerateTime = Date.now()

        // Read the newly generated content and calculate the hash
        if (fs.existsSync(outPath)) {
          const newContent = fs.readFileSync(outPath, 'utf-8')
          lastContentHash = simpleHash(newContent)

          // Add or update timestamp comments to trigger hot updates
          const timestamp = `// Last updated: ${new Date().toISOString()}`
          let content = newContent

          if (content.includes('Last updated:')) {
            content = content.replace(/\/\/ Last updated: .*/, timestamp)
          } else {
            content = `${timestamp}\n${content}`
          }

          // write back file
          fs.writeFileSync(outPath, content, 'utf-8')
          console.log(`Updated component export file: ${outPath}`)
        }
      } catch (error) {
        console.error('❌ Component export regeneration failed:', error)
      }
    })

    // Close listener at end of build
    api.onAfterBuild(() => {
      if (watcher) {
        console.log('Close component file listener...')
        watcher.close()
        watcher = null
      }
    })
  },
})

export default autoComponentsPlugin
