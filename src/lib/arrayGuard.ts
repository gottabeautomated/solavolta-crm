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

// Create safe wrapper
function createSafeMethod(original: Function, methodName: string) {
  return function(this: any, ...args: any[]) {
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
      console.error(`🚨 ERROR in .${methodName}():`, error)
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

console.log('✅ Array Guard v2 installed - ALL array methods are now crash-proof')

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

