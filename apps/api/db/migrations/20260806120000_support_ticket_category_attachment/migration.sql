-- AlterTable
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "latest_reply" TEXT;
ALTER TABLE "support_tickets" ADD COLUMN IF NOT EXISTS "attachment_file_id" TEXT;

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'support_tickets_attachment_file_id_fkey'
  ) THEN
    ALTER TABLE "support_tickets"
      ADD CONSTRAINT "support_tickets_attachment_file_id_fkey"
      FOREIGN KEY ("attachment_file_id") REFERENCES "stored_files"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
