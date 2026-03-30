/**
 * @Purpose: Install shadcn UI components in batches
 * @Description: Automatically install multiple common UI components
 * @Author: zhanglei
 * @Date: 2025-07-18 19:18:00
 */

const { execSync } = require('child_process')

// List of all components to be installed - adjust as needed
const components = [
  // Installed component (button already exists)
  // 'button',

  // Common form components
  'form',
  'input',
  'textarea',
  'checkbox',
  'select',
  'label',
  'switch',
  'radio-group',

  // feedback component
  'toast',
  'alert',
  'dialog',
  'alert-dialog',

  // Navigation component
  'dropdown-menu',
  'navigation-menu',
  'tabs',

  // Data display
  'table',
  'avatar',
  'badge',
  'card',
  'calendar',
  'progress',
  'skeleton',

  // other
  'popover',
  'tooltip',
  'hover-card',
  'separator',
  'scroll-area',
]

// Install one by one
console.log('Start installing components...')
let successCount = 0
let failedComponents = []

components.forEach(component => {
  console.log(`\n[Install] ${component}`)
  try {
    execSync(`npx shadcn-ui@latest add ${component} --yes`, {
      stdio: 'inherit',
    })
    console.log(`✅ ${component} installation successful`)
    successCount++
  } catch (error) {
    console.error(`❌ ${component} installation failed`)
    failedComponents.push(component)
  }
})

// Installation report
console.log('\n============ Installation report ============')
console.log(`Total: ${components.length}`)
console.log(`Success: ${successCount}`)
console.log(`Failed: ${failedComponents.length}`)

if (failedComponents.length > 0) {
  console.log('\nFailed component list:')
  failedComponents.forEach(component => console.log(`- ${component}`))
  console.log('\nYou can try to manually install these components later')
}

console.log(
  '\nTip: After component installation, please run "node scripts/fix-prefix.js" to process the prefix problem in the components'
)
