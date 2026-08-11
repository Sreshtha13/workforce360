import { randomBytes } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { env } from "./env";

export type PresignUploadInput = {
  fileName: string;
  mimeType: string;
  purpose: string;
};

export type PresignUploadResult = {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
};

const pendingLocalUploads = new Map<
  string,
  { storageKey: string; mimeType: string; expiresAt: number }
>();

export function generateStorageKey(purpose: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const token = randomBytes(16).toString("hex");
  return `${purpose.toLowerCase()}/${Date.now()}-${token}-${safeName}`;
}

export async function createPresignedUpload(
  input: PresignUploadInput,
): Promise<PresignUploadResult> {
  const storageKey = generateStorageKey(input.purpose, input.fileName);
  const expiresInSeconds = 900;

  if (env.STORAGE_PROVIDER === "s3") {
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
      throw new Error("S3 storage is not configured");
    }

    const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
    const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

    const client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      forcePathStyle: Boolean(env.S3_ENDPOINT),
    });

    const command = new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: storageKey,
      ContentType: input.mimeType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: expiresInSeconds });

    return { uploadUrl, storageKey, expiresInSeconds };
  }

  const uploadToken = randomBytes(24).toString("hex");
  pendingLocalUploads.set(uploadToken, {
    storageKey,
    mimeType: input.mimeType,
    expiresAt: Date.now() + expiresInSeconds * 1000,
  });

  const uploadUrl = `${env.STORAGE_PUBLIC_BASE_URL}/api/storage/upload/${uploadToken}`;

  return { uploadUrl, storageKey, expiresInSeconds };
}

export async function handleLocalUpload(
  uploadToken: string,
  body: Buffer,
  contentType?: string,
): Promise<{ storageKey: string }> {
  const pending = pendingLocalUploads.get(uploadToken);
  if (!pending || pending.expiresAt < Date.now()) {
    throw new Error("Upload token expired or invalid");
  }

  pendingLocalUploads.delete(uploadToken);

  const filePath = join(process.cwd(), env.STORAGE_LOCAL_DIR, pending.storageKey);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, body);

  if (contentType && contentType !== pending.mimeType) {
    // Allow minor mismatch; stored file uses declared mime from presign
  }

  return { storageKey: pending.storageKey };
}

export async function readStoredFile(storageKey: string): Promise<Buffer> {
  if (env.STORAGE_PROVIDER === "s3") {
    if (!env.S3_BUCKET || !env.S3_ACCESS_KEY || !env.S3_SECRET_KEY) {
      throw new Error("S3 storage is not configured");
    }

    const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
    const client = new S3Client({
      region: env.S3_REGION,
      endpoint: env.S3_ENDPOINT,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY,
        secretAccessKey: env.S3_SECRET_KEY,
      },
      forcePathStyle: Boolean(env.S3_ENDPOINT),
    });

    const response = await client.send(
      new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: storageKey }),
    );
    const bytes = await response.Body?.transformToByteArray();
    if (!bytes) throw new Error("Empty file from storage");
    return Buffer.from(bytes);
  }

  const filePath = join(process.cwd(), env.STORAGE_LOCAL_DIR, storageKey);
  return readFile(filePath);
}
