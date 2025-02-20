```typescript
import { vi } from 'vitest';

// Node-specific mocks
global.fetch = vi.fn();

// Add any other Node-specific test setup here
```
