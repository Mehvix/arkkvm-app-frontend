/**
 * @Purpose: Handle Tailwind prefix problem in UI components
 * @Description: Automatically modify the class name in the component file and use the pn function to process the prefix
 * @Author: zhanglei
 * @Date: 2025-07-18 19:20:00
 */

const fs = require('fs');
const path = require('path');

// UI component directory
const componentsDir = path.join(__dirname, '../src/components/ui');

// Processed file count
let processedFiles = 0;
let modifiedFiles = 0;

// Check if directory exists
if (!fs.existsSync(componentsDir)) {
  console.error(`Error: Component directory not found: ${componentsDir}`);
  process.exit(1);
}

// Process directories recursively
function processDir(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isDirectory()) {
      processDir(filePath); // Process subdirectories recursively
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      processFile(filePath);
    }
  });
}

// Process a single file
function processFile(filePath) {
  processedFiles++;
  console.log(`[Process] ${path.relative(process.cwd(), filePath)}`);

  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Handle hardcoded prefixes in cva and cn function calls
  content = content.replace(/"([^"]+)"/g, '"$1"');

  // 2. Handle hardcoded prefix in className
  content = content.replace(/className="([^"]*?)"/g, (match, classNames) => {
    // If the class name contains a prefix, wrap it with the pn function
    if (classNames.includes('')) {
      // Remove hardcoded prefixes
      const cleanedClassNames = classNames.replace(//g, '');
      return `className={pn("${cleanedClassNames}")}`;
    }
    return match;
  });

  // 3. Process class names in VariantProps
  content = content.replace(/(\w+)Variants\("([^"]*?)"\)/g, (match, fnName, classNames) => {
    if (classNames.includes('')) {
      const cleanedClassNames = classNames.replace(//g, '');
      return `${fnName}Variants(pn("${cleanedClassNames}"))`;
    }
    return match;
  });

  // 4. Handle class names in cva functions
  content = content.replace(/cva\(\s*"([^"]*?)"/g, (match, classNames) => {
    if (classNames.includes('')) {
      const cleanedClassNames = classNames.replace(//g, '');
      return `cva(pn("${cleanedClassNames}")`;
    }
    return match;
  });

  // 5. Process class names in variant objects
  content = content.replace(/:\s*"([^"]*?[^"]*?)"/g, (match, classNames) => {
    const cleanedClassNames = classNames.replace(//g, '');
    return `: pn("${cleanedClassNames}")`;
  });

  // 6. Add pn import (if the pn function is used in the file and is not imported)
  if (content.includes('pn(') && !content.includes('import { pn }') && !content.includes('{ cn, pn }')) {
    // Check if cn has been imported
    if (content.includes('import { cn }')) {
      content = content.replace('import { cn }', 'import { cn, pn }');
    } else {
      // Add after the first import
      content = content.replace(/^(import[^;]+;)(\s*)/m, '$1$2import { pn } from "@/lib/utils";$2');
    }
  }

  // If there are any changes, save the file
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${path.relative(process.cwd(), filePath)}`);
    modifiedFiles++;
  }
}

// Process the utils.ts file to ensure that the pn function is available
function ensurePnFunction() {
  const utilsPath = path.join(__dirname, '../src/lib/utils.ts');

  if (fs.existsSync(utilsPath)) {
    let content = fs.readFileSync(utilsPath, 'utf8');

    // Check if pn function already exists
    if (!content.includes('export function pn')) {
      console.log('[Add] pn function to utils.ts');

      // Add pn function
      const pnFunction = `
/**
 * Handle Tailwind class name prefix
 * @param classNames original class name string
 * @returns class name after adding prefix
 */
export function pn(classNames: string) {
  if (!classNames) return '';

  // Project prefix
  const prefix = '';

  return classNames
    .split(' ')
    .filter(Boolean)
    .map(className => {
      // Skip class names that already have prefixes
      if (className.startsWith(prefix)) return className;
      return \`\${prefix}\${className}\`;
    })
    .join(' ');
}
`;

      // Add pn function at the end of the file
      content += pnFunction;
      fs.writeFileSync(utilsPath, content, 'utf8');
      console.log('✅ Added pn function to utils.ts');
    } else {
      console.log('✓ pn function already exists in utils.ts');
    }
  } else {
    console.error(`Error: utils.ts file not found: ${utilsPath}`);
  }
}

// Execute processing
console.log('Start processing the prefix problem in the component file...');
ensurePnFunction();
processDir(componentsDir);

// Print statistics
console.log('\n============ Processing Report ============');
console.log(`Processed file count: ${processedFiles}`);
console.log(`Modified file count: ${modifiedFiles}`);
console.log('\nTip: After processing, please check if the components are working normally, and may need to manually adjust some complex class name processing');
