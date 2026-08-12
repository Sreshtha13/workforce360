import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../lib/response";
import { KnowledgeBaseService } from "../services/knowledge-base.service";
import { TicketService } from "../services/ticket.service";

export class HelpdeskController {
  private ticketService = new TicketService();
  private kbService = new KnowledgeBaseService();

  listTickets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.ticketService.listStaffTickets({
        status: req.query.status as string | undefined,
        assignedToId: req.query.assignedToId as string | undefined,
        search: req.query.search as string | undefined,
      });
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.ticketService.getStaffTicket(req.params.id);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  assignTicket = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.ticketService.assignTicket(
        req.params.id,
        req.body.assignedToId ?? null,
        req.user!.userId,
      );
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.ticketService.updateStatus(
        req.params.id,
        req.body.status,
        req.user!.userId,
      );
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  reply = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.ticketService.addStaffReply(
        req.params.id,
        req.user!.userId,
        req.body.body,
        {
          attachmentFileId: req.body.attachmentFileId,
          setWaiting: req.body.setWaiting,
        },
      );
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  escalate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.ticketService.escalateTicket(req.params.id, req.user!.userId, {
        approverIds: req.body.approverIds,
        notes: req.body.notes,
      });
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  listSla = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.ticketService.listSlaPolicies();
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  upsertSla = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.ticketService.upsertSlaPolicy(req.body, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  listKb = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const publishedOnly = req.query.publishedOnly === "true";
      const data = await this.kbService.list({
        publishedOnly,
        category: req.query.category as string | undefined,
        search: req.query.search as string | undefined,
      });
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getKb = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.kbService.getById(req.params.id, { incrementView: true });
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  createKb = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.kbService.create(req.body, req.user!.userId);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  };

  updateKb = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.kbService.update(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  deleteKb = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.kbService.delete(req.params.id, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}
