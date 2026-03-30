let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
}

function runTest(testName, testFn) {
  testResults.total++
  try {
    const result = testFn()
    if (result) {
      testResults.passed++
    } else {
      testResults.failed++
    }
  } catch (error) {
    testResults.failed++
  }
}

let capturedEvents = []

function setupEventListener() {
  const listener = event => {
    if (event.virtualKeyboardSource) {
      capturedEvents.push({
        key: event.key,
        code: event.code,
        source: event.virtualKeyboardSource,
        type: event.type,
        timestamp: Date.now(),
      })
    }
  }

  document.addEventListener('keydown', listener)
  document.addEventListener('keyup', listener)

  return () => {
    document.removeEventListener('keydown', listener)
    document.removeEventListener('keyup', listener)
  }
}

const cleanup = setupEventListener()

runTest('Virtual Keyboard Component Existence Check', () => {
  const virtualKeyboard = document.querySelector(
    '[class*="keyboard-container"]'
  )
  return virtualKeyboard !== null
})

runTest('Virtual Key Element Check', () => {
  const keys = document.querySelectorAll('button[aria-label]')
  return keys.length > 0
})

runTest('Custom Field Event Simulation Test', () => {
  const testEvent = new KeyboardEvent('keydown', {
    key: 'a',
    code: 'KeyA',
    bubbles: true,
    cancelable: true,
  })

  Object.defineProperty(testEvent, 'virtualKeyboardSource', {
    value: 'test-integration',
    writable: false,
    enumerable: true,
    configurable: false,
  })

  capturedEvents = []

  document.dispatchEvent(testEvent)

  return (
    capturedEvents.length > 0 && capturedEvents[0].source === 'test-integration'
  )
})

runTest('Virtual Key Click Test', () => {
  const keys = document.querySelectorAll('button[aria-label]')
  if (keys.length === 0) return false

  capturedEvents = []

  const firstKey = keys[0]
  firstKey.click()

  return new Promise(resolve => {
    setTimeout(() => {
      const hasVirtualKeyboardEvent = capturedEvents.some(
        event => event.source && event.source.includes('virtual-keyboard')
      )
      resolve(hasVirtualKeyboardEvent)
    }, 100)
  })
})

setTimeout(() => {
  runTest('Multiple Custom Source Check', () => {
    const expectedSources = [
      'virtual-keyboard-modifier',
      'virtual-keyboard-regular',
      'virtual-keyboard-keyup',
    ]

    const foundSources = [...new Set(capturedEvents.map(e => e.source))]
    return expectedSources.some(source => foundSources.includes(source))
  })

  setTimeout(() => {
    if (capturedEvents.length > 0) {
      capturedEvents.forEach((event, index) => {})
    } else {
    }

    cleanup()
  }, 500)
}, 200)
