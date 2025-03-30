import { z } from 'zod';

export const completionResponseSchema = z.object({
  message: z.string(),
  action: z.union([z.record(z.unknown()), z.null()]),
  reasoning: z.array(z.string()),
  intent: z.enum(['action', 'state', 'conversation', 'pipeline']),
  workflow: z
    .array(
      z.object({
        message: z.string(),
        intent: z.enum(['action', 'state', 'conversation']),
        action: z.union([z.record(z.unknown()), z.null()]),
        reasoning: z.array(z.string()),
      })
    )
    .optional(),
});

export type CompletionResponse = z.infer<typeof completionResponseSchema>;
