import { z } from "zod";

export const upsertSettingsSchema = z.object({
  settings: z
    .array(
      z.object({
        key: z.string().min(1),
        value: z.string(),
        category: z.string().optional(),
        description: z.string().optional(),
        isSecret: z.boolean().optional(),
      }),
    )
    .min(1),
});

export const createTemplateSchema = z.object({
  code: z.string().min(1).max(100),
  name: z.string().min(1).max(255),
  channel: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(1),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateTemplateSchema = createTemplateSchema
  .omit({ code: true })
  .partial();

export type UpsertSettingsInput = z.infer<typeof upsertSettingsSchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
