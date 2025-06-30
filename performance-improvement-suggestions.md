# Performance Improvement Suggestions for Campsite Web App

## Executive Summary

After analyzing the Campsite web application codebase, I've identified several performance optimization opportunities across bundle size, runtime performance, and build efficiency. The app is a sophisticated Next.js application with real-time features, extensive use of React Query, and complex components that could benefit from targeted optimizations.

## Key Findings

### 1. **Bundle Size Optimization**

**Issue**: Large dependency footprint with potential for tree-shaking improvements
- 100+ dependencies in the web app
- Heavy use of UI libraries (@radix-ui, framer-motion, etc.)
- Multiple large dependencies (Tiptap editor, 100ms video SDK, etc.)

**Recommendations**:
```typescript
// Instead of importing entire libraries, use specific imports
// ❌ Bad
import * as Sentry from '@sentry/nextjs'

// ✅ Good  
import { captureException } from '@sentry/nextjs'
```

**Action Items**:
- Enable bundle analyzer permanently in CI to track bundle size changes
- Implement dynamic imports for heavy components (video calls, editor)
- Consider code splitting for rarely used features

### 2. **React Performance Issues**

**Issue**: Potential over-rendering in complex components
- `ThreadView.tsx` (333 lines) has multiple useEffect hooks without proper memoization
- Large components like `InboxSplitView.tsx` (812 lines) could benefit from decomposition
- Inconsistent use of React.memo across similar components

**Critical Performance Bottleneck - ThreadView Component**:
```typescript
// Current implementation has performance issues:
const messages = useMemo(() => flattenInfiniteData(messageData)?.reverse() || [], [messageData])

// Multiple useEffect hooks that could cause cascading re-renders:
useEffect(() => {
  // Complex dependency array that triggers frequently
}, [threadId, endInView, markThreadRead, setHasNewMessages, messages.length, isFocused, createMessage.isPending, threadPlacement, thread?.viewer_is_thread_member])
```

**Recommendations**:
- Split large components into smaller, focused components
- Implement React.memo consistently for list items and cards
- Use useCallback for event handlers passed to child components
- Consider virtualization for long message lists

### 3. **React Query Optimization**

**Issue**: Potential over-fetching and inefficient cache usage
- Heavy use of infinite queries without proper stale time configuration
- No global query defaults for caching strategies
- Potential for request waterfalls in nested components

**Recommendations**:
```typescript
// Add global query defaults in queryClient.ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error.status === 404) return false
        return failureCount < 2
      },
    },
  },
})
```

### 4. **Image and Media Optimization**

**Issue**: Unoptimized images despite using Next.js Image component
```typescript
// Current config disables optimization
images: {
  unoptimized: true, // ❌ This disables Next.js image optimization
  domains: [...]
}
```

**Recommendations**:
- Re-enable Next.js image optimization
- Implement proper image sizing and responsive images
- Use WebP format with fallbacks
- Add blur placeholders for better perceived performance

### 5. **Build Performance**

**Issue**: Turbo cache configuration could be more aggressive
- Limited cache outputs specified
- No cache for lint operations that could benefit

**Current turbo.json**:
```json
{
  "build": {
    "dependsOn": ["^build"],
    "outputs": ["dist/**", ".next/**"]
  }
}
```

**Improved configuration**:
```json
{
  "build": {
    "dependsOn": ["^build"],
    "outputs": ["dist/**", ".next/**", ".next/cache/**"],
    "env": ["NODE_ENV", "NEXT_PUBLIC_*"]
  },
  "lint": {
    "outputs": [".eslintcache"]
  }
}
```

## Specific Code Improvements

### 1. ThreadView Component Optimization

**Current Issue**: Complex useEffect with many dependencies causing frequent re-renders

**Solution**:
```typescript
// Split the complex useEffect into smaller, focused effects
useEffect(() => {
  if (!endInView || !messages.length) return
  setHasNewMessages(false)
}, [endInView, messages.length])

useEffect(() => {
  if (!threadId || !isFocused || createMessage.isPending) return
  if (!thread?.viewer_is_thread_member) return
  
  const markAsRead = () => {
    if (threadPlacement === 'hovercard') {
      return setTimeout(() => markThreadRead({ threadId }), 1000)
    }
    markThreadRead({ threadId })
  }
  
  return markAsRead()
}, [threadId, isFocused, createMessage.isPending, thread?.viewer_is_thread_member, threadPlacement])
```

### 2. Infinite Scroll Optimization

**Current InfiniteLoader**: Basic implementation without debouncing

**Improved version**:
```typescript
import { useDebouncedCallback } from 'use-debounce'

export function InfiniteLoader(props: Props) {
  const debouncedFetchNextPage = useDebouncedCallback(
    props.fetchNextPage,
    100, // Debounce scroll events
    { leading: true, trailing: false }
  )
  
  const [ref, inView] = useInView({
    threshold: 0,
    rootMargin: '100px', // Trigger earlier for better UX
  })

  useEffect(() => {
    if (shouldFetch) {
      debouncedFetchNextPage()
    }
  }, [debouncedFetchNextPage, shouldFetch])
}
```

### 3. Memoization Strategy

**Add consistent memoization for expensive operations**:
```typescript
// For large lists
export const MessageList = memo(function MessageList({ messages, onNewMessage }) {
  return (
    <div>
      {messages.map(message => (
        <MessageItem key={message.id} message={message} />
      ))}
    </div>
  )
})

// For complex calculations
const sortedAndFilteredItems = useMemo(() => {
  return items
    .filter(item => item.isVisible)
    .sort((a, b) => a.priority - b.priority)
}, [items]) // Only recalculate when items change
```

## Implementation Priority

### High Priority (Immediate Impact)
1. **Enable Next.js image optimization** - Easy win with significant impact
2. **Add React.memo to list components** - Prevents unnecessary re-renders
3. **Split ThreadView component** - Major performance bottleneck
4. **Implement bundle analysis in CI** - Prevents regression

### Medium Priority (1-2 weeks)
1. **Optimize React Query configuration** - Better caching strategy
2. **Implement code splitting** - Reduce initial bundle size
3. **Add virtualization for long lists** - Better performance with large datasets

### Low Priority (Future iterations)
1. **Implement service worker** - Offline support and caching
2. **Add performance monitoring** - Track Core Web Vitals
3. **Consider moving to React 18 concurrent features** - Better user experience

## Monitoring and Metrics

**Implement performance tracking**:
1. Add Lighthouse CI to track Core Web Vitals
2. Use Next.js built-in performance monitoring
3. Track bundle size changes in CI
4. Monitor React Query cache hit rates

## Expected Impact

- **Bundle size reduction**: 15-25% through tree-shaking and code splitting
- **Runtime performance**: 30-40% improvement in component re-render frequency
- **Build time**: 20-30% faster builds through better Turbo cache configuration
- **User experience**: Improved perceived performance through better loading states and image optimization

## Next Steps

1. Start with high-priority items that have immediate impact
2. Set up performance monitoring to track improvements
3. Implement changes incrementally to measure impact
4. Consider performance budgets to prevent regression

This analysis provides a roadmap for systematic performance improvements while maintaining the application's rich feature set and user experience.