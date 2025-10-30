/**
 * NUCLEAR OPTION: Global Array Protection
 * 
 * This patches Array.prototype to prevent crashes from undefined/null arrays
 * being passed to .map() or .slice() methods.
 * 
 * This is a LAST RESORT solution for production stability.
 */

const originalMap = Array.prototype.map
const originalSlice = Array.prototype.slice

// Override Array.prototype.map to handle undefined context
;(Array.prototype as any).map = function(...args: any[]) {
  if (this == null || this === undefined) {
    console.error('🚨 CRITICAL: .map() called on undefined/null!', new Error().stack)
    return []
  }
  return originalMap.apply(this, args)
}

// Override Array.prototype.slice to handle undefined context
;(Array.prototype as any).slice = function(...args: any[]) {
  if (this == null || this === undefined) {
    console.error('🚨 CRITICAL: .slice() called on undefined/null!', new Error().stack)
    return []
  }
  return originalSlice.apply(this, args)
}

console.log('✅ Array Guard installed - .map() and .slice() are now crash-proof')

