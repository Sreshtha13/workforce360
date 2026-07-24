import type { StoredFilePurpose } from "@prisma/client";
import { StorageRepository } from "../repositories/phase2.repository";
import { createPresignedUpload } from "../lib/storage";

export class StorageService {
  private repo = new StorageRepository();

  async presignUpload(input: {
    fileName: string;
    mimeType: string;
    purpose: StoredFilePurpose;
    uploadedById?: string;
  }) {
    const presigned = await createPresignedUpload({
      fileName: input.fileName,
      mimeType: input.mimeType,
      purpose: input.purpose,
    });

    return {
      ...presigned,
      purpose: input.purpose,
    };
  }

  async confirmUpload(input: {
    storageKey: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    purpose: StoredFilePurpose;
    uploadedById?: string;
    entityType?: string;
    entityId?: string;
  }) {
    const existing = await this.repo.findByStorageKey(input.storageKey);
    if (existing) return existing;

    return this.repo.createFileRecord(input);
  }
}

export const storageService = new StorageService();
