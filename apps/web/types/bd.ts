// Business Development Module Types

export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "PROPOSAL_SENT"
  | "NEGOTIATION"
  | "WON"
  | "LOST";

export type BidStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

export type ProposalStatus =
  | "DRAFT"
  | "SENT"
  | "UNDER_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "REVISED";

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  designation?: string;
  linkedInUrl?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  _count?: {
    leads: number;
    communications: number;
  };
}

export interface Lead {
  id: string;
  title: string;
  description?: string;
  status: LeadStatus;
  value?: string;
  currency: string;
  source?: string;
  contactId?: string;
  companyName?: string;
  assignedToId?: string;
  expectedCloseDate?: string;
  wonAt?: string;
  lostAt?: string;
  lostReason?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    company?: string;
  };
  assignedTo?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar?: string;
  };
  _count?: {
    bids: number;
    proposals: number;
    communications: number;
  };
  communications?: ClientCommunication[];
  project?: {
    id: string;
    name: string;
    code?: string;
  };
}

export interface Bid {
  id: string;
  leadId: string;
  title: string;
  description?: string;
  amount?: string;
  currency: string;
  status: BidStatus;
  submittedAt?: string;
  deadline?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  lead?: {
    id: string;
    title: string;
    companyName?: string;
    contact?: {
      firstName: string;
      lastName: string;
      email?: string;
    };
  };
  _count?: {
    proposals: number;
  };
}

export interface Proposal {
  id: string;
  leadId: string;
  bidId?: string;
  title: string;
  description?: string;
  content?: string;
  amount?: string;
  currency: string;
  status: ProposalStatus;
  sentAt?: string;
  validUntil?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  lead?: {
    id: string;
    title: string;
    companyName?: string;
    contact?: {
      firstName: string;
      lastName: string;
      email?: string;
    };
  };
  bid?: {
    id: string;
    title: string;
  };
}

export interface ClientCommunication {
  id: string;
  leadId?: string;
  contactId?: string;
  subject: string;
  body: string;
  channel: string;
  direction: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  lead?: {
    id: string;
    title: string;
  };
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  };
}

export interface PortfolioItem {
  id: string;
  title: string;
  description?: string;
  category?: string;
  clientName?: string;
  completedAt?: string;
  technologies?: string;
  imageUrl?: string;
  projectUrl?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface PipelineSummary {
  status: LeadStatus;
  _count: {
    _all: number;
  };
  _sum: {
    value: string | null;
  };
}

// Input Types
export interface CreateContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  designation?: string;
  linkedInUrl?: string;
  notes?: string;
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  designation?: string | null;
  linkedInUrl?: string | null;
  notes?: string | null;
}

export interface CreateLeadInput {
  title: string;
  description?: string;
  status?: LeadStatus;
  value?: number;
  currency?: string;
  source?: string;
  contactId?: string;
  companyName?: string;
  assignedToId?: string;
  expectedCloseDate?: string;
}

export interface UpdateLeadInput {
  title?: string;
  description?: string | null;
  status?: LeadStatus;
  value?: number | null;
  currency?: string;
  source?: string | null;
  contactId?: string | null;
  companyName?: string | null;
  assignedToId?: string | null;
  expectedCloseDate?: string | null;
  lostReason?: string | null;
}

export interface CreateBidInput {
  leadId: string;
  title: string;
  description?: string;
  amount?: number;
  currency?: string;
  status?: BidStatus;
  submittedAt?: string;
  deadline?: string;
  notes?: string;
}

export interface UpdateBidInput {
  title?: string;
  description?: string | null;
  amount?: number | null;
  currency?: string;
  status?: BidStatus;
  submittedAt?: string | null;
  deadline?: string | null;
  notes?: string | null;
}

export interface CreateProposalInput {
  leadId: string;
  bidId?: string;
  title: string;
  description?: string;
  content?: string;
  amount?: number;
  currency?: string;
  status?: ProposalStatus;
  sentAt?: string;
  validUntil?: string;
  notes?: string;
}

export interface UpdateProposalInput {
  title?: string;
  description?: string | null;
  content?: string | null;
  amount?: number | null;
  currency?: string;
  status?: ProposalStatus;
  sentAt?: string | null;
  validUntil?: string | null;
  acceptedAt?: string | null;
  rejectedAt?: string | null;
  notes?: string | null;
}

export interface CreateCommunicationInput {
  leadId?: string;
  contactId?: string;
  subject: string;
  body: string;
  channel?: string;
  direction?: "inbound" | "outbound";
  timestamp?: string;
}

export interface CreatePortfolioItemInput {
  title: string;
  description?: string;
  category?: string;
  clientName?: string;
  completedAt?: string;
  technologies?: string;
  imageUrl?: string;
  projectUrl?: string;
  isPublished?: boolean;
  sortOrder?: number;
}

export interface UpdatePortfolioItemInput {
  title?: string;
  description?: string | null;
  category?: string | null;
  clientName?: string | null;
  completedAt?: string | null;
  technologies?: string | null;
  imageUrl?: string | null;
  projectUrl?: string | null;
  isPublished?: boolean;
  sortOrder?: number;
}
