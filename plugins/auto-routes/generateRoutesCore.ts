/**
 * @Purpose:
 * @Descripttion:
 * @version:
 * @Author: zhanglei
 * @Date: 2025-07-21 18:15:01
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-21 18:22:38
 */
import fs from 'fs'
import path from 'path'

// Define routing information interface
interface RouteInfo {
  routePath: string
  importPath: string
  filePath?: string
  meta?: any
}
const pagesDir = getPagesDir()
const outPath = path.resolve(__dirname, '../../src/router/routeConfig.ts')
// Check and get the pages directory path
function getPagesDir() {
  const baseDir = path.resolve(__dirname, '../../src')
  // Check whether it is pages or page directory
  if (fs.existsSync(path.join(baseDir, 'pages'))) {
    return path.join(baseDir, 'pages')
  } else if (fs.existsSync(path.join(baseDir, 'page'))) {
    return path.join(baseDir, 'page')
  }
  console.warn('⚠️ pages or page directory not found, default using page')
  return path.join(baseDir, 'page')
}
function walk(dir: string, baseRoute = ''): RouteInfo[] {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Directory not found: ${dir}`)
    return []
  }

  const entries = fs.readdirSync(dir)
  const routes: RouteInfo[] = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      const subRoutes = walk(fullPath, path.join(baseRoute, entry))
      routes.push(...(subRoutes as RouteInfo[]))
      continue
    }

    // Supports .page.tsx or index.tsx files
    if (entry.endsWith('.page.tsx') || entry === 'index.tsx') {
      let routePath = path.join(baseRoute, entry.replace(/\.(page\.)?tsx$/, ''))
      routePath = routePath.replace(/\\/g, '/') // Windows path compatible
      routePath = routePath.replace(/\/index$/, '')
      routePath = routePath.replace(/\[([^\]]+)\]/g, ':$1')

      // Calculate import path
      // Uniformly generate '@/page/xxx' format, compatible with src/page directory
      let importPath =
        '@' +
        fullPath
          .replace(path.resolve(__dirname, '../../src'), '')
          .replace(/\\/g, '/')
          .replace(/\.tsx$/, '')

      routes.push({
        routePath: routePath || '/',
        importPath,
      } as RouteInfo)
    }
  }

  return routes
}
// --- Static analysis of page file content and extraction of meta ---
function extractMetaFromFile(filePath: string): any {
  const content = fs.readFileSync(filePath, 'utf-8')
  // Support TypeScript type annotations: export const meta: PageMeta = { ... }
  // Typeless annotations are also supported: export const meta = { ... }
  const match = content.match(
    /export\s+const\s+meta\s*(?::\s*\w+\s*)?=\s*({[\s\S]*?})\s*;?\s*(?=\n|$|import|export|const|let|var|function|class)/
  )
  if (match) {
    try {
      // Use Function to parse object literals (higher security, supports comments/single quotes/trailing commas, etc. and can be replaced by json5/acorn)
      // eslint-disable-next-line no-new-func
      return new Function('return ' + match[1])()
    } catch (e) {
      console.warn('⚠️ meta parse failed', filePath, e)
      return {}
    }
  }
  console.warn('⚠️ meta export not found', filePath)
  return {}
}

async function generate() {
  // Make sure the output directory exists
  const outDir = path.dirname(outPath)
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true })
  }

  const routeInfos = walk(pagesDir).map((info: RouteInfo) => {
    // info.importPath is in the form of '@/page/xxx', without the @ prefix
    const relativeImportPath = info.importPath.replace(/^@\/?/, '')
    // Splice into absolute paths through path.join to avoid illegal escaping
    const filePath = path.join(
      path.resolve(__dirname, '../../src'),
      relativeImportPath + '.tsx'
    )
    return {
      ...info,
      filePath,
    }
  })
  const routeEntries = []

  for (const { routePath, importPath, filePath } of routeInfos as RouteInfo[]) {
    if (!filePath || !fs.existsSync(filePath)) {
      console.error('❌ Page file not found, skipped:', filePath || importPath)
      continue
    }
    try {
      // static analysis meta
      const meta = extractMetaFromFile(filePath)
      // Override the automatic path using meta.path/environment path (cloudPath)
      let finalPath = routePath
      const buildTarget = process.env.BUILD_TARGET
      console.log('buildTarget', buildTarget)

      // Filter pages based on the page target field and only package routes corresponding to the environment.
      const pageTarget = meta.target || 'universal'

      // Filtering logic: only keep the pages required for the current build target
      if (buildTarget === 'cloud' && pageTarget === 'device') {
        console.log(`⏭️ Skip device-specific page: ${filePath}`)
        continue
      }
      if (buildTarget === 'device' && pageTarget === 'cloud') {
        console.log(`⏭️ Skip cloud-specific page: ${filePath}`)
        continue
      }

      // Choose a path based on your build target
      let candidatePath = ''
      if (
        buildTarget === 'cloud' &&
        typeof meta.cloudPath === 'string' &&
        meta.cloudPath.trim() !== ''
      ) {
        candidatePath = meta.cloudPath
      } else if (typeof meta.path === 'string' && meta.path.trim() !== '') {
        candidatePath = meta.path
      }

      if (candidatePath) {
        finalPath = candidatePath.startsWith('/')
          ? candidatePath
          : `/${candidatePath}`
        // Protect the root path '/' from being cleared
        if (finalPath !== '/') {
          finalPath = finalPath.replace(/\/+$/, '')
        }
      }

      const metaCopy = { ...meta }
      delete metaCopy.path
      delete metaCopy.cloudPath
      delete metaCopy.target
      // Note: finalPath should already be sanitized, no need for aggressive cleaning
      // Only ensure it starts with '/' if not empty
      if (finalPath && !finalPath.startsWith('/')) {
        finalPath = '/' + finalPath
      }
      const indent = '  '
      const metaStr =
        Object.entries(metaCopy).length > 0
          ? `,\n${indent.repeat(3)}meta: ${JSON.stringify(metaCopy, null, 2).replace(/\n/g, `\n${indent.repeat(3)}`)}`
          : ''
      const routeStr = `${indent.repeat(1)}{\n${indent.repeat(2)}path: '${finalPath}',\n${indent.repeat(2)}element: lazy(() => import('${importPath}'))${metaStr}\n${indent.repeat(1)}}`
      routeEntries.push(routeStr)
      // console.log(`✅ Generate route: ${finalPath} -> ${importPath}`);
    } catch (error) {
      // console.error(`❌ Failed to parse ${filePath}:`, error);
    }
  }

  const fileContent = `
      // ⚠️ This file is automatically generated by generateRoutes.ts, please do not modify it manually
      import { lazy } from 'react';
      import { RouteObject } from 'react-router-dom';

      export interface CustomRouteObject extends RouteObject {
        meta?: {
          auth?: boolean;
          title?: string;
          isMenu?: boolean;
          icon?: string;
          target?: 'device' | 'cloud' | 'universal';
        };
      }

      export const routes: CustomRouteObject[] = [
        ${routeEntries.join(',\n  ')}
      ];
      `

  try {
    fs.writeFileSync(outPath, fileContent, 'utf-8')
    console.log('✅ routeConfig.ts generated successfully')
  } catch (err) {
    console.error('❌ Failed to write routeConfig.ts:', err)
  }
}

export default generate
