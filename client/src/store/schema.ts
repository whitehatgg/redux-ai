import { s } from 'ajv-ts';

// Individual action schemas for each possible action type
export const setSearchTermSchema = s.object({
  type: s.const('applicant/setSearchTerm'),
  payload: s.string()
}).meta({
  description: "Update the search term used to filter applicants",
  keywords: ["search", "filter", "find", "query", "lookup"]
});

export const toggleSearchSchema = s.object({
  type: s.const('applicant/toggleSearch')
}).meta({
  description: "Enable or disable the search functionality",
  keywords: ["toggle", "enable", "disable", "switch", "search"]
});

export const setVisibleColumnsSchema = s.object({
  type: s.const('applicant/setVisibleColumns'),
  payload: s.array(s.string())
}).meta({
  description: "Set which columns are visible in the applicant table",
  keywords: ["columns", "visible", "show", "hide", "display", "table"]
});

export const setSortOrderSchema = s.object({
  type: s.const('applicant/setSortOrder'),
  payload: s.object({
    column: s.string(),
    direction: s.enum(['asc', 'desc'])
  })
}).meta({
  description: "Set the sorting order for a specific column",
  keywords: ["sort", "order", "ascending", "descending", "column"]
});

// Combined action schemas for validation
export const actionSchemas = s.union([
  setSearchTermSchema,
  toggleSearchSchema,
  setVisibleColumnsSchema,
  setSortOrderSchema
]);

// Store schema with actions
export const storeSchema = s.object({
  state: s.object({
    applicant: s.object({
      applicants: s.array(s.object({
        id: s.string(),
        name: s.string(),
        email: s.string(),
        position: s.string(),
        status: s.string(),
        appliedDate: s.string()
      })),
      tableConfig: s.object({
        visibleColumns: s.array(s.string()),
        enableSearch: s.boolean(),
        searchTerm: s.string(),
        sortBy: s.union([s.string(), s.null()]),
        sortOrder: s.union([s.enum(['asc', 'desc']), s.null()])
      })
    })
  }),
  actions: actionSchemas
});

// Export inferred types for use in slices
export type Action = s.infer<typeof actionSchemas>;
export type State = s.infer<typeof storeSchema>;