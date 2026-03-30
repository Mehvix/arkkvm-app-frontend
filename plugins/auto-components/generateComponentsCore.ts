/**
 * @Purpose: Automatically generate component export files
 * @Descripttion: Scan the components directory and subdirectories and automatically generate the index.ts export file
 * @Author: zhanglei
 * @Date: 2025-07-24 14:57:28
 * @LastEditors: zhanglei
 * @LastEditTime: 2025-07-24 14:57:28
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// ESM compatible: define __filename and __dirname
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Component directory path
const componentsDir = path.resolve(__dirname, '../../src/components')
// Output file path
const outPath = path.resolve(__dirname, '../../src/components/index.ts')

// Files or directories that need to be excluded
const excludes = [
  'index.ts', // exclude oneself
  '.DS_Store', // macOS system files
  'node_modules',
  '.git',
  'data', // exclude data folder
]

// Check if the file is a component file
function isComponentFile(filePath: string): boolean {
  // Supports .tsx and .ts files
  return (
    (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) &&
    !excludes.some(exclude => filePath.includes(exclude))
  )
}

// Scan directories recursively to get all components
function walk(dir: string, baseDir = componentsDir): string[] {
  if (!fs.existsSync(dir)) {
    console.warn(`⚠️ Directory not found: ${dir}`)
    return []
  }

  const entries = fs.readdirSync(dir)
  const components: string[] = []

  for (const entry of entries) {
    // Skip excluded files or directories
    if (excludes.includes(entry)) continue

    const fullPath = path.join(dir, entry)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      // Determine whether it is a "component module directory": there is index + entry file with the same name
      // Example: VirtualUsbDrive/ contains index.tsx + VirtualUsbDrive.tsx → component module
      // And: ControlToolbar/ contains index.tsx but does not have ControlToolbar.tsx → group directory, recursion is required
      const dirName = path.basename(fullPath)
      const hasBarrel =
        fs.existsSync(path.join(fullPath, 'index.ts')) ||
        fs.existsSync(path.join(fullPath, 'index.tsx'))
      const hasSameNameEntry =
        fs.existsSync(path.join(fullPath, `${dirName}.ts`)) ||
        fs.existsSync(path.join(fullPath, `${dirName}.tsx`))

      if (hasBarrel && hasSameNameEntry) {
        // Component module directory: only export directory entries, not recursive internal files
        let relativePath = path.relative(baseDir, fullPath)
        relativePath = relativePath.replace(/\\/g, '/')
        components.push(relativePath)
        continue
      }
      // Grouped directories: recursively scan subdirectories
      const subComponents = walk(fullPath, baseDir)
      components.push(...subComponents)
      continue
    }

    // Determine whether it is a component file
    if (isComponentFile(fullPath)) {
      // Compute relative paths (relative to the components directory)
      let relativePath = path.relative(baseDir, fullPath)
      // Remove file extension
      relativePath = relativePath.replace(/\.(tsx|ts)$/, '')
      // Convert Windows path separators
      relativePath = relativePath.replace(/\\/g, '/')

      components.push(relativePath)
    }
  }

  return components
}

// Convert component name to legal PascalCase format
function toPascalCase(name: string): string {
  // Handle separators such as hyphens and underscores
  return name
    .split(/[-_\s]+/) // Split by hyphen, underscore, or space
    .map(part => part.charAt(0).toUpperCase() + part.slice(1)) // Capitalize the first letter of each part
    .join('')
}

// Generate export statement
// Detect the export method of component files (default export or named export)
function detectExportType(filePath: string): {
  hasDefaultExport: boolean
  namedValueExports: string[]
  namedTypeExports: string[]
} {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')

    // Check if there is export default
    const hasDefaultExport = /export\s+default\s+/m.test(content)

    // Extract named exports (differentiate between values ​​and types)
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

    // Check for exports of the form export { X, Y, Z }
    const exportBlockRegex = /export\s+\{([^}]+)\}/g
    while ((match = exportBlockRegex.exec(content)) !== null) {
      const exportItems = match[1].split(',').map(item => item.trim())
      for (const item of exportItems) {
        // Handle export { X as Y } case
        const asMatch = item.match(
          /([a-zA-Z0-9_$]+)(?:\s+as\s+([a-zA-Z0-9_$]+))?/
        )
        if (asMatch && asMatch[1]) {
          // Unable to determine type from block export, conservatively export as value
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
 * @Purpose: Export all components uniformly
 * @Author: zhanglei
 * @Date: 2025-07-15 19:05:10
 * @LastEditors: zhanglei
 * @LastEditTime: ${new Date().toISOString().replace('T', ' ').substring(0, 19)}
 */

// ⚠️ This file is generated by an automatic script, please do not modify it manually
`

  const exports = components.map(component => {
    // For components in the ui directory, use the named export form
    if (component.startsWith('ui/')) {
      const fullPath = path.join(componentsDir, `${component}.ts`)
      const tsxPath = path.join(componentsDir, `${component}.tsx`)
      const filePath = fs.existsSync(fullPath) ? fullPath : tsxPath

      if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ Component file not found: ${filePath}`)
        return `// ⚠️ Component file not found: ${component}`
      }

      // Detecting how UI components are exported
      const { hasDefaultExport, namedValueExports, namedTypeExports } =
        detectExportType(filePath)

      // Special handling for ui/select: force known types to be moved from value export to type export
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
        // Overwrite with corrected list
        ;(namedTypeExports as string[]).length = 0
        ;(namedTypeExports as string[]).push(...fixedTypeExports)
        ;(namedValueExports as string[]).length = 0
        ;(namedValueExports as string[]).push(...fixedValueExports)
      }

      if (namedValueExports.length > 0 || namedTypeExports.length > 0) {
        // If there is a named export, distinguish between value export and type export.
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
        // If there is a default export, use the component name as the export name
        const componentName = path.basename(component)
        const pascalCaseName = toPascalCase(componentName)
        return `export { default as ${pascalCaseName} } from './${component}';`
      } else {
        // If the export method cannot be determined, use the export * form
        return `export * from './${component}';`
      }
    }

    // For other components, detect the export method and generate corresponding export statements
    const componentName = path.basename(component)
    const pascalCaseName = toPascalCase(componentName)
    const fullPath = path.join(componentsDir, `${component}.ts`)
    const tsxPath = path.join(componentsDir, `${component}.tsx`)
    // Directory modules are also supported (index.ts/tsx in the directory)
    const dirIndexTs = path.join(componentsDir, component, 'index.ts')
    const dirIndexTsx = path.join(componentsDir, component, 'index.tsx')

    // Determine file path
    let filePath: string | null = null
    if (fs.existsSync(fullPath)) filePath = fullPath
    else if (fs.existsSync(tsxPath)) filePath = tsxPath
    else if (fs.existsSync(dirIndexTsx)) filePath = dirIndexTsx
    else if (fs.existsSync(dirIndexTs)) filePath = dirIndexTs

    if (!filePath) {
      console.warn(`⚠️ Component file not found: ${component}`)
      return `// ⚠️ Component file not found: ${component}`
    }

    // Check export method
    const { hasDefaultExport, namedValueExports } = detectExportType(filePath)

    // Generate different export statements based on the export method
    if (hasDefaultExport) {
      return `export { default as ${pascalCaseName} } from './${component}';`
    } else if (namedValueExports.includes(pascalCaseName)) {
      // If there is a named export that matches the component name
      return `export { ${pascalCaseName} } from './${component}';`
    } else if (namedValueExports.length > 0) {
      // If there are other named exports, export the first one
      return `export { ${namedValueExports[0]} as ${pascalCaseName} } from './${component}';`
    } else {
      // If the export method cannot be determined, use the export * form
      return `export * from './${component}';`
    }
  })

  // Export grouped by category
  const uiExports = exports.filter(exp => exp.includes('ui/'))
  const businessExports = exports.filter(
    exp => !exp.includes('ui/') && !exp.includes('⚠️')
  )
  const warningExports = exports.filter(exp => exp.includes('⚠️'))

  return `${header}
// UI components
${uiExports.join('\n')}

// business components
${businessExports.join('\n')}

${warningExports.length > 0 ? '// Warning: There is a problem with the following components\n' + warningExports.join('\n') : ''}
`
}

// Generate index.ts file
async function generate(): Promise<void> {
  try {
    // Make sure the output directory exists
    const outDir = path.dirname(outPath)
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true })
    }

    // Scan components
    const components = walk(componentsDir)

    // Generate export content
    const content = generateExports(components)

    // write file
    fs.writeFileSync(outPath, content, 'utf-8')
    // console.log('✅ components/index.ts generated successfully');

    return Promise.resolve()
  } catch (err) {
    console.error('❌ Generate components/index.ts failed:', err)
    return Promise.reject(err)
  }
}

export default generate
