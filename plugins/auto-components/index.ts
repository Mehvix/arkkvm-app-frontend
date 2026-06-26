/**
 * @Purpose: Auto component-export plugin entry
 * @Author: zhanglei
 * @Date: 2025-07-24 14:57:28
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-24 14:57:28
 */
import type { RsbuildPlugin } from '@rsbuild/core';
import chokidar from 'chokidar';
import path from 'path';

// Import the core component generation logic
import generate from './generateComponentsCore';

// Components directory path
const componentsDir = path.resolve(__dirname, '../../src/components');
// Output file path
const outPath = path.resolve(__dirname, '../../src/components/index.ts');

// Delay helper used by retry logic
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for component export generation
async function generateWithRetry(maxRetries = 3, delayMs = 1000) {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await generate();
      return true;
    } catch (error) {
      lastError = error;
      console.error(`❌ Component export generation failed (${attempt}/${maxRetries}):`, error.message);

      if (attempt < maxRetries) {
        console.log(`⏳ Retrying in ${delayMs}ms...`);
        await delay(delayMs);
      }
    }
  }

  console.error('❌ Maximum retries reached, component export generation failed');
  throw lastError;
}

// Check whether the changed file should trigger component export regeneration
function isComponentFile(filePath: string): boolean {
  // Support both .tsx and .ts files
  const resolvedPath = path.resolve(filePath);
  return (
    (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) &&
    resolvedPath !== outPath &&
    !filePath.includes('.DS_Store')
  );
}

// Watch component directory changes
function watchComponentChanges(onComponentChange: () => void) {
  console.log('👀 Watching components directory for changes...');
  let isReady = false;

  const watcher = chokidar.watch(componentsDir, {
    ignored: [
      /(^|[\/\\])\./, // Ignore dotfiles
      path.join(componentsDir, 'index.ts'), // Ignore the generated index.ts
    ],
    persistent: true,
  });

  const handleComponentChange = (changedPath: string) => {
    if (isReady && isComponentFile(changedPath)) {
      onComponentChange();
    }
  };

  // Listen for file add/change/remove events
  watcher
    .on('add', handleComponentChange)
    .on('change', handleComponentChange)
    .on('unlink', handleComponentChange)
    .on('ready', () => {
      isReady = true;
      console.log('✅ Initial scan complete, now watching for file changes...');
    });

  return watcher;
}

export const autoComponentsPlugin = (): RsbuildPlugin => ({
  name: 'auto-components-plugin',

  setup(api) {
    let watcher: any = null;
    // Track last generation time to avoid duplicate work
    let lastGenerateTime = 0;

    const regenerate = async (maxRetries = 2, delayMs = 500) => {
      await generateWithRetry(maxRetries, delayMs);
      lastGenerateTime = Date.now();
    };

    // Generate component exports once before dev server starts
    api.modifyBundlerChain(async () => {
      console.log('🚀 Initializing component export configuration...');
      try {
        await regenerate(3, 1000);
      } catch (error) {
        console.error('❌ Initializing component export configuration failed:', error);
        // Do not throw to avoid blocking dev server startup
      }
      return;
    });

    // Start file watcher in development mode
    api.modifyRsbuildConfig(config => {
      const isDev = process.env.NODE_ENV === 'development';

      if (isDev && !watcher) {
        // Delay watcher startup until Rsbuild initialization has settled
        setTimeout(() => {
          console.log('🔄 Starting component auto-export watcher...');
          watcher = watchComponentChanges(() => {
            void regenerate(2, 500).catch(error => {
              console.error('❌ Failed to regenerate component exports:', error);
            });
          });
        }, 1000);
      }

      return config;
    });

    // Listen for dev compile completion
    api.onDevCompileDone(async () => {
      // Determine whether regeneration is needed
      const now = Date.now();
      const timeSinceLastGenerate = now - lastGenerateTime;

      // Skip if generation happened too recently to avoid loops
      if (timeSinceLastGenerate < 2000) {
        console.log(`Skipping regeneration, last generation was only ${timeSinceLastGenerate}ms ago`);
        return;
      }

      console.log('🔄 Dev compilation completed, checking for component updates...');

      try {
        await regenerate(2, 500);
      } catch (error) {
        console.error('❌ Failed to regenerate component exports:', error);
      }
    });

    // Close watcher after build completes
    api.onAfterBuild(() => {
      if (watcher) {
        console.log('Closing component file watcher...');
        watcher.close();
        watcher = null;
      }
    });
  }
});

export default autoComponentsPlugin;
