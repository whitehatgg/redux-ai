import type React from 'react';
import { type ReactElement } from 'react';
import { configureStore } from '@reduxjs/toolkit';
import { render, renderHook, type RenderOptions, type RenderResult } from '@testing-library/react';
import { vi } from 'vitest';

// Create and export mock hooks
export const mockUseReduxAI = vi.fn().mockReturnValue({
  sendQuery: vi.fn(),
  isProcessing: false,
  error: null,
});

// Mock store
const mockStore = configureStore({
  reducer: {
    test: (state = {}, _action) => state,
  },
});

// Mock essential DOM APIs
if (typeof window !== 'undefined') {
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
}

// Wrap components with necessary providers
interface WrapperProps {
  children: React.ReactNode;
}

function Wrapper({ children }: WrapperProps) {
  return children;
}

// Add explicit return type annotation to avoid inference issues
type CustomRenderResult = RenderResult & { mockStore: typeof mockStore };

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
): CustomRenderResult => {
  return {
    ...render(ui, { wrapper: Wrapper, ...options }),
    mockStore,
  };
};

const customRenderHook = <Result, Props>(
  hook: (props: Props) => Result,
  options?: Omit<RenderOptions, 'wrapper'>
) => {
  return renderHook(hook, {
    wrapper: Wrapper,
    ...options,
  });
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, customRenderHook as renderHook, mockStore };
