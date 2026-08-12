import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../lib/response";
import { DocumentService } from "../services/document.service";

export class DocumentController {
  private service = new DocumentService();

  listCategories = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      return sendSuccess(res, await this.service.listCategories());
    } catch (error) {
      next(error);
    }
  };

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createCategory(req.body, req.user!.userId);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateCategory(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.deleteCategory(req.params.id, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.list(
        {
          search: req.query.search as string | undefined,
          context: req.query.context as never,
          contextEntityId: req.query.contextEntityId as string | undefined,
          categoryId: req.query.categoryId as string | undefined,
          createdById: req.query.createdById as string | undefined,
        },
        req.user!.userId,
      );
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getById(req.params.id, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.create(req.body, req.user!.userId);
      return sendSuccess(res, data, 201);
    } catch (error) {
      next(error);
    }
  };

  addVersion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.addVersion(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  setPermissions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.setPermissions(
        req.params.id,
        req.body.permissions,
        req.user!.userId,
      );
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.delete(req.params.id, req.user!.userId);
      return sendSuccess(res, data);
    } catch (error) {
      next(error);
    }
  };
}
