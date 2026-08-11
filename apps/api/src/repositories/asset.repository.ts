import { prisma } from "../lib/prisma";
import type { Prisma } from "@prisma/client";

export class AssetRepository {
  async createAsset(data: Prisma.AssetUncheckedCreateInput) {
    return prisma.asset.create({ data });
  }

  async findAssetById(id: string) {
    return prisma.asset.findFirst({
      where: { id, deletedAt: null },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
              },
            },
          },
        },
      },
    });
  }

  async findAssetByTag(tag: string) {
    return prisma.asset.findFirst({
      where: { tag, deletedAt: null },
    });
  }

  async findManyAssets(where?: Prisma.AssetWhereInput) {
    return prisma.asset.findMany({
      where: { ...where, deletedAt: null },
      include: {
        employee: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                employeeId: true,
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async updateAsset(id: string, data: Prisma.AssetUncheckedUpdateInput) {
    return prisma.asset.update({
      where: { id },
      data,
    });
  }

  async softDeleteAsset(id: string) {
    return prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createAssetHistory(data: Prisma.AssetHistoryUncheckedCreateInput) {
    return prisma.assetHistory.create({ data });
  }

  async findAssetHistoryById(id: string) {
    return prisma.assetHistory.findUnique({
      where: { id },
    });
  }

  async findAssetHistoryByAssetId(assetId: string) {
    return prisma.assetHistory.findMany({
      where: { assetId },
      orderBy: { timestamp: "desc" },
    });
  }

  async findAssetHistoryByEmployeeId(employeeId: string) {
    return prisma.assetHistory.findMany({
      where: { employeeId },
      orderBy: { timestamp: "desc" },
    });
  }

  async findManyAssetHistory(where?: Prisma.AssetHistoryWhereInput) {
    return prisma.assetHistory.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });
  }

  async countAssetsByStatus(status: string) {
    return prisma.asset.count({
      where: {
        status: status as any,
        deletedAt: null,
      },
    });
  }

  async findAssetsAssignedToEmployee(employeeId: string) {
    return prisma.asset.findMany({
      where: {
        employeeId,
        status: "ASSIGNED",
        deletedAt: null,
      },
      orderBy: { name: "asc" },
    });
  }
}
