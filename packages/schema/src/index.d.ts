export type ValidationResult<T> = {
  valid: boolean;
  value: T | null;
  errors?: {
    path: string;
    message: string;
  }[];
};
export interface BaseAction {
  type: string;
  payload?: unknown;
}
export declare function validateSchema<T>(
  data: unknown,
  schema: Record<string, any>
): ValidationResult<T>;
//# sourceMappingURL=index.d.ts.map
