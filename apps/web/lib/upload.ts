import { apiClient } from "./api-client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

export async function uploadFileViaPresign(
  file: File,
  purpose: "RESUME" | "POLICY" | "OFFER_LETTER" | "DOCUMENT" | "OTHER",
) {
  const presign = await apiClient.storage.presign({
    fileName: file.name,
    mimeType: file.type || "application/octet-stream",
    purpose,
  });

  const uploadResponse = await fetch(presign.data!.uploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type || "application/octet-stream",
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("File upload to storage failed");
  }

  const confirmed = await apiClient.storage.confirm({
    storageKey: presign.data!.storageKey,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: file.size,
    purpose,
  });

  return confirmed.data!;
}

export { API_BASE_URL };
