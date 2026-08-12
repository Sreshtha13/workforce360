import { Request, Response, NextFunction } from "express";
import { AssetService } from "../services/asset.service";
import { sendSuccess } from "../lib/response";

export class AssetController {
  private assetService = new AssetService();

  createAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await this.assetService.createAsset(req.body, req.user!.userId);
      return sendSuccess(res, asset, 201);
    } catch (error) {
      next(error);
    }
  };

  updateAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await this.assetService.updateAsset(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, asset);
    } catch (error) {
      next(error);
    }
  };

  deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.assetService.deleteAsset(req.params.id, req.user!.userId);
      return sendSuccess(res, { message: "Asset deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  assignAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await this.assetService.assignAsset(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, asset);
    } catch (error) {
      next(error);
    }
  };

  returnAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await this.assetService.returnAsset(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, asset);
    } catch (error) {
      next(error);
    }
  };

  updateAssetStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await this.assetService.updateAssetStatus(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, asset);
    } catch (error) {
      next(error);
    }
  };

  getAsset = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const asset = await this.assetService.getAssetById(req.params.id);
      return sendSuccess(res, asset);
    } catch (error) {
      next(error);
    }
  };

  listAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, employeeId, category } = req.query;
      const assets = await this.assetService.listAssets({
        status: status as string,
        employeeId: employeeId as string,
        category: category as string,
      });
      return sendSuccess(res, assets);
    } catch (error) {
      next(error);
    }
  };

  getAssetHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await this.assetService.getAssetHistory(req.params.id);
      return sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  };

  listAssetHistory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { assetId, employeeId, action } = req.query;
      const history = await this.assetService.listAssetHistory({
        assetId: assetId as string,
        employeeId: employeeId as string,
        action: action as string,
      });
      return sendSuccess(res, history);
    } catch (error) {
      next(error);
    }
  };

  getEmployeeAssets = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assets = await this.assetService.getEmployeeAssets(req.params.employeeId);
      return sendSuccess(res, assets);
    } catch (error) {
      next(error);
    }
  };

  getAssetStats = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await this.assetService.getAssetStats();
      return sendSuccess(res, stats);
    } catch (error) {
      next(error);
    }
  };
}
