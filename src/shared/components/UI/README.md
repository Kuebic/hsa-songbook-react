# Unified Error UI System

A comprehensive, accessible, and consistent error handling system for React applications.

## Overview

The Unified Error UI System provides a complete set of components, hooks, and utilities for handling errors, status updates, and user feedback throughout your React application. It replaces inconsistent error patterns with a cohesive design system that prioritizes accessibility and user experience.

## Key Features

- **🎨 Consistent Design Language**: Semantic color variants, unified typography, and standardized spacing
- **♿ Accessibility First**: WCAG 2.1 compliant with screen reader support, focus management, and keyboard navigation
- **🎬 Smooth Animations**: Configurable entrance animations and hover states
- **📱 Responsive**: Mobile-optimized layouts with touch-friendly interactions
- **🔧 Developer Experience**: TypeScript support, comprehensive documentation, and intuitive APIs

## Architecture

```
Unified Error UI System
├── Design Tokens (errorUITokens.ts)
├── Base Components
│   ├── StatusCard - Container component
│   ├── StatusIcon - SVG icon system
│   ├── StatusHeading/Description/Caption - Typography
│   ├── StatusActions - Action button layouts
│   └── StatusToast - Notification system
├── Error Boundaries
│   ├── RouteErrorBoundary - Page-level errors
│   ├── AsyncErrorBoundary - Background operation errors
│   └── ServiceErrorBoundary - Service layer errors  
├── Status Components
│   ├── OfflineIndicator - Network status
│   ├── SyncStatus - Synchronization progress
│   ├── StorageQuotaWarning - Storage management
│   └── UpdatePrompt - App update notifications
└── Hooks
    ├── useFocusManagement - Accessibility focus handling
    └── useToastHelpers - Toast notification helpers
```

## Quick Start

### Basic Error Display

```tsx
import { StatusCard, ErrorIcon, StatusHeading, StatusDescription, StatusActions } from './UI';

function BasicError() {
  return (
    <StatusCard variant="error" size="md" animation="slide-up">
      <ErrorIcon size="lg" className="mb-3" />
      <StatusHeading colorVariant="error">
        Something went wrong
      </StatusHeading>
      <StatusDescription colorVariant="neutral" className="mb-4">
        We encountered an unexpected error. Please try again.
      </StatusDescription>
      <StatusActions
        actions={[
          {
            label: 'Try Again',
            onClick: handleRetry,
            variant: 'primary',
            isPrimary: true
          }
        ]}
        autoFocus={true}
      />
    </StatusCard>
  );
}
```

### Using Error Boundaries

```tsx
import { RouteErrorBoundary } from './UI';

function App() {
  return (
    <RouteErrorBoundary>
      <YourAppContent />
    </RouteErrorBoundary>
  );
}
```

### Toast Notifications

```tsx
import { showError, showSuccess, showWarning, showInfo } from './UI/StatusToast';

function handleOperation() {
  try {
    // Your operation
    showSuccess('Operation Complete', 'Your changes have been saved.');
  } catch (error) {
    showError('Operation Failed', error.message);
  }
}
```

## Component Reference

### StatusCard

The foundational container component for all error and status displays.

```tsx
interface StatusCardProps {
  variant?: 'error' | 'warning' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  animation?: 'fade-in' | 'slide-up' | 'slide-down' | 'scale' | 'none';
  interactive?: boolean;
  centered?: boolean;
  // ... accessibility props
}
```

**Variants:**
- `error` - Red theme for critical errors
- `warning` - Orange theme for warnings
- `success` - Green theme for success states
- `info` - Blue theme for informational content

**Animations:**
- `fade-in` - Simple opacity transition (default)
- `slide-up` - Slides up from bottom
- `slide-down` - Slides down from top
- `scale` - Scales in from 95% size
- `none` - No animation

### StatusIcon

Consistent SVG icon system replacing emoji icons.

```tsx
interface StatusIconProps {
  type: 'error' | 'warning' | 'success' | 'info' | 'loading' | 'sync' | ...
  variant?: 'error' | 'warning' | 'success' | 'info';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  animate?: boolean;
  animation?: 'spin' | 'pulse' | 'bounce' | 'shake';
  decorative?: boolean;
}
```

**Common Icons:**
- `error` - Triangle with exclamation
- `warning` - Triangle with exclamation
- `success` - Circle with checkmark
- `info` - Circle with 'i'
- `loading` - Spinning arrows (auto-animated)
- `offline` - Crossed out circle
- `sync` - Circular arrows
- `storage` - Server/database icon

### StatusActions

Standardized action button layouts with focus management.

```tsx
interface StatusActionsProps {
  actions: StatusAction[];
  autoFocus?: boolean;
  trapFocus?: boolean;
  orientation?: 'horizontal' | 'vertical';
  alignment?: 'left' | 'center' | 'right';
}

interface StatusAction {
  label: string;
  onClick: () => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'outline';
  isPrimary?: boolean; // For focus management
  'aria-label'?: string;
}
```

**Predefined Action Sets:**
- `StatusRetryActions` - Retry/Cancel patterns
- `StatusNavigationActions` - Go Home/Back/Refresh
- `StatusStorageActions` - Storage management actions
- `StatusServiceWorkerActions` - Service worker controls

### Typography Components

Consistent text styling with semantic color variants.

```tsx
// Available components
<StatusHeading colorVariant="error">Error Title</StatusHeading>
<StatusDescription colorVariant="neutral">Detailed description</StatusDescription>
<StatusCaption colorVariant="info">Additional info</StatusCaption>

// Color variants
colorVariant: 'error' | 'warning' | 'success' | 'info' | 'neutral'
```

## Error Boundary System

### RouteErrorBoundary

Catches and displays page-level routing errors with contextual recovery actions.

```tsx
<RouteErrorBoundary>
  <Router>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/songs" element={<Songs />} />
    </Routes>
  </Router>
</RouteErrorBoundary>
```

**Features:**
- Route-specific error messages
- Contextual recovery actions (Go Home, Go Back, Refresh)
- Full-page error display with proper styling

### AsyncErrorBoundary

Handles background operation errors with graceful degradation options.

```tsx
<AsyncErrorBoundary operation="sync" allowBackground={true}>
  <DataSyncComponent />
</AsyncErrorBoundary>
```

**Features:**
- Operation-specific error messages and recovery actions
- Background mode for non-critical failures
- Retry counters and persistent error warnings

### ServiceErrorBoundary

Manages service layer errors (storage, network, APIs).

```tsx
<ServiceErrorBoundary category="storage">
  <OfflineStorageProvider>
    <App />
  </OfflineStorageProvider>
</ServiceErrorBoundary>
```

## Status Components

### OfflineIndicator

Displays network connectivity status with optional details.

```tsx
<OfflineIndicator 
  position="top" 
  showDetails={true}
  autoHide={true} 
/>
```

**States:**
- `online` - Green, connected
- `limited` - Orange, limited connectivity  
- `offline` - Red, no connection

### SyncStatus

Shows synchronization progress and queue status.

```tsx
<SyncStatus 
  showDetails={true}
  compact={false}
/>
```

**Features:**
- Progress tracking with completed/pending/failed counts
- Visual progress bar
- Failed operations details
- Clear completed/all actions

### StorageQuotaWarning

Storage usage monitoring and management interface.

```tsx
<StorageQuotaWarning 
  userId={currentUser.id}
  showDetails={true}
  autoHide={false}
/>
```

**Features:**
- Visual usage percentage and breakdown
- Cleanup actions with confirmation
- Data export functionality
- Storage persistence requests

### UpdatePrompt

Application update notifications with user controls.

```tsx
<UpdatePrompt 
  position="bottom"
  autoDismiss={30000}
/>
```

**Features:**
- Update progress tracking
- User-friendly update descriptions
- Dismissible with "Later" option
- Multiple display positions

## Accessibility Features

### WCAG 2.1 Compliance

- **Color Contrast**: All variants meet AA contrast requirements
- **Focus Management**: Logical tab order and focus trapping
- **Screen Readers**: Proper ARIA labels, roles, and live regions
- **Keyboard Navigation**: Full keyboard accessibility

### Focus Management

```tsx
import { useFocusManagement, useErrorBoundaryFocus } from './hooks/useFocusManagement';

function CustomErrorComponent() {
  const { containerRef, primaryActionRef, handleKeyDown } = useErrorBoundaryFocus({
    autoFocusPrimary: true,
    trapFocus: true,
    returnFocus: true
  });

  return (
    <div 
      ref={containerRef}
      onKeyDown={handleKeyDown}
      role="alert"
      aria-live="assertive"
    >
      <button ref={primaryActionRef}>Primary Action</button>
    </div>
  );
}
```

### ARIA Patterns

```tsx
// Error alerts
<StatusCard 
  variant="error" 
  role="alert" 
  aria-live="assertive"
  aria-label="Critical error occurred"
>

// Status updates  
<StatusCard 
  variant="info"
  role="status"
  aria-live="polite" 
  aria-label="Status update"
>

// Interactive elements
<StatusActions
  autoFocus={true}
  trapFocus={true}
  aria-label="Error recovery actions"
  actions={[
    {
      label: 'Retry',
      'aria-label': 'Retry the failed operation',
      isPrimary: true
    }
  ]}
/>
```

## Design Tokens

The system uses centralized design tokens for consistency:

```tsx
// Color system
ErrorUIColors = {
  error: { 50: '#fef2f2', 500: '#ef4444', 600: '#dc2626', ... },
  warning: { 50: '#fffbeb', 500: '#f59e0b', 600: '#d97706', ... },
  success: { 50: '#f0fdf4', 500: '#22c55e', 600: '#16a34a', ... },
  info: { 50: '#eff6ff', 500: '#3b82f6', 600: '#2563eb', ... },
  neutral: { 50: '#f9fafb', 500: '#6b7280', 600: '#4b5563', ... }
}

// Typography
ErrorUITypography = {
  heading: { fontSize: '1.25rem', lineHeight: '1.75rem', fontWeight: '600' },
  description: { fontSize: '0.875rem', lineHeight: '1.25rem', fontWeight: '400' },
  caption: { fontSize: '0.75rem', lineHeight: '1rem', fontWeight: '400' }
}

// Spacing
ErrorUISpacing = {
  padding: { xs: '0.5rem', sm: '0.75rem', md: '1rem', lg: '1.5rem', xl: '2rem' },
  gap: { xs: '0.25rem', sm: '0.5rem', md: '0.75rem', lg: '1rem' }
}
```

## Animation System

Custom CSS animations for smooth user experience:

```css
/* Available animations */
.animate-fadeIn { animation: fadeIn 0.3s ease-out; }
.animate-slideUp { animation: slideUp 0.3s ease-out; }
.animate-slideDown { animation: slideDown 0.3s ease-out; }
.animate-scaleIn { animation: scaleIn 0.3s ease-out; }
.animate-pulse { animation: pulse 2s infinite; }
.animate-spin { animation: spin 1s linear infinite; }
.animate-bounce { animation: bounce 1s infinite; }
.animate-shake { animation: shake 0.5s ease-in-out; }
```

## Best Practices

### Error Message Guidelines

1. **Be Specific**: Provide actionable error messages
   ```tsx
   // Good
   <StatusDescription>
     Connection timeout. Check your internet connection and try again.
   </StatusDescription>
   
   // Bad  
   <StatusDescription>
     An error occurred.
   </StatusDescription>
   ```

2. **Provide Context**: Include relevant details
   ```tsx
   <StatusDescription>
     Failed to save song "Yesterday" to playlist "Favorites". 
     Storage may be full.
   </StatusDescription>
   ```

3. **Offer Solutions**: Always provide recovery actions
   ```tsx
   <StatusActions
     actions={[
       { label: 'Retry Save', onClick: retrySave, variant: 'primary' },
       { label: 'Check Storage', onClick: checkStorage, variant: 'secondary' },
       { label: 'Save Later', onClick: saveForLater, variant: 'outline' }
     ]}
   />
   ```

### Accessibility Guidelines  

1. **Focus Management**: Always manage focus for error states
2. **Screen Readers**: Use appropriate ARIA labels and live regions
3. **Color Independence**: Don't rely solely on color to convey meaning
4. **Keyboard Support**: Ensure all actions are keyboard accessible

### Performance Considerations

1. **Lazy Loading**: Import components only when needed
2. **Animation Preferences**: Respect `prefers-reduced-motion`
3. **Toast Limits**: Limit concurrent toast notifications
4. **Error Deduplication**: Prevent duplicate error displays

## Migration Guide

### From Legacy Alert System

```tsx
// Before: Browser alerts
alert('Operation failed!');

// After: StatusToast
import { showError } from './UI/StatusToast';
showError('Operation Failed', 'Please check your connection and try again.');
```

### From Custom Error Components

```tsx
// Before: Custom error display
<div className="error-container">
  <span className="error-icon">⚠️</span>
  <h3 className="error-title">Error</h3>
  <p className="error-message">{message}</p>
  <button onClick={retry}>Retry</button>
</div>

// After: Unified system
<StatusCard variant="error" animation="slide-up">
  <WarningIcon size="lg" className="mb-3" />
  <StatusHeading colorVariant="error">Error</StatusHeading>
  <StatusDescription colorVariant="neutral" className="mb-4">
    {message}
  </StatusDescription>
  <StatusRetryActions onRetry={retry} autoFocus={true} />
</StatusCard>
```

## Troubleshooting

### Common Issues

1. **Icons not displaying**: Ensure ErrorUITokens are imported
2. **Focus not working**: Check if useFocusManagement hook is properly used
3. **Animations not smooth**: Verify CSS animations are loaded in index.css
4. **Toast not appearing**: Ensure StatusToastProvider is in your app root

### Debug Mode

Enable debug logging for error boundaries:

```tsx
<RouteErrorBoundary 
  onError={(error, errorInfo) => {
    console.log('Route Error:', error, errorInfo);
  }}
>
```

## Contributing

When adding new error UI components:

1. Follow the design token system
2. Include accessibility attributes
3. Add TypeScript interfaces
4. Write comprehensive documentation
5. Include usage examples
6. Test with screen readers

## Related Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Error Boundaries](https://reactjs.org/docs/error-boundaries.html)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)