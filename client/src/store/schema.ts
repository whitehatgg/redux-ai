import { s } from 'ajv-ts';

// Define a local type alias for schema builder
type ObjectSchema<T = any> = ReturnType<typeof s.object>;

// ----------------
// Base Types
// ----------------

export type BaseAction<T extends string = string, P = any> = {
  type: T;
  payload?: P;
};

// ----------------
// State Schemas
// ----------------

export type ApplicantSchema = ObjectSchema<{
  id: string;
  name: string;
  email: string;
  position: string;
  status: string;
  appliedDate: string;
}>;

export const applicantSchema: ApplicantSchema = s.object({
  id: s.string(),
  name: s.string(),
  email: s.string(),
  position: s.string(),
  status: s.string(),
  appliedDate: s.string(),
});

export type TableConfigSchema = ObjectSchema<{
  visibleColumns: string[];
  enableSearch: boolean;
  searchTerm: string;
  sortBy: string | null;
  sortOrder: 'asc' | 'desc' | null;
}>;

export const tableConfigSchema: TableConfigSchema = s.object({
  visibleColumns: s.array(s.string()),
  enableSearch: s.boolean(),
  searchTerm: s.string(),
  sortBy: s.union([s.string(), s.null()]),
  sortOrder: s.union([s.enum(['asc', 'desc']), s.null()])
});

// Combined state schema
export type StateSchema = ObjectSchema<{
  applicant: {
    applicants: any[];
    tableConfig: any;
  };
}>;

export const stateSchema: StateSchema = s.object({
  applicant: s.object({
    applicants: s.array(applicantSchema),
    tableConfig: tableConfigSchema,
  })
});

// ----------------
// Action Schemas
// ----------------

export type ActionSchemas = {
  setSearchTerm: ObjectSchema<BaseAction<'applicant/setSearchTerm', string>>;
  toggleSearch: ObjectSchema<BaseAction<'applicant/toggleSearch'>>;
  setVisibleColumns: ObjectSchema<BaseAction<'applicant/setVisibleColumns', string[]>>;
  setSortOrder: ObjectSchema<BaseAction<'applicant/setSortOrder', { column: string; direction: 'asc' | 'desc' }>>;
};

export const setSearchTermSchema: ActionSchemas['setSearchTerm'] = s.object({
  type: s.const('applicant/setSearchTerm'),
  payload: s.string()
});

export const toggleSearchSchema: ActionSchemas['toggleSearch'] = s.object({
  type: s.const('applicant/toggleSearch')
});

export const setVisibleColumnsSchema: ActionSchemas['setVisibleColumns'] = s.object({
  type: s.const('applicant/setVisibleColumns'),
  payload: s.array(s.string())
});

export const setSortOrderSchema: ActionSchemas['setSortOrder'] = s.object({
  type: s.const('applicant/setSortOrder'),
  payload: s.object({
    column: s.string(),
    direction: s.enum(['asc', 'desc'])
  })
});

// Export store schema with proper type annotations
export type StoreSchema = ObjectSchema<{
  state: any;
  actions: Record<string, BaseAction>;
}>;

export const storeSchema: StoreSchema = s.object({
  state: stateSchema,
  actions: s.record(s.union([
    setSearchTermSchema,
    toggleSearchSchema,
    setVisibleColumnsSchema,
    setSortOrderSchema
  ]))
});

// Inferred types from schemas
export type Applicant = s.infer<typeof applicantSchema>;
export type TableConfig = s.infer<typeof tableConfigSchema>;
export type ApplicantState = s.infer<typeof stateSchema>['applicant'];

// Action types
export type SetSearchTermAction = s.infer<typeof setSearchTermSchema>;
export type ToggleSearchAction = s.infer<typeof toggleSearchSchema>;
export type SetVisibleColumnsAction = s.infer<typeof setVisibleColumnsSchema>;
export type SetSortOrderAction = s.infer<typeof setSortOrderSchema>;

export type Action = 
  | SetSearchTermAction 
  | ToggleSearchAction 
  | SetVisibleColumnsAction 
  | SetSortOrderAction;