/**
 * @Purpose: Auto-generate component export file
 * @Descripttion: Scan the components directory recursively and generate `index.ts` exports
 * @Author: zhanglei
 * @Date: 2025-07-24 14:57:28
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-24 14:57:28
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM compatibility: define __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Components directory path
const componentsDir = path.resolve(__dirname, '../../src/components')
// Output file path
const outPath = path.resolve(__dirname, '../../src/components/index.ts')

// Files or directories to exclude
const excludes = [
  'index.ts', // Exclude self-generated index file
  '.DS_Store', // macOS system file
  'node_modules',
  '.git',
  'data', // Exclude data directory
]

const noExportRE = /\/\/\s*@no-export\b/
const copySuffixRE = /(?:^|[\s_-])copy(?:[\s_-]*\d+)?$/i

function stripExtension(filePath: string): string {
  return filePath.replace(/\.(tsx|ts)$/, '')
}

function hasCopySuffix(filePath: string): boolean {
  return filePath
    .split(path.sep)
    .some(segment => copySuffixRE.test(stripExtension(segment)))
}

function hasNoExportMarker(filePath: string): boolean {
  try {
    return noExportRE.test(fs.readFileSync(filePath, 'utf-8'))
  } catch (error) {
    console.warn(`⚠️ Failed to read file ${filePath}:`, (error as any).message)
    return false
  }
}

// Check whether a file is a component source file
function isComponentFile(filePath: string): boolean {
  // Support both .tsx and .ts files
  return (
    (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) &&
    !excludes.some(exclude => filePath.includes(exclude))
  )
}

function shouldExportSourceFile(filePath: string): boolean {
  if (!isComponentFile(filePath)) return false

  if (hasCopySuffix(filePath)) {
    return false
  }

  if (hasNoExportMarker(filePath)) {
    console.log('🚫 识别到 @no-export，跳过自动导出:', filePath)
    return false
  }

  return true
}

function getExistingPath(paths: string[]): string | null {
  return paths.find(candidate => fs.existsSync(candidate)) ?? null
}

function normalizeGeneratedContent(content: string): string {
  return content
    .replace(/^\/\/ Last updated: .*\r?\n/, '')
    .replace(/\* @LastEditTime: .*/g, ' * @LastEditTime: <generated>')
}

// Recursively scan directory tree to collect component entries
function walk(dir: string, baseDir = componentsDir): string[] {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Directory does not exist: ${dir}`)
    return []
  }

  const entries = fs.readdirSync(dir).sort()
  const components: string[] = []

  for (const entry of entries) {
    // Skip excluded files or directories
    if (excludes.includes(entry)) continue

    const fullPath = path.join(dir, entry)
    if (hasCopySuffix(fullPath)) {
      console.log('🚫 过滤副本文件/夹:', fullPath)
      continue
    }

    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Detect whether this is a component module directory:
      // has index + same-name entry file
      // Example: VirtualUsbDrive/ with index.tsx + VirtualUsbDrive.tsx
      // Otherwise treat as a grouping directory and recurse
      const dirName = path.basename(fullPath)
      const hasBarrel =
        fs.existsSync(path.join(fullPath, 'index.ts')) ||
        fs.existsSync(path.join(fullPath, 'index.tsx'))
      const hasSameNameEntry =
        fs.existsSync(path.join(fullPath, `${dirName}.ts`)) ||
        fs.existsSync(path.join(fullPath, `${dirName}.tsx`))
      if (hasBarrel && hasSameNameEntry) {
        const barrelPath = getExistingPath([
          path.join(fullPath, 'index.tsx'),
          path.join(fullPath, 'index.ts'),
        ])

        if (barrelPath && hasNoExportMarker(barrelPath)) {
          console.log('🚫 识别到 @no-export，跳过自动导出:', barrelPath)
          continue
        }

        // Component module directory: export directory entry only
        let relativePath = path.relative(baseDir, fullPath)
        relativePath = relativePath.replace(/\\/g, '/')
        components.push(relativePath)
        continue
      }
      // Grouping directory: recurse into subdirectories
      const subComponents = walk(fullPath, baseDir)
      components.push(...subComponents)
      continue
    }

    // Handle component files
    if (shouldExportSourceFile(fullPath)) {
      // Compute path relative to components directory
      let relativePath = path.relative(baseDir, fullPath)
      // Remove file extension
      relativePath = relativePath.replace(/\.(tsx|ts)$/, '')
      // Normalize Windows separators
      relativePath = relativePath.replace(/\\/g, '/')

      components.push(relativePath)
    }
  }

  return components
}

// Convert component name into a valid PascalCase identifier
function toPascalCase(name: string): string {
  // Handle delimiters like hyphen/underscore/space
  return name
    .split(/[-_\s]+/) // Split by delimiters
    .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // Uppercase initials
    .join('')
}

// Detect export style from component file (default vs named exports)
function detectExportType(filePath: string): {
  hasDefaultExport: boolean
  namedValueExports: string[]
  namedTypeExports: string[]
} {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Check whether `export default` exists
    const hasDefaultExport = /export\s+default\s+/m.test(content)

    // Extract named exports and split value exports vs type exports
    const namedValueExports: string[] = []
    const namedTypeExports: string[] = []
    const namedExportRegex =
      /export\s+(?:const|let|var|function|class|enum|interface|type)\s+([a-zA-Z0-9_$]+)/g
    let match

    while ((match = namedExportRegex.exec(content)) !== null) {
      const decl = match[0]
      const name = match[1]
      if (/export\s+(?:interface|type)\s+/.test(decl)) {
        namedTypeExports.push(name)
      } else {
        namedValueExports.push(name)
      }
    }

    // Parse block exports, e.g. `export { X, Y, Z }`
    const exportBlockRegex = /export\s+\{([^}]+)\}/g
    while ((match = exportBlockRegex.exec(content)) !== null) {
      const exportItems = match[1].split(',').map(item => item.trim())
      for (const item of exportItems) {
        // Handle aliases like `export { X as Y }`
        const asMatch = item.match(
          /([a-zA-Z0-9_$]+)(?:\s+as\s+([a-zA-Z0-9_$]+))?/
        )
        if (asMatch && asMatch[1]) {
          // Type info is unknown in block exports; conservatively treat as value export
          namedValueExports.push(asMatch[1])
        }
      }
    }

    return { hasDefaultExport, namedValueExports, namedTypeExports }
  } catch (error) {
    console.warn(`⚠️ Failed to read file ${filePath}:`, (error as any).message)
    return {
      hasDefaultExport: false,
      namedValueExports: [],
      namedTypeExports: [],
    }
  }
}

function generateExports(components: string[]): string {
  const header = `/**
 * @Purpose: Unified export surface for all components
 * @Author: zhanglei
 * @Date: 2025-07-15 19:05:10
 * @LastEditors: zhanglei
 * @LastEditTime: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}
 */

// ⚠️ This file is auto-generated. Do not edit manually.
`

  const exports = components.map(component => {
    // For ui/* components, prefer named exports
    if (component.startsWith('ui/')) {
      const fullPath = path.join(componentsDir, `${component}.ts`)
      const tsxPath = path.join(componentsDir, `${component}.tsx`)
      const filePath = fs.existsSync(fullPath) ? fullPath : tsxPath

      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Component file not found: ${filePath}`)
        return `// ⚠️ Component file not found: ${component}`
      }

      // Detect UI component export style
      const { hasDefaultExport, namedValueExports, namedTypeExports } =
        detectExportType(filePath)

      // Special handling for ui/select: move known type names into type exports
      if (component === 'ui/select') {
        const knownTypeNames = new Set(['AppSelectOption', 'AppSelectProps'])
        const fixedTypeExports = Array.from(
          new Set([
            ...namedTypeExports,
            ...namedValueExports.filter(n => knownTypeNames.has(n)),
          ])
        )
        const fixedValueExports = namedValueExports.filter(
          n => !knownTypeNames.has(n)
        )
        // Overwrite original arrays with normalized lists
        ;(namedTypeExports as string[]).length = 0
        ;(namedTypeExports as string[]).push(...fixedTypeExports)
        ;(namedValueExports as string[]).length = 0
        ;(namedValueExports as string[]).push(...fixedValueExports)
      }

      if (namedValueExports.length > 0 || namedTypeExports.length > 0) {
        // Keep value exports and type exports separate
        const parts: string[] = []
        if (namedTypeExports.length > 0) {
          parts.push(
            `export type { ${namedTypeExports.join(', ')} } from './${component}';`
          )
        }
        if (namedValueExports.length > 0) {
          parts.push(
            `export { ${namedValueExports.join(', ')} } from './${component}';`
          )
        }
        return parts.join('\n')
      } else if (hasDefaultExport) {
        // If default export exists, map it to PascalCase component name
        const componentName = path.basename(component)
        const pascalCaseName = toPascalCase(componentName)
        return `export { default as ${pascalCaseName} } from './${component}';`
      } else {
        // Fallback when export style cannot be inferred
        return `export * from './${component}';`
      }
    }

    // For non-ui components, infer and generate export statements
    const componentName = path.basename(component)
    const pascalCaseName = toPascalCase(componentName)
    const fullPath = path.join(componentsDir, `${component}.ts`)
    const tsxPath = path.join(componentsDir, `${component}.tsx`)
    // Also support directory modules with index.ts/index.tsx
    const dirIndexTs = path.join(componentsDir, component, 'index.ts')
    const dirIndexTsx = path.join(componentsDir, component, 'index.tsx')

    // Resolve the source file path
    let filePath: string | null = null
    if (fs.existsSync(fullPath)) filePath = fullPath
    else if (fs.existsSync(tsxPath)) filePath = tsxPath
    else if (fs.existsSync(dirIndexTsx)) filePath = dirIndexTsx
    else if (fs.existsSync(dirIndexTs)) filePath = dirIndexTs

    if (!filePath) {
      console.warn(`⚠️ Component file not found: ${component}`)
      return `// ⚠️ Component file not found: ${component}`
    }

    // Detect export style
    const { hasDefaultExport, namedValueExports } = detectExportType(filePath)

    // Generate export statement based on detected style
    if (hasDefaultExport) {
      return `export { default as ${pascalCaseName} } from './${component}';`
    } else if (namedValueExports.includes(pascalCaseName)) {
      // Use matching named export when available
      return `export { ${pascalCaseName} } from './${component}';`
    } else if (namedValueExports.length > 0) {
      // Otherwise map the first named export to PascalCase alias
      return `export { ${namedValueExports[0]} as ${pascalCaseName} } from './${component}';`
    } else {
      // Fallback when export style cannot be inferred
      return `export * from './${component}';`
    }
  })

  // Group exports by category
  const uiExports = exports.filter(exp => exp.includes('ui/'))
  const businessExports = exports.filter(
    exp => !exp.includes('ui/') && !exp.includes('⚠️')
  )
  const warningExports = exports.filter(exp => exp.includes('⚠️'))

  return `${header}
// UI Components
${uiExports.join('\n')}

// Business Components
${businessExports.join('\n')}

${warningExports.length > 0 ? '// Warning: Issues found in the following components\n' + warningExports.join('\n') : ''}
`
}

// Generate index.ts file
async function generate(): Promise<void> {
  try {
    // Ensure output directory exists
    const outDir = path.dirname(outPath)
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true })
    }

    // Scan components
    const components = walk(componentsDir)

    // Generate export content
    const content = generateExports(components)

    if (
      fs.existsSync(outPath) &&
      normalizeGeneratedContent(fs.readFileSync(outPath, 'utf-8')) ===
        normalizeGeneratedContent(content)
    ) {
      return Promise.resolve()
    }

    // Write file only when the generated export surface changed.
    fs.writeFileSync(outPath, content, 'utf-8')

    return Promise.resolve()
  } catch (err) {
    console.error('❌ Failed to generate components/index.ts:', err)
    return Promise.reject(err)
  }
}

export default generate
