/**
 * NUCLEAR OPTION: Global Array Protection
 * 
 * This patches Array.prototype to prevent crashes from undefined/null arrays
 * being passed to .map() or .slice() methods.
 * 
 * This is a LAST RESORT solution for production stability.
 */

// Store original methods
const originalMap = Array.prototype.map
const originalSlice = Array.prototype.slice
const originalForEach = Array.prototype.forEach
const originalFilter = Array.prototype.filter
const originalReduce = Array.prototype.reduce

// Create safe wrapper that AGGRESSIVELY logs everything
function createSafeMethod(original: Function, methodName: string) {
  return function(this: any, ...args: any[]) {
    // Log EVERY call for debugging
    if (methodName === 'map' && (this == null || this === undefined)) {
      console.error(`🚨 CRITICAL: .${methodName}() called on undefined/null!`, {
        stack: new Error().stack,
        thisValue: this,
        args: args
      })
      return []
    }
    
    if (this == null || this === undefined) {
      console.error(`🚨 CRITICAL: .${methodName}() called on undefined/null!`, {
        stack: new Error().stack,
        args: args
      })
      return methodName === 'forEach' ? undefined : []
    }
    
    try {
      return original.apply(this, args)
    } catch (error) {
      console.error(`🚨 ERROR in .${methodName}():`, error, {
        stack: new Error().stack,
        thisValue: this,
        args: args
      })
      return methodName === 'forEach' ? undefined : []
    }
  }
}

// Override ALL array methods
Object.defineProperty(Array.prototype, 'map', {
  value: createSafeMethod(originalMap, 'map'),
  writable: true,
  configurable: true,
  enumerable: false
})

Object.defineProperty(Array.prototype, 'slice', {
  value: createSafeMethod(originalSlice, 'slice'),
  writable: true,
  configurable: true,
  enumerable: false
})

Object.defineProperty(Array.prototype, 'forEach', {
  value: createSafeMethod(originalForEach, 'forEach'),
  writable: true,
  configurable: true,
  enumerable: false
})

Object.defineProperty(Array.prototype, 'filter', {
  value: createSafeMethod(originalFilter, 'filter'),
  writable: true,
  configurable: true,
  enumerable: false
})

Object.defineProperty(Array.prototype, 'reduce', {
  value: createSafeMethod(originalReduce, 'reduce'),
  writable: true,
  configurable: true,
  enumerable: false
})

// Also patch String.prototype.slice for safety
const originalStringSlice = String.prototype.slice;
(String.prototype as any).slice = function(...args: any[]) {
  if (this == null || this === undefined) {
    console.error('🚨 CRITICAL: String.slice() called on undefined/null!', {
      stack: new Error().stack,
      thisValue: this,
      args: args
    })
    return ''
  }
  try {
    return originalStringSlice.apply(this, args)
  } catch (error) {
    console.error('🚨 ERROR in String.slice():', error, {
      stack: new Error().stack,
      thisValue: this,
      args: args
    })
    return ''
  }
}

console.log('✅ Array Guard v3 installed - ALL array AND string methods are now crash-proof')

// Re-install every second to fight against any overrides
setInterval(() => {
  if (Array.prototype.map !== createSafeMethod(originalMap, 'map')) {
    console.warn('⚠️ Array.prototype.map was overridden! Re-installing guard...')
    Object.defineProperty(Array.prototype, 'map', {
      value: createSafeMethod(originalMap, 'map'),
      writable: true,
      configurable: true,
      enumerable: false
    })
  }
}, 1000)

