import type { Request, Response } from "express";
import { sendSuccess, sendError } from "../lib/response";
import { AppError } from "../lib/app-error";
import { settingsService } from "../services/settings.service";
import type {
  UpsertSettingsInput,
  CreateTemplateInput,
  UpdateTemplateInput,
} from "../schemas/settings.schema";

function handleError(res: Response, error: unknown, fallback: string): void {
  if (error instanceof AppError) {
    sendError(res, error.statusCode, { code: error.code, message: error.message });
    return;
  }
  sendError(res, 500, {
    code: "SETTINGS_ERROR",
    message: error instanceof Error ? error.message : fallback,
  });
}

export class SettingsController {
  listSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await settingsService.listSettings(req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to list settings");
    }
  };

  upsertSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as UpsertSettingsInput;
      const data = await settingsService.upsertSettings(body.settings, req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to update settings");
    }
  };

  listTemplates = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await settingsService.listTemplates();
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to list templates");
    }
  };

  createTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as CreateTemplateInput;
      const data = await settingsService.createTemplate(body, req.user!.userId);
      sendSuccess(res, data, 201);
    } catch (error) {
      handleError(res, error, "Failed to create template");
    }
  };

  updateTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const body = req.body as UpdateTemplateInput;
      const data = await settingsService.updateTemplate(
        req.params.id,
        body,
        req.user!.userId,
      );
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to update template");
    }
  };

  deleteTemplate = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = await settingsService.deleteTemplate(req.params.id, req.user!.userId);
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to delete template");
    }
  };

  masterDataSummary = async (_req: Request, res: Response): Promise<void> => {
    try {
      const data = await settingsService.getMasterDataSummary();
      sendSuccess(res, data);
    } catch (error) {
      handleError(res, error, "Failed to load master data summary");
    }
  };

  listIntegrations = async (_req: Request, res: Response): Promise<void> => {
    try {
      sendSuccess(res, settingsService.listIntegrationsPlaceholder());
    } catch (error) {
      handleError(res, error, "Failed to list integrations");
    }
  };
}
