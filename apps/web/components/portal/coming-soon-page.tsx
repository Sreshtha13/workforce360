import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <AdminPageHeader title={title} description="This module is planned for a future phase." />
      <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-muted-foreground">
        Coming soon
      </div>
    </div>
  );
}
