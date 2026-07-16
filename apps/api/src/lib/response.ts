import type { Response } from "express";
import type { ApiErrorBody, ApiMeta, ApiResponse } from "../types/api";

export function sendSuccess<T>(
  res: Response,
  data: T,
  status = 200,
  meta: ApiMeta | null = null,
): Response {
  const body: ApiResponse<T> = { data, error: null, meta };
  return res.status(status).json(body);
}

export function sendError(
  res: Response,
  status: number,
  error: ApiErrorBody,
  meta: ApiMeta | null = null,
): Response {
  const body: ApiResponse<null> = { data: null, error, meta };
  return res.status(status).json(body);
}
