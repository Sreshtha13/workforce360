import { z } from "zod";

export const createContactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  designation: z.string().optional(),
  linkedInUrl: z.string().url().optional(),
  notes: z.string().optional(),
});

export const updateContactSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().nullable().optional(),
  phone: z.string().nullable().optional(),
  company: z.string().nullable().optional(),
  designation: z.string().nullable().optional(),
  linkedInUrl: z.string().url().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listContactsQuerySchema = z.object({
  search: z.string().optional(),
});

export const createLeadSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"]).optional(),
  value: z.number().positive().optional(),
  currency: z.string().optional(),
  source: z.string().optional(),
  contactId: z.string().optional(),
  companyName: z.string().optional(),
  assignedToId: z.string().optional(),
  expectedCloseDate: z.string().datetime().optional(),
});

export const updateLeadSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"]).optional(),
  value: z.number().positive().nullable().optional(),
  currency: z.string().optional(),
  source: z.string().nullable().optional(),
  contactId: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  expectedCloseDate: z.string().datetime().nullable().optional(),
  lostReason: z.string().nullable().optional(),
});

export const listLeadsQuerySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "QUALIFIED", "PROPOSAL_SENT", "NEGOTIATION", "WON", "LOST"]).optional(),
  assignedToId: z.string().optional(),
  search: z.string().optional(),
});

export const createBidSchema = z.object({
  leadId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"]).optional(),
  submittedAt: z.string().datetime().optional(),
  deadline: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateBidSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  amount: z.number().positive().nullable().optional(),
  currency: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"]).optional(),
  submittedAt: z.string().datetime().nullable().optional(),
  deadline: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listBidsQuerySchema = z.object({
  leadId: z.string().optional(),
  status: z.enum(["DRAFT", "SUBMITTED", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "WITHDRAWN"]).optional(),
});

export const createProposalSchema = z.object({
  leadId: z.string(),
  bidId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  content: z.string().optional(),
  amount: z.number().positive().optional(),
  currency: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "REVISED"]).optional(),
  sentAt: z.string().datetime().optional(),
  validUntil: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export const updateProposalSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  content: z.string().nullable().optional(),
  amount: z.number().positive().nullable().optional(),
  currency: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "REVISED"]).optional(),
  sentAt: z.string().datetime().nullable().optional(),
  validUntil: z.string().datetime().nullable().optional(),
  acceptedAt: z.string().datetime().nullable().optional(),
  rejectedAt: z.string().datetime().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listProposalsQuerySchema = z.object({
  leadId: z.string().optional(),
  bidId: z.string().optional(),
  status: z.enum(["DRAFT", "SENT", "UNDER_REVIEW", "ACCEPTED", "REJECTED", "REVISED"]).optional(),
});

export const createCommunicationSchema = z.object({
  leadId: z.string().optional(),
  contactId: z.string().optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
  channel: z.string().optional(),
  direction: z.enum(["inbound", "outbound"]).optional(),
  timestamp: z.string().datetime().optional(),
});

export const listCommunicationsQuerySchema = z.object({
  leadId: z.string().optional(),
  contactId: z.string().optional(),
});

export const createPortfolioItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  clientName: z.string().optional(),
  completedAt: z.string().datetime().optional(),
  technologies: z.string().optional(),
  imageUrl: z.string().url().optional(),
  projectUrl: z.string().url().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updatePortfolioItemSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  clientName: z.string().nullable().optional(),
  completedAt: z.string().datetime().nullable().optional(),
  technologies: z.string().nullable().optional(),
  imageUrl: z.string().url().nullable().optional(),
  projectUrl: z.string().url().nullable().optional(),
  isPublished: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const listPortfolioQuerySchema = z.object({
  isPublished: z.string().transform((val) => val === "true").optional(),
  category: z.string().optional(),
});
