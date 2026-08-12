import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../lib/response";
import { NotificationService } from "../services/notification.service";

export class NotificationController {
  private service = new NotificationService();

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unreadOnly = req.query.unreadOnly === "true";
      const category = req.query.category as never;
      const data = await this.service.list(req.user!.userId, { unreadOnly, category });
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  unreadCount = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const count = await this.service.unreadCount(req.user!.userId);
      return sendSuccess(res, { count });
    } catch (error) {
      next(error);
    }
  };

  markRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.markRead(req.params.id, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  markAllRead = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.markAllRead(req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getPreferences = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getPreferences(req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  updatePreference = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updatePreference(req.user!.userId, req.body, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  listAnnouncements = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const activeOnly = req.query.activeOnly === "true";
      const data = await this.service.listAnnouncements({ activeOnly });
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  createAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createAnnouncement(req.body, req.user!.userId);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  };

  updateAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateAnnouncement(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  publishAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.publishAnnouncement(req.params.id, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  deleteAnnouncement = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.deleteAnnouncement(req.params.id, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}
