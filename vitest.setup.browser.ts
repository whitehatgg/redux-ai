import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock window.fetch
window.fetch = vi.fn();

// React 18 specific setup
globalThis.IS_REACT_ACT_ENVIRONMENT = true;