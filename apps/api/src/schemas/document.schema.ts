import { z } from "zod";

export const documentContextSchema = z.enum(["EMPLOYEE", "CANDIDATE", "PROJECT", "GENERAL"]);
export const documentAccessLevelSchema = z.enum(["VIEW", "EDIT", "DELETE", "MANAGE"]);

export const createDocumentCategorySchema = z.object({
  name: z.string().min(1).max(200),
  code: z.string().min(1).max(100),
  description: z.string().max(2000).optional(),
  context: documentContextSchema.optional(),
});

export const updateDocumentCategorySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  context: documentContextSchema.nullable().optional(),
});

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  categoryId: z.string().optional(),
  context: documentContextSchema.optional(),
  contextEntityId: z.string().optional(),
  fileId: z.string().min(1),
  changeNotes: z.string().max(1000).optional(),
});

export const addDocumentVersionSchema = z.object({
  fileId: z.string().min(1),
  changeNotes: z.string().max(1000).optional(),
});

export const setDocumentPermissionsSchema = z.object({
  permissions: z
    .array(
      z.object({
        userId: z.string().nullable().optional(),
        roleCode: z.string().nullable().optional(),
        accessLevel: documentAccessLevelSchema,
      }),
    )
    .max(100),
});

export const listDocumentsQuerySchema = z.object({
  search: z.string().optional(),
  context: documentContextSchema.optional(),
  contextEntityId: z.string().optional(),
  categoryId: z.string().optional(),
  createdById: z.string().optional(),
});
