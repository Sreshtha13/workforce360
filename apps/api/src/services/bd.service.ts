import type { LeadStatus, BidStatus, ProposalStatus } from "@prisma/client";
import { BdRepository } from "../repositories/bd.repository";
import { writeAuditLog } from "../lib/audit";
import { prisma } from "../lib/prisma";

export class BdService {
  private repo = new BdRepository();

  listContacts(filters?: { search?: string }) {
    return this.repo.listContacts(filters);
  }

  getContact(id: string) {
    return this.repo.findContactById(id);
  }

  async createContact(input: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    company?: string;
    designation?: string;
    linkedInUrl?: string;
    notes?: string;
  }) {
    return this.repo.createContact(input);
  }

  async updateContact(
    id: string,
    input: Partial<{
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      company: string | null;
      designation: string | null;
      linkedInUrl: string | null;
      notes: string | null;
    }>,
  ) {
    return this.repo.updateContact(id, input);
  }

  listLeads(filters?: { status?: LeadStatus; assignedToId?: string; search?: string }) {
    return this.repo.listLeads(filters);
  }

  getLead(id: string) {
    return this.repo.findLeadById(id);
  }

  async createLead(input: {
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
  }) {
    const data: any = {
      title: input.title,
      description: input.description,
      status: input.status ?? "NEW",
      value: input.value,
      currency: input.currency ?? "USD",
      source: input.source,
      companyName: input.companyName,
      expectedCloseDate: input.expectedCloseDate ? new Date(input.expectedCloseDate) : undefined,
    };

    if (input.contactId) {
      data.contact = { connect: { id: input.contactId } };
    }
    if (input.assignedToId) {
      data.assignedTo = { connect: { id: input.assignedToId } };
    }

    return this.repo.createLead(data);
  }

  async updateLead(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      status: LeadStatus;
      value: number | null;
      currency: string;
      source: string | null;
      contactId: string | null;
      companyName: string | null;
      assignedToId: string | null;
      expectedCloseDate: string | null;
      lostReason: string | null;
    }>,
    actorId: string,
  ) {
    const lead = await this.repo.findLeadById(id);
    if (!lead) throw new Error("Lead not found");

    const data: any = { ...input };
    if (input.expectedCloseDate) {
      data.expectedCloseDate = new Date(input.expectedCloseDate);
    }

    if (input.status === "WON" && lead.status !== "WON") {
      data.wonAt = new Date();
      await this.handleWonLead(id, actorId);
    }

    if (input.status === "LOST" && lead.status !== "LOST") {
      data.lostAt = new Date();
    }

    const updated = await this.repo.updateLead(id, data);

    await writeAuditLog({
      userId: actorId,
      action: "update_lead",
      entity: "lead",
      entityId: id,
      before: { status: lead.status },
      after: { status: input.status },
    });

    return updated;
  }

  private async handleWonLead(leadId: string, actorId: string) {
    const lead = await this.repo.findLeadById(leadId);
    if (!lead) throw new Error("Lead not found");

    const existingProject = await prisma.project.findFirst({
      where: { leadId, deletedAt: null },
    });

    if (existingProject) {
      return;
    }

    const projectCode = `PRJ-${Date.now()}`;

    await prisma.project.create({
      data: {
        leadId,
        name: lead.title,
        code: projectCode,
        description: lead.description ?? `Project created from lead: ${lead.title}`,
        status: "PLANNING",
        budget: lead.value ?? undefined,
        currency: lead.currency,
        managerId: lead.assignedToId ?? undefined,
        clientName: lead.companyName ?? undefined,
        clientContactId: lead.contactId ?? undefined,
      },
    });

    await writeAuditLog({
      userId: actorId,
      action: "create_project_from_lead",
      entity: "project",
      entityId: leadId,
      after: { leadId, projectCode },
    });
  }

  listBids(filters?: { leadId?: string; status?: BidStatus }) {
    return this.repo.listBids(filters);
  }

  getBid(id: string) {
    return this.repo.findBidById(id);
  }

  async createBid(input: {
    leadId: string;
    title: string;
    description?: string;
    amount?: number;
    currency?: string;
    status?: BidStatus;
    submittedAt?: string;
    deadline?: string;
    notes?: string;
  }) {
    const data: any = {
      title: input.title,
      description: input.description,
      amount: input.amount,
      currency: input.currency ?? "USD",
      status: input.status ?? "DRAFT",
      submittedAt: input.submittedAt ? new Date(input.submittedAt) : undefined,
      deadline: input.deadline ? new Date(input.deadline) : undefined,
      notes: input.notes,
      lead: { connect: { id: input.leadId } },
    };

    return this.repo.createBid(data);
  }

  async updateBid(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      amount: number | null;
      currency: string;
      status: BidStatus;
      submittedAt: string | null;
      deadline: string | null;
      notes: string | null;
    }>,
  ) {
    const data: any = { ...input };
    if (input.submittedAt) data.submittedAt = new Date(input.submittedAt);
    if (input.deadline) data.deadline = new Date(input.deadline);
    return this.repo.updateBid(id, data);
  }

  listProposals(filters?: { leadId?: string; bidId?: string; status?: ProposalStatus }) {
    return this.repo.listProposals(filters);
  }

  getProposal(id: string) {
    return this.repo.findProposalById(id);
  }

  async createProposal(input: {
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
  }) {
    const data: any = {
      title: input.title,
      description: input.description,
      content: input.content,
      amount: input.amount,
      currency: input.currency ?? "USD",
      status: input.status ?? "DRAFT",
      sentAt: input.sentAt ? new Date(input.sentAt) : undefined,
      validUntil: input.validUntil ? new Date(input.validUntil) : undefined,
      notes: input.notes,
      lead: { connect: { id: input.leadId } },
    };

    if (input.bidId) {
      data.bid = { connect: { id: input.bidId } };
    }

    return this.repo.createProposal(data);
  }

  async updateProposal(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      content: string | null;
      amount: number | null;
      currency: string;
      status: ProposalStatus;
      sentAt: string | null;
      validUntil: string | null;
      acceptedAt: string | null;
      rejectedAt: string | null;
      notes: string | null;
    }>,
  ) {
    const data: any = { ...input };
    if (input.sentAt) data.sentAt = new Date(input.sentAt);
    if (input.validUntil) data.validUntil = new Date(input.validUntil);
    if (input.acceptedAt) data.acceptedAt = new Date(input.acceptedAt);
    if (input.rejectedAt) data.rejectedAt = new Date(input.rejectedAt);
    return this.repo.updateProposal(id, data);
  }

  listCommunications(filters?: { leadId?: string; contactId?: string }) {
    return this.repo.listCommunications(filters);
  }

  async createCommunication(input: {
    leadId?: string;
    contactId?: string;
    subject: string;
    body: string;
    channel?: string;
    direction?: string;
    timestamp?: string;
  }) {
    const data: any = {
      subject: input.subject,
      body: input.body,
      channel: input.channel ?? "email",
      direction: input.direction ?? "outbound",
      timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
    };

    if (input.leadId) {
      data.lead = { connect: { id: input.leadId } };
    }
    if (input.contactId) {
      data.contact = { connect: { id: input.contactId } };
    }

    return this.repo.createCommunication(data);
  }

  listPortfolio(filters?: { isPublished?: boolean; category?: string }) {
    return this.repo.listPortfolio(filters);
  }

  getPortfolioItem(id: string) {
    return this.repo.findPortfolioItemById(id);
  }

  async createPortfolioItem(input: {
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
  }) {
    const data: any = {
      ...input,
      completedAt: input.completedAt ? new Date(input.completedAt) : undefined,
      isPublished: input.isPublished ?? false,
      sortOrder: input.sortOrder ?? 0,
    };

    return this.repo.createPortfolioItem(data);
  }

  async updatePortfolioItem(
    id: string,
    input: Partial<{
      title: string;
      description: string | null;
      category: string | null;
      clientName: string | null;
      completedAt: string | null;
      technologies: string | null;
      imageUrl: string | null;
      projectUrl: string | null;
      isPublished: boolean;
      sortOrder: number;
    }>,
  ) {
    const data: any = { ...input };
    if (input.completedAt) data.completedAt = new Date(input.completedAt);
    return this.repo.updatePortfolioItem(id, data);
  }

  getPipelineSummary() {
    return this.repo.getPipelineSummary();
  }
}

export const bdService = new BdService();
