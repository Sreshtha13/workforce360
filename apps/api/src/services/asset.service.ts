import { AssetRepository } from "../repositories/asset.repository";
import { AppError } from "../lib/app-error";
import { writeAuditLog } from "../lib/audit";

export class AssetService {
  private assetRepo = new AssetRepository();

  async createAsset(data: {
    name: string;
    tag: string;
    category?: string;
    serialNumber?: string;
    notes?: string;
  }, actorId: string) {
    const existingTag = await this.assetRepo.findAssetByTag(data.tag);
    if (existingTag) {
      throw new AppError("DUPLICATE_ASSET_TAG", "Asset tag already exists", 400);
    }

    const asset = await this.assetRepo.createAsset({
      name: data.name,
      tag: data.tag,
      category: data.category,
      serialNumber: data.serialNumber,
      status: "AVAILABLE",
      notes: data.notes,
    });

    await this.assetRepo.createAssetHistory({
      assetId: asset.id,
      action: "STATUS_CHANGED",
      toStatus: "AVAILABLE",
      notes: "Asset created",
      performedBy: actorId,
    });

    await writeAuditLog({
      userId: actorId,
      action: "create",
      entity: "asset",
      entityId: asset.id,
      after: asset,
    });

    return asset;
  }

  async updateAsset(id: string, data: {
    name?: string;
    category?: string;
    serialNumber?: string;
    notes?: string;
  }, actorId: string) {
    const existing = await this.assetRepo.findAssetById(id);
    if (!existing) {
      throw new AppError("ASSET_NOT_FOUND", "Asset not found", 404);
    }

    const updated = await this.assetRepo.updateAsset(id, data);

    await writeAuditLog({
      userId: actorId,
      action: "update",
      entity: "asset",
      entityId: id,
      before: existing,
      after: updated,
    });

    return updated;
  }

  async deleteAsset(id: string, actorId: string) {
    const existing = await this.assetRepo.findAssetById(id);
    if (!existing) {
      throw new AppError("ASSET_NOT_FOUND", "Asset not found", 404);
    }

    if (existing.status === "ASSIGNED") {
      throw new AppError("ASSET_ASSIGNED", "Cannot delete an assigned asset. Return it first.", 400);
    }

    await this.assetRepo.softDeleteAsset(id);

    await writeAuditLog({
      userId: actorId,
      action: "delete",
      entity: "asset",
      entityId: id,
      before: existing,
    });
  }

  async assignAsset(id: string, data: {
    employeeId: string;
    notes?: string;
  }, actorId: string) {
    const asset = await this.assetRepo.findAssetById(id);
    if (!asset) {
      throw new AppError("ASSET_NOT_FOUND", "Asset not found", 404);
    }

    if (asset.status !== "AVAILABLE") {
      throw new AppError("ASSET_NOT_AVAILABLE", "Asset is not available for assignment", 400);
    }

    const updated = await this.assetRepo.updateAsset(id, {
      employeeId: data.employeeId,
      status: "ASSIGNED",
      assignedAt: new Date(),
    });

    await this.assetRepo.createAssetHistory({
      assetId: id,
      employeeId: data.employeeId,
      action: "ASSIGNED",
      fromStatus: "AVAILABLE",
      toStatus: "ASSIGNED",
      notes: data.notes || `Assigned to employee`,
      performedBy: actorId,
    });

    await writeAuditLog({
      userId: actorId,
      action: "assign",
      entity: "asset",
      entityId: id,
      before: asset,
      after: updated,
    });

    return updated;
  }

  async returnAsset(id: string, data: {
    notes?: string;
  }, actorId: string) {
    const asset = await this.assetRepo.findAssetById(id);
    if (!asset) {
      throw new AppError("ASSET_NOT_FOUND", "Asset not found", 404);
    }

    if (asset.status !== "ASSIGNED") {
      throw new AppError("ASSET_NOT_ASSIGNED", "Asset is not currently assigned", 400);
    }

    const previousEmployeeId = asset.employeeId;

    const updated = await this.assetRepo.updateAsset(id, {
      employeeId: null,
      status: "AVAILABLE",
      assignedAt: null,
    });

    await this.assetRepo.createAssetHistory({
      assetId: id,
      employeeId: previousEmployeeId || undefined,
      action: "RETURNED",
      fromStatus: "ASSIGNED",
      toStatus: "AVAILABLE",
      notes: data.notes || `Asset returned`,
      performedBy: actorId,
    });

    await writeAuditLog({
      userId: actorId,
      action: "return",
      entity: "asset",
      entityId: id,
      before: asset,
      after: updated,
    });

    return updated;
  }

  async updateAssetStatus(id: string, data: {
    status: "AVAILABLE" | "ASSIGNED" | "MAINTENANCE" | "RETIRED";
    notes?: string;
  }, actorId: string) {
    const asset = await this.assetRepo.findAssetById(id);
    if (!asset) {
      throw new AppError("ASSET_NOT_FOUND", "Asset not found", 404);
    }

    if (data.status === "ASSIGNED" && !asset.employeeId) {
      throw new AppError("ASSET_MISSING_EMPLOYEE", "Cannot mark as ASSIGNED without an employee. Use assignAsset instead.", 400);
    }

    const updated = await this.assetRepo.updateAsset(id, {
      status: data.status,
    });

    await this.assetRepo.createAssetHistory({
      assetId: id,
      employeeId: asset.employeeId || undefined,
      action: "STATUS_CHANGED",
      fromStatus: asset.status,
      toStatus: data.status,
      notes: data.notes || `Status changed to ${data.status}`,
      performedBy: actorId,
    });

    await writeAuditLog({
      userId: actorId,
      action: "update_status",
      entity: "asset",
      entityId: id,
      before: asset,
      after: updated,
    });

    return updated;
  }

  async getAssetById(id: string) {
    const asset = await this.assetRepo.findAssetById(id);
    if (!asset) {
      throw new AppError("ASSET_NOT_FOUND", "Asset not found", 404);
    }
    return asset;
  }

  async listAssets(filters: {
    status?: string;
    employeeId?: string;
    category?: string;
  }) {
    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.category) where.category = filters.category;
    return this.assetRepo.findManyAssets(where);
  }

  async getAssetHistory(id: string) {
    const asset = await this.assetRepo.findAssetById(id);
    if (!asset) {
      throw new AppError("ASSET_NOT_FOUND", "Asset not found", 404);
    }
    return this.assetRepo.findAssetHistoryByAssetId(id);
  }

  async listAssetHistory(filters: {
    assetId?: string;
    employeeId?: string;
    action?: string;
  }) {
    const where: any = {};
    if (filters.assetId) where.assetId = filters.assetId;
    if (filters.employeeId) where.employeeId = filters.employeeId;
    if (filters.action) where.action = filters.action;
    return this.assetRepo.findManyAssetHistory(where);
  }

  async getEmployeeAssets(employeeId: string) {
    return this.assetRepo.findAssetsAssignedToEmployee(employeeId);
  }

  async getAssetStats() {
    const available = await this.assetRepo.countAssetsByStatus("AVAILABLE");
    const assigned = await this.assetRepo.countAssetsByStatus("ASSIGNED");
    const maintenance = await this.assetRepo.countAssetsByStatus("MAINTENANCE");
    const retired = await this.assetRepo.countAssetsByStatus("RETIRED");

    return {
      available,
      assigned,
      maintenance,
      retired,
      total: available + assigned + maintenance + retired,
    };
  }
}
