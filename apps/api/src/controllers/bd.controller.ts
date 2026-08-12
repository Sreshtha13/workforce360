import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import { bdService } from "../services/bd.service";

export class BdController {
  listContacts = async (req: Request, res: Response): Promise<void> => {
    try {
      const contacts = await bdService.listContacts(req.query as { search?: string });
      sendSuccess(res, contacts);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_CONTACTS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list contacts",
      });
    }
  };

  getContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const contact = await bdService.getContact(req.params.id);
      if (!contact) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Contact not found" });
        return;
      }
      sendSuccess(res, contact);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_CONTACT_FAILED",
        message: error instanceof Error ? error.message : "Failed to get contact",
      });
    }
  };

  createContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const contact = await bdService.createContact(req.body);
      sendSuccess(res, contact, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_CONTACT_FAILED",
        message: error instanceof Error ? error.message : "Failed to create contact",
      });
    }
  };

  updateContact = async (req: Request, res: Response): Promise<void> => {
    try {
      const contact = await bdService.updateContact(req.params.id, req.body);
      sendSuccess(res, contact);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_CONTACT_FAILED",
        message: error instanceof Error ? error.message : "Failed to update contact",
      });
    }
  };

  listLeads = async (req: Request, res: Response): Promise<void> => {
    try {
      const leads = await bdService.listLeads(req.query as any);
      sendSuccess(res, leads);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_LEADS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list leads",
      });
    }
  };

  getLead = async (req: Request, res: Response): Promise<void> => {
    try {
      const lead = await bdService.getLead(req.params.id);
      if (!lead) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Lead not found" });
        return;
      }
      sendSuccess(res, lead);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_LEAD_FAILED",
        message: error instanceof Error ? error.message : "Failed to get lead",
      });
    }
  };

  createLead = async (req: Request, res: Response): Promise<void> => {
    try {
      const lead = await bdService.createLead(req.body);
      sendSuccess(res, lead, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_LEAD_FAILED",
        message: error instanceof Error ? error.message : "Failed to create lead",
      });
    }
  };

  updateLead = async (req: Request, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 401, { code: "UNAUTHORIZED", message: "User not authenticated" });
        return;
      }
      const lead = await bdService.updateLead(req.params.id, req.body, userId);
      sendSuccess(res, lead);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_LEAD_FAILED",
        message: error instanceof Error ? error.message : "Failed to update lead",
      });
    }
  };

  listBids = async (req: Request, res: Response): Promise<void> => {
    try {
      const bids = await bdService.listBids(req.query as any);
      sendSuccess(res, bids);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_BIDS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list bids",
      });
    }
  };

  getBid = async (req: Request, res: Response): Promise<void> => {
    try {
      const bid = await bdService.getBid(req.params.id);
      if (!bid) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Bid not found" });
        return;
      }
      sendSuccess(res, bid);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_BID_FAILED",
        message: error instanceof Error ? error.message : "Failed to get bid",
      });
    }
  };

  createBid = async (req: Request, res: Response): Promise<void> => {
    try {
      const bid = await bdService.createBid(req.body);
      sendSuccess(res, bid, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_BID_FAILED",
        message: error instanceof Error ? error.message : "Failed to create bid",
      });
    }
  };

  updateBid = async (req: Request, res: Response): Promise<void> => {
    try {
      const bid = await bdService.updateBid(req.params.id, req.body);
      sendSuccess(res, bid);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_BID_FAILED",
        message: error instanceof Error ? error.message : "Failed to update bid",
      });
    }
  };

  listProposals = async (req: Request, res: Response): Promise<void> => {
    try {
      const proposals = await bdService.listProposals(req.query as any);
      sendSuccess(res, proposals);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_PROPOSALS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list proposals",
      });
    }
  };

  getProposal = async (req: Request, res: Response): Promise<void> => {
    try {
      const proposal = await bdService.getProposal(req.params.id);
      if (!proposal) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Proposal not found" });
        return;
      }
      sendSuccess(res, proposal);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_PROPOSAL_FAILED",
        message: error instanceof Error ? error.message : "Failed to get proposal",
      });
    }
  };

  createProposal = async (req: Request, res: Response): Promise<void> => {
    try {
      const proposal = await bdService.createProposal(req.body);
      sendSuccess(res, proposal, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_PROPOSAL_FAILED",
        message: error instanceof Error ? error.message : "Failed to create proposal",
      });
    }
  };

  updateProposal = async (req: Request, res: Response): Promise<void> => {
    try {
      const proposal = await bdService.updateProposal(req.params.id, req.body);
      sendSuccess(res, proposal);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_PROPOSAL_FAILED",
        message: error instanceof Error ? error.message : "Failed to update proposal",
      });
    }
  };

  listCommunications = async (req: Request, res: Response): Promise<void> => {
    try {
      const communications = await bdService.listCommunications(req.query as any);
      sendSuccess(res, communications);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_COMMUNICATIONS_FAILED",
        message: error instanceof Error ? error.message : "Failed to list communications",
      });
    }
  };

  createCommunication = async (req: Request, res: Response): Promise<void> => {
    try {
      const communication = await bdService.createCommunication(req.body);
      sendSuccess(res, communication, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_COMMUNICATION_FAILED",
        message: error instanceof Error ? error.message : "Failed to create communication",
      });
    }
  };

  listPortfolio = async (req: Request, res: Response): Promise<void> => {
    try {
      const portfolio = await bdService.listPortfolio(req.query as any);
      sendSuccess(res, portfolio);
    } catch (error) {
      sendError(res, 500, {
        code: "LIST_PORTFOLIO_FAILED",
        message: error instanceof Error ? error.message : "Failed to list portfolio",
      });
    }
  };

  getPortfolioItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await bdService.getPortfolioItem(req.params.id);
      if (!item) {
        sendError(res, 404, { code: "NOT_FOUND", message: "Portfolio item not found" });
        return;
      }
      sendSuccess(res, item);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_PORTFOLIO_ITEM_FAILED",
        message: error instanceof Error ? error.message : "Failed to get portfolio item",
      });
    }
  };

  createPortfolioItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await bdService.createPortfolioItem(req.body);
      sendSuccess(res, item, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CREATE_PORTFOLIO_ITEM_FAILED",
        message: error instanceof Error ? error.message : "Failed to create portfolio item",
      });
    }
  };

  updatePortfolioItem = async (req: Request, res: Response): Promise<void> => {
    try {
      const item = await bdService.updatePortfolioItem(req.params.id, req.body);
      sendSuccess(res, item);
    } catch (error) {
      sendError(res, 400, {
        code: "UPDATE_PORTFOLIO_ITEM_FAILED",
        message: error instanceof Error ? error.message : "Failed to update portfolio item",
      });
    }
  };

  getPipeline = async (_req: Request, res: Response): Promise<void> => {
    try {
      const summary = await bdService.getPipelineSummary();
      sendSuccess(res, summary);
    } catch (error) {
      sendError(res, 500, {
        code: "GET_PIPELINE_FAILED",
        message: error instanceof Error ? error.message : "Failed to get pipeline",
      });
    }
  };
}
