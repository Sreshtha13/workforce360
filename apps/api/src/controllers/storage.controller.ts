import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import { storageService } from "../services/storage.service";
import { handleLocalUpload } from "../lib/storage";
import { env } from "../lib/env";

export class StorageController {
  presignUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await storageService.presignUpload({
        ...req.body,
        uploadedById: req.user?.userId,
      });
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 400, {
        code: "PRESIGN_FAILED",
        message: error instanceof Error ? error.message : "Failed to create upload URL",
      });
    }
  };

  confirmUpload = async (req: Request, res: Response): Promise<void> => {
    try {
      const file = await storageService.confirmUpload({
        ...req.body,
        uploadedById: req.user?.userId,
      });
      sendSuccess(res, file, 201);
    } catch (error) {
      sendError(res, 400, {
        code: "CONFIRM_UPLOAD_FAILED",
        message: error instanceof Error ? error.message : "Failed to confirm upload",
      });
    }
  };

  localUpload = async (req: Request, res: Response): Promise<void> => {
    if (env.STORAGE_PROVIDER !== "local") {
      sendError(res, 404, { code: "NOT_FOUND", message: "Not found" });
      return;
    }

    try {
      const { uploadToken } = req.params;
      const chunks: Buffer[] = [];
      await new Promise<void>((resolve, reject) => {
        req.on("data", (chunk: Buffer) => chunks.push(chunk));
        req.on("end", () => resolve());
        req.on("error", reject);
      });

      const body = Buffer.concat(chunks);
      const result = await handleLocalUpload(
        uploadToken,
        body,
        req.headers["content-type"],
      );
      sendSuccess(res, result);
    } catch (error) {
      sendError(res, 400, {
        code: "UPLOAD_FAILED",
        message: error instanceof Error ? error.message : "Upload failed",
      });
    }
  };
}
