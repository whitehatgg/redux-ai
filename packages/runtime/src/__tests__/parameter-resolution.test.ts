import { describe, expect, it } from 'vitest';

import { generatePrompt } from '../prompts';
import type { QueryParams } from '../types';

describe('Action Parameter Resolution Prompt', () => {
  it('includes parameter resolution instructions in the action prompt', () => {
    const mockActions = {
      'applicant/selectApplicant': {
        params: [{ name: 'id', type: 'string', required: true }],
      },
      'applicant/approveApplicant': {
        params: [{ name: 'id', type: 'string', required: true }],
      },
    };

    const mockState = {
      applicant: {
        applicants: [
          { id: 'abc123', name: 'John Doe', email: 'john@example.com' },
          { id: 'def456', name: 'Jane Smith', email: 'jane@example.com' },
        ],
        selectedApplicantId: null,
      },
    };

    const params: QueryParams = {
      query: 'select the first applicant',
      actions: mockActions,
      state: mockState,
    };

    const prompt = generatePrompt('action', params);

    // Check that the prompt includes parameter resolution instructions
    expect(prompt).toContain('PARAMETER RESOLUTION EXAMPLES');
    expect(prompt).toContain('For "select first applicant"');
    expect(prompt).toContain('CURRENT STATE');

    // Check that it includes instructions for resolving by descriptive attributes
    expect(prompt).toContain('identify objects by descriptive attributes');
    expect(prompt).toContain('use position-based references');

    // Make sure state is included
    expect(prompt).toContain(JSON.stringify(mockState, null, 2));
  });

  it('includes parameter resolution instructions in the workflow prompt', () => {
    const mockActions = {
      'applicant/selectApplicant': {
        params: [{ name: 'id', type: 'string', required: true }],
      },
      'applicant/approveApplicant': {
        params: [{ name: 'id', type: 'string', required: true }],
      },
    };

    const mockState = {
      applicant: {
        applicants: [
          { id: 'abc123', name: 'John Doe', email: 'john@example.com' },
          { id: 'def456', name: 'Jane Smith', email: 'jane@example.com' },
        ],
        selectedApplicantId: null,
      },
    };

    const params: QueryParams = {
      query: 'select John and then approve him',
      actions: mockActions,
      state: mockState,
    };

    const prompt = generatePrompt('workflow', params);

    // Check that the prompt includes parameter resolution instructions
    expect(prompt).toContain('PARAMETER RESOLUTION GUIDELINES');
    expect(prompt).toContain('When user refers to entities by name');
    expect(prompt).toContain('For position-based references');

    // Check specific examples
    expect(prompt).toContain('RESOLUTION EXAMPLES');
    expect(prompt).toContain('select John and then approve him');

    // Make sure validation emphasizes ID resolution
    expect(prompt).toContain('All required parameters must be provided with correct IDs');
    expect(prompt).toContain('Always prefer actual IDs over descriptive references');
  });
});
