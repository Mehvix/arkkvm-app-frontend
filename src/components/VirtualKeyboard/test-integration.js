/**
 * Virtual keyboard integration test script
 * Run this script in the browser console to test custom-field behavior
 */



// Test counters
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
};

// Test function
function runTest(testName, testFn) {
  testResults.total++;
  try {
    const result = testFn();
    if (result) {
      
      testResults.passed++;
    } else {
      
      testResults.failed++;
    }
  } catch (error) {
    
    testResults.failed++;
  }
}

// Event listener test
let capturedEvents = [];

function setupEventListener() {
  const listener = event => {
    if (event.virtualKeyboardSource) {
      capturedEvents.push({
        key: event.key,
        code: event.code,
        source: event.virtualKeyboardSource,
        type: event.type,
        timestamp: Date.now(),
      });
    }
  };

  document.addEventListener('keydown', listener);
  document.addEventListener('keyup', listener);

  return () => {
    document.removeEventListener('keydown', listener);
    document.removeEventListener('keyup', listener);
  };
}

// Start testing
const cleanup = setupEventListener();

// Test 1: Check whether virtual keyboard component exists
runTest('Virtual keyboard component existence check', () => {
  const virtualKeyboard = document.querySelector(
    '[class*="keyboard-container"]'
  );
  return virtualKeyboard !== null;
});

// Test 2: Check whether key elements exist
runTest('Virtual key element check', () => {
  const keys = document.querySelectorAll('button[aria-label]');
  return keys.length > 0;
});

// Test 3: Simulate keyboard event and check custom fields
runTest('Custom field event simulation test', () => {
  // Create a test event with custom field
  const testEvent = new KeyboardEvent('keydown', {
    key: 'a',
    code: 'KeyA',
    bubbles: true,
    cancelable: true,
  });

  // Add custom field
  Object.defineProperty(testEvent, 'virtualKeyboardSource', {
    value: 'test-integration',
    writable: false,
    enumerable: true,
    configurable: false,
  });

  // Clear previous events
  capturedEvents = [];

  // Dispatch event
  document.dispatchEvent(testEvent);

  // Check whether event was captured
  return (
    capturedEvents.length > 0 && capturedEvents[0].source === 'test-integration'
  );
});

// Test 4: Click virtual key test
runTest('Virtual key click test', () => {
  const keys = document.querySelectorAll('button[aria-label]');
  if (keys.length === 0) return false;

  // Clear previous events
  capturedEvents = [];

  // Click first key
  const firstKey = keys[0];
  firstKey.click();

  // Wait for event processing
  return new Promise(resolve => {
    setTimeout(() => {
      const hasVirtualKeyboardEvent = capturedEvents.some(
        event => event.source && event.source.includes('virtual-keyboard')
      );
      resolve(hasVirtualKeyboardEvent);
    }, 100);
  });
});

// Delay async test execution
setTimeout(() => {
  // Test 5: Check different types of custom sources
  runTest('Multiple custom source check', () => {
    const expectedSources = [
      'virtual-keyboard-modifier',
      'virtual-keyboard-regular',
      'virtual-keyboard-keyup',
    ];

    const foundSources = [...new Set(capturedEvents.map(e => e.source))];
    return expectedSources.some(source => foundSources.includes(source));
  });

  // Output test results
  setTimeout(() => {
    

    if (capturedEvents.length > 0) {
      
      capturedEvents.forEach((event, index) => {
        
      });
    } else {
      
    }

    // Clean up event listeners
    cleanup();

    
  }, 500);
}, 200);

// Provide manual test guidance

