import { Router } from "express";
import { BdController } from "../controllers/bd.controller";
import { requireAuth } from "../middleware/auth";
import { requirePermission } from "../middleware/rbac";
import { validate } from "../middleware/validate";
import {
  createContactSchema,
  updateContactSchema,
  listContactsQuerySchema,
  createLeadSchema,
  updateLeadSchema,
  listLeadsQuerySchema,
  createBidSchema,
  updateBidSchema,
  listBidsQuerySchema,
  createProposalSchema,
  updateProposalSchema,
  listProposalsQuerySchema,
  createCommunicationSchema,
  listCommunicationsQuerySchema,
  createPortfolioItemSchema,
  updatePortfolioItemSchema,
  listPortfolioQuerySchema,
} from "../schemas/bd.schema";

const router = Router();
const controller = new BdController();

router.get(
  "/contacts",
  requireAuth,
  requirePermission("bd.contact.read"),
  validate(listContactsQuerySchema, "query"),
  controller.listContacts,
);
router.get(
  "/contacts/:id",
  requireAuth,
  requirePermission("bd.contact.read"),
  controller.getContact,
);
router.post(
  "/contacts",
  requireAuth,
  requirePermission("bd.contact.create"),
  validate(createContactSchema),
  controller.createContact,
);
router.patch(
  "/contacts/:id",
  requireAuth,
  requirePermission("bd.contact.update"),
  validate(updateContactSchema),
  controller.updateContact,
);

router.get(
  "/leads",
  requireAuth,
  requirePermission("bd.lead.read"),
  validate(listLeadsQuerySchema, "query"),
  controller.listLeads,
);
router.get(
  "/leads/:id",
  requireAuth,
  requirePermission("bd.lead.read"),
  controller.getLead,
);
router.post(
  "/leads",
  requireAuth,
  requirePermission("bd.lead.create"),
  validate(createLeadSchema),
  controller.createLead,
);
router.patch(
  "/leads/:id",
  requireAuth,
  requirePermission("bd.lead.update"),
  validate(updateLeadSchema),
  controller.updateLead,
);

router.get(
  "/bids",
  requireAuth,
  requirePermission("bd.bid.read"),
  validate(listBidsQuerySchema, "query"),
  controller.listBids,
);
router.get(
  "/bids/:id",
  requireAuth,
  requirePermission("bd.bid.read"),
  controller.getBid,
);
router.post(
  "/bids",
  requireAuth,
  requirePermission("bd.bid.create"),
  validate(createBidSchema),
  controller.createBid,
);
router.patch(
  "/bids/:id",
  requireAuth,
  requirePermission("bd.bid.update"),
  validate(updateBidSchema),
  controller.updateBid,
);

router.get(
  "/proposals",
  requireAuth,
  requirePermission("bd.proposal.read"),
  validate(listProposalsQuerySchema, "query"),
  controller.listProposals,
);
router.get(
  "/proposals/:id",
  requireAuth,
  requirePermission("bd.proposal.read"),
  controller.getProposal,
);
router.post(
  "/proposals",
  requireAuth,
  requirePermission("bd.proposal.create"),
  validate(createProposalSchema),
  controller.createProposal,
);
router.patch(
  "/proposals/:id",
  requireAuth,
  requirePermission("bd.proposal.update"),
  validate(updateProposalSchema),
  controller.updateProposal,
);

router.get(
  "/communications",
  requireAuth,
  requirePermission("bd.communication.read"),
  validate(listCommunicationsQuerySchema, "query"),
  controller.listCommunications,
);
router.post(
  "/communications",
  requireAuth,
  requirePermission("bd.communication.create"),
  validate(createCommunicationSchema),
  controller.createCommunication,
);

router.get(
  "/portfolio",
  requireAuth,
  requirePermission("bd.portfolio.read"),
  validate(listPortfolioQuerySchema, "query"),
  controller.listPortfolio,
);
router.get(
  "/portfolio/:id",
  requireAuth,
  requirePermission("bd.portfolio.read"),
  controller.getPortfolioItem,
);
router.post(
  "/portfolio",
  requireAuth,
  requirePermission("bd.portfolio.create"),
  validate(createPortfolioItemSchema),
  controller.createPortfolioItem,
);
router.patch(
  "/portfolio/:id",
  requireAuth,
  requirePermission("bd.portfolio.update"),
  validate(updatePortfolioItemSchema),
  controller.updatePortfolioItem,
);

router.get(
  "/pipeline",
  requireAuth,
  requirePermission("bd.lead.read"),
  controller.getPipeline,
);

export default router;
