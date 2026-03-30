import fs from 'fs'
import path from 'path'
import type { RsbuildPlugin } from '@rsbuild/core'

// Import the core logic of the original route generator
import generate from './generateRoutesCore'

// Add delay function
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Add retry logic
async function generateWithRetry(maxRetries = 3, delayMs = 1000) {
  let lastError

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Try to generate routes (try ${attempt}/${maxRetries})...`)
      await generate()
      console.log('✅ Routes generated successfully')
      return true
    } catch (error) {
      lastError = error
      console.error(
        `❌ Routes generation failed (try ${attempt}/${maxRetries}):`,
        error.message
      )

      if (attempt < maxRetries) {
        console.log(`⏳ ${delayMs}ms later retry...`)
        await delay(delayMs)
      }
    }
  }

  console.error('❌ Reached maximum retry count, routes generation failed')
  throw lastError
}

export const autoRoutesPlugin = (): RsbuildPlugin => ({
  name: 'auto-routes-plugin',

  setup(api) {
    // Perform route generation before the development server starts
    api.modifyBundlerChain(async () => {
      console.log('🚀 Initialize routes configuration...')
      try {
        await generateWithRetry()
      } catch (error) {
        console.error('❌ Initialize routes configuration failed:', error)
        // Do not throw errors to avoid blocking the development server startup
      }
      return
    })

    // Monitor file changes and regenerate routing configuration
    api.onDevCompileDone(async ({ changedFiles }) => {
      if (!changedFiles) return

      const pageFiles = Array.from(changedFiles).filter(
        file => file.endsWith('.page.tsx') || file.endsWith('index.tsx')
      )

      if (pageFiles.length > 0) {
        console.log('📝 Detected page file changes:')
        pageFiles.forEach(file => {
          console.log(`- ${path.relative(process.cwd(), file)}`)
        })

        console.log('🔄 Regenerate routes configuration...')
        try {
          await generateWithRetry(2, 500)
        } catch (error) {
          console.error('❌ Routes regeneration failed:', error)
          return // Do not continue to execute subsequent logic
        }

        // Force triggering routing file reloading
        console.log('🔄 Trigger routes file reloading...')

        // Modify the routing file so that changes are detected by Rsbuild
        try {
          const routeConfigFile = path.resolve(
            process.cwd(),
            'src/router/routeConfig.ts'
          )
          if (fs.existsSync(routeConfigFile)) {
            // Read existing content
            let content = fs.readFileSync(routeConfigFile, 'utf-8')

            // Add or update timestamp comments to trigger hot updates
            const timestamp = `// Last updated: ${new Date().toISOString()}`
            if (content.includes('// Last updated:')) {
              content = content.replace(/\/\/ Last updated: .*/, timestamp)
            } else {
              content = `${timestamp}\n${content}`
            }

            // write back file
            fs.writeFileSync(routeConfigFile, content, 'utf-8')
            console.log(`Updated routes configuration file: ${routeConfigFile}`)
          } else {
            console.log(
              'Routes configuration file not found, cannot trigger reloading'
            )
          }
        } catch (err) {
          console.error('Failed to trigger routes reloading:', err)
        }
      }
    })
  },
})

export default autoRoutesPlugin
