import { Type } from '@sinclair/typebox';

// Define the base schemas
export const applicantSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  email: Type.String(),
  status: Type.String(),
  position: Type.String(),
  appliedDate: Type.String(),
});

export const tableConfigSchema = Type.Object({
  visibleColumns: Type.Array(Type.String()),
  enableSearch: Type.Boolean(),
  searchTerm: Type.String(),
  sortBy: Type.Union([Type.String(), Type.Null()]),
  sortOrder: Type.Union([Type.Union([Type.Literal('asc'), Type.Literal('desc')]), Type.Null()]),
});

// Define the complete state schema
export const applicantStateSchema = Type.Object({
  applicants: Type.Array(applicantSchema),
  tableConfig: tableConfigSchema,
});

// Individual action schemas for each possible action type
export const setSearchTermAction = Type.Object(
  {
    type: Type.Literal('applicant/setSearchTerm'),
    payload: Type.String(),
  },
  {
    description: 'Set a search term to filter applicants by name, email, or position',
    keywords: ['search', 'filter', 'find', 'query', 'lookup', 'name', 'applicant', 'text', 'term'],
  }
);

export const toggleSearchAction = Type.Object(
  {
    type: Type.Literal('applicant/toggleSearch'),
  },
  {
    description: 'Enable or disable the search functionality in the applicant table',
    keywords: ['toggle', 'enable', 'disable', 'switch', 'search', 'on', 'off'],
  }
);

export const setVisibleColumnsAction = Type.Object(
  {
    type: Type.Literal('applicant/setVisibleColumns'),
    payload: Type.Array(Type.String()),
  },
  {
    description: 'Choose which columns to display in the applicant table view',
    keywords: ['columns', 'visible', 'show', 'hide', 'display', 'table', 'fields'],
  }
);

export const setSortOrderAction = Type.Object(
  {
    type: Type.Literal('applicant/setSortOrder'),
    payload: Type.Object({
      column: Type.String(),
      direction: Type.Union([Type.Literal('asc'), Type.Literal('desc')]),
    }),
  },
  {
    description: 'Set the sorting order for a specific column in the applicant table',
    keywords: ['sort', 'order', 'ascending', 'descending', 'column', 'direction'],
  }
);

// Export the actionSchema for use with ReduxAIProvider
export const actionSchema = Type.Object({
  applicant: Type.Object({
    setSearchTerm: setSearchTermAction,
    toggleSearch: toggleSearchAction,
    setVisibleColumns: setVisibleColumnsAction,
    setSortOrder: setSortOrderAction,
  }),
});

// Export inferred types
export type Applicant = typeof applicantSchema._type;
export type TableConfig = typeof tableConfigSchema._type;
export type ApplicantState = typeof applicantStateSchema._type;
export type Action = typeof actionSchema._type;
