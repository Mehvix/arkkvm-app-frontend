/**
 * @Purpose: Fix Tailwind prefix usage in UI components
 * @Description: Automatically rewrites class names to use the pn helper for prefix handling
 * @Author: zhanglei
 * @Date: 2025-07-18 19:20:00
 */

const fs = require('fs')
const path = require('path')

const prefix = 'jg-'

// UI components directory
const componentsDir = path.join(__dirname, '../src/components/ui')

// Process counters
let processedFiles = 0
let modifiedFiles = 0

// Ensure source directory exists
if (!fs.existsSync(componentsDir)) {
  console.error(`Error: components directory not found ${componentsDir}`)
  process.exit(1)
}

// Recursively process directories
function processDir(dirPath) {
  const files = fs.readdirSync(dirPath)

  files.forEach(file => {
    const filePath = path.join(dirPath, file)
    const stats = fs.statSync(filePath)

    if (stats.isDirectory()) {
      processDir(filePath) // Recurse into nested directories
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath)
    }
  })
}

// Process a single source file
function processFile(filePath) {
  processedFiles++
  console.log(`[Processing] ${path.relative(process.cwd(), filePath)}`)

  let content = fs.readFileSync(filePath, 'utf8')
  const originalContent = content

  // 1) Normalize string literals used in cva/cn usage paths
  content = content.replace(/"([^"]+)"/g, '"$1"')

  // 2) Rewrite hardcoded prefixes in className attributes
  content = content.replace(/className="([^"]*?)"/g, (match, classNames) => {
    // Wrap prefixed class strings with pn(...)
    if (classNames.includes(prefix)) {
      // Remove hardcoded prefix pattern
      const cleanedClassNames = classNames.replace(/jg-/g, '')
      return `className={pn("${cleanedClassNames}")}`
    }
    return match
  })

  // 3) Rewrite class names in VariantProps calls
  content = content.replace(/(\w+)Variants\("([^"]*?)"\)/g, (match, fnName, classNames) => {
    if (classNames.includes(prefix)) {
      const cleanedClassNames = classNames.replace(/jg-/g, '')
      return `${fnName}Variants(pn("${cleanedClassNames}"))`
    }
    return match
  })

  // 4) Rewrite class names in cva(...) invocations
  content = content.replace(/cva\(\s*"([^"]*?)"/g, (match, classNames) => {
    if (classNames.includes(prefix)) {
      const cleanedClassNames = classNames.replace(/jg-/g, '')
      return `cva(pn("${cleanedClassNames}")`
    }
    return match
  })

  // 5) Rewrite class names inside variant object values
  content = content.replace(/:\s*"([^"]*?[^\"]*?)"/g, (match, classNames) => {
    const cleanedClassNames = classNames.replace(/jg-/g, '')
    return `: pn("${cleanedClassNames}")`
  })

  // 6) Add pn import when pn(...) is used but not imported
  if (content.includes('pn(') && !content.includes('import { pn }') && !content.includes('{ cn, pn }')) {
    // Extend existing cn import or insert a new pn import
    if (content.includes('import { cn }')) {
      content = content.replace('import { cn }', 'import { cn, pn }')
    } else {
      // Insert pn import after the first import declaration
      content = content.replace(/^(import[^;]+;)(\s*)/m, '$1$2import { pn } from "@/lib/utils";$2')
    }
  }

  // Persist changes when file content is modified
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`)
    modifiedFiles++
  }
}

// Ensure utils.ts contains the pn helper function
function ensurePnFunction() {
  const utilsPath = path.join(__dirname, '../src/lib/utils.ts')

  if (fs.existsSync(utilsPath)) {
    let content = fs.readFileSync(utilsPath, 'utf8')

    // Append pn helper only when missing
    if (!content.includes('export function pn')) {
      console.log('[Add] pn function to utils.ts')

      // Helper function source to append
      const pnFunction = `
/**
 * Prefix Tailwind class names
 * @param classNames Raw class name string
 * @returns Prefixed class name string
 */
export function pn(classNames: string) {
  if (!classNames) return '';

  // Project prefix
  const prefix = '';

  return classNames
    .split(' ')
    .filter(Boolean)
    .map(className => {
      // Keep class names that are already prefixed
      if (className.startsWith(prefix)) return className;
      return \`${prefix}\${className}\`;
    })
    .join(' ');
}
`;

      // Append helper at the end of utils.ts
      content += pnFunction
      fs.writeFileSync(utilsPath, content, 'utf8')
      console.log('✅ Added pn function to utils.ts')
    } else {
      console.log('✓ utils.ts already contains pn function')
    }
  } else {
    console.error(`Error: utils.ts file not found: ${utilsPath}`)
  }
}

// Run processing
console.log('Start processing prefix issues in component files...')
ensurePnFunction()
processDir(componentsDir)

// Print summary
console.log('\n============ Processing Report ============')
console.log(`Processed files: ${processedFiles}`)
console.log(`Modified files: ${modifiedFiles}`)
console.log('\nTip: After processing, verify component behavior. Some complex class-name cases may still need manual adjustment.')
