import { s } from 'ajv-ts';

// Define schema type
type ObjectSchema = ReturnType<typeof s.object>;

// Define the schemas that map to the TypeScript interfaces
const applicantSchema: ObjectSchema = s.object({
  id: s.string(),
  name: s.string(),
  email: s.string(),
  status: s.enum(['pending', 'approved', 'rejected']),
  position: s.string(),
  appliedDate: s.string()
});

const tableConfigSchema: ObjectSchema = s.object({
  visibleColumns: s.array(s.enum(['name', 'email', 'status', 'position', 'appliedDate'])),
  enableSearch: s.boolean(),
  searchTerm: s.string()
});

const applicantSliceSchema: ObjectSchema = s.object({
  applicants: s.array(applicantSchema),
  tableConfig: tableConfigSchema
});

// Export the store schema for validation
export const storeSchema: ObjectSchema = s.object({
  applicant: applicantSliceSchema
});

// Export types for type checking
export type Applicant = s.infer<typeof applicantSchema>;
export type TableConfig = s.infer<typeof tableConfigSchema>;
export type ApplicantState = s.infer<typeof applicantSliceSchema>;
export type StoreSchema = s.infer<typeof storeSchema>;