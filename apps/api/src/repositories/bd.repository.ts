import type { Prisma, LeadStatus, BidStatus, ProposalStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";

export class BdRepository {
  listContacts(filters?: { search?: string }) {
    const where: Prisma.ContactWhereInput = { deletedAt: null };
    if (filters?.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { lastName: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { company: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return prisma.contact.findMany({
      where,
      include: {
        _count: { select: { leads: true, communications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findContactById(id: string) {
    return prisma.contact.findFirst({
      where: { id, deletedAt: null },
      include: {
        leads: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        communications: {
          where: { deletedAt: null },
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });
  }

  createContact(data: Prisma.ContactCreateInput) {
    return prisma.contact.create({ data });
  }

  updateContact(id: string, data: Prisma.ContactUpdateInput) {
    return prisma.contact.update({ where: { id }, data });
  }

  listLeads(filters?: { status?: LeadStatus; assignedToId?: string; search?: string }) {
    const where: Prisma.LeadWhereInput = { deletedAt: null };
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedToId) where.assignedToId = filters.assignedToId;
    if (filters?.search) {
      where.OR = [
        { title: { contains: filters.search, mode: "insensitive" } },
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { description: { contains: filters.search, mode: "insensitive" } },
      ];
    }
    return prisma.lead.findMany({
      where,
      include: {
        contact: { select: { id: true, firstName: true, lastName: true, email: true, company: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        _count: { select: { bids: true, proposals: true, communications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findLeadById(id: string) {
    return prisma.lead.findFirst({
      where: { id, deletedAt: null },
      include: {
        contact: true,
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        bids: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        proposals: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
        communications: {
          where: { deletedAt: null },
          orderBy: { timestamp: "desc" },
        },
        project: true,
      },
    });
  }

  createLead(data: Prisma.LeadCreateInput) {
    return prisma.lead.create({
      data,
      include: {
        contact: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  updateLead(id: string, data: Prisma.LeadUpdateInput) {
    return prisma.lead.update({
      where: { id },
      data,
      include: {
        contact: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  listBids(filters?: { leadId?: string; status?: BidStatus }) {
    const where: Prisma.BidWhereInput = { deletedAt: null };
    if (filters?.leadId) where.leadId = filters.leadId;
    if (filters?.status) where.status = filters.status;
    return prisma.bid.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            title: true,
            companyName: true,
            contact: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findBidById(id: string) {
    return prisma.bid.findFirst({
      where: { id, deletedAt: null },
      include: {
        lead: {
          include: {
            contact: true,
            assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        proposals: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  createBid(data: Prisma.BidCreateInput) {
    return prisma.bid.create({
      data,
      include: { lead: true },
    });
  }

  updateBid(id: string, data: Prisma.BidUpdateInput) {
    return prisma.bid.update({
      where: { id },
      data,
      include: { lead: true },
    });
  }

  listProposals(filters?: { leadId?: string; bidId?: string; status?: ProposalStatus }) {
    const where: Prisma.ProposalWhereInput = { deletedAt: null };
    if (filters?.leadId) where.leadId = filters.leadId;
    if (filters?.bidId) where.bidId = filters.bidId;
    if (filters?.status) where.status = filters.status;
    return prisma.proposal.findMany({
      where,
      include: {
        lead: {
          select: {
            id: true,
            title: true,
            companyName: true,
            contact: { select: { firstName: true, lastName: true, email: true } },
          },
        },
        bid: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  findProposalById(id: string) {
    return prisma.proposal.findFirst({
      where: { id, deletedAt: null },
      include: {
        lead: {
          include: {
            contact: true,
            assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
          },
        },
        bid: true,
      },
    });
  }

  createProposal(data: Prisma.ProposalCreateInput) {
    return prisma.proposal.create({
      data,
      include: { lead: true, bid: true },
    });
  }

  updateProposal(id: string, data: Prisma.ProposalUpdateInput) {
    return prisma.proposal.update({
      where: { id },
      data,
      include: { lead: true, bid: true },
    });
  }

  listCommunications(filters?: { leadId?: string; contactId?: string }) {
    const where: Prisma.ClientCommunicationWhereInput = { deletedAt: null };
    if (filters?.leadId) where.leadId = filters.leadId;
    if (filters?.contactId) where.contactId = filters.contactId;
    return prisma.clientCommunication.findMany({
      where,
      include: {
        lead: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { timestamp: "desc" },
    });
  }

  createCommunication(data: Prisma.ClientCommunicationCreateInput) {
    return prisma.clientCommunication.create({
      data,
      include: { lead: true, contact: true },
    });
  }

  listPortfolio(filters?: { isPublished?: boolean; category?: string }) {
    const where: Prisma.PortfolioItemWhereInput = { deletedAt: null };
    if (filters?.isPublished !== undefined) where.isPublished = filters.isPublished;
    if (filters?.category) where.category = filters.category;
    return prisma.portfolioItem.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
  }

  findPortfolioItemById(id: string) {
    return prisma.portfolioItem.findFirst({
      where: { id, deletedAt: null },
    });
  }

  createPortfolioItem(data: Prisma.PortfolioItemCreateInput) {
    return prisma.portfolioItem.create({ data });
  }

  updatePortfolioItem(id: string, data: Prisma.PortfolioItemUpdateInput) {
    return prisma.portfolioItem.update({ where: { id }, data });
  }

  getPipelineSummary() {
    return prisma.lead.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
      _sum: { value: true },
    });
  }
}
