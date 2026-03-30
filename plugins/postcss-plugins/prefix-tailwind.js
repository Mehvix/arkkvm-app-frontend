/**
 * @Purpose: PostCSS plug-in - Tailwind class names are automatically prefixed
 * @Description: This plugin automatically adds a prefix to all Tailwind-generated atomic classes during the PostCSS processing phase
 * @Author: zhanglei
 * @Date: 2025-07-18 18:15:00
 */

// Using ES module format

const DEFAULT_PREFIX = 'jg'

/**
 * Determine whether the selector is the Tailwind class name
 */
function isTailwindClass(selector) {
  // Simple implementation: match class selectors starting with dot
  // More complex matching logic can be added based on project needs
  return selector.includes('.')
}

/**
 * Check if the selector already has a prefix
 */
function hasPrefix(selector, prefix) {
  // Check if selector already contains prefix
  return (
    selector.includes(`.${prefix}:`) ||
    selector.includes(`.${prefix}-`) ||
    selector.split(':').some(part => part.includes(`.${prefix}`))
  )
}

/**
 * Add prefix to selector
 */
function addPrefixToSelector(selector, prefix) {
  // Split selector handles complex scenarios (such as containing multiple classes, states, etc.)
  return selector.replace(/\.([-\w]+)/g, (match, className) => {
    // Exclude class names that already have prefixes
    if (hasPrefix(match, prefix)) {
      return match
    }
    // add prefix
    return `.${prefix}:${className}`
  })
}

/**
 * Custom PostCSS plugin: add prefixes to all Tailwind classes
 * This plugin will process the compiled CSS to ensure that all Tailwind class names have the correct prefix
 * Suitable for scenarios that support dynamic generation of class names
 */
const postcssPlugin = (opts = {}) => {
  // Get configuration options
  const prefix = opts.prefix || DEFAULT_PREFIX
  const debug = opts.debug || false

  // Return PostCSS plugin function
  return {
    postcssPlugin: 'postcss-tailwind-prefix',

    // Process every CSS rule
    Rule(rule) {
      // Only handle actual class name selectors, skip pseudo-elements, media queries, etc.
      if (
        !rule.selector ||
        rule.selector.startsWith('@') ||
        (rule.parent && rule.parent.name === 'keyframes')
      ) {
        return
      }

      // Handling class names in selectors
      const modifiedSelectors = rule.selector
        .split(',')
        .map(selector => {
          // Check whether it is a Tailwind class name (the judgment logic can be adjusted according to project requirements)
          if (isTailwindClass(selector)) {
            // If the selector already has a prefix, no processing will be done.
            if (hasPrefix(selector, prefix)) {
              return selector
            }

            // Add prefix to selector
            const prefixed = addPrefixToSelector(selector, prefix)
            if (debug) {
              // console.log(`[PostCSS Tailwind Prefix] ${selector} -> ${prefixed}`);
            }
            return prefixed
          }
          return selector
        })
        .join(',')

      // Update selector for rules
      if (rule.selector !== modifiedSelectors) {
        rule.selector = modifiedSelectors
      }
    },
  }
}

postcssPlugin.postcss = true // Define PostCSS plugin tags

export default postcssPlugin
