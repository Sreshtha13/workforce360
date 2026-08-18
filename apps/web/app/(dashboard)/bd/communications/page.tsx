"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { LoadingState, ErrorState } from "@/components/admin/admin-states";
import { SearchBar } from "@/components/design-system/search-bar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { ClientCommunication, CreateCommunicationInput } from "@/types/bd";

export default function BdCommunicationsPage() {
  const [search, debouncedSearch, setSearch] = useDebouncedValue("", 300);
  const [leadFilter, setLeadFilter] = useState<string>("all");
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [form, setForm] = useState<CreateCommunicationInput>({
    subject: "",
    body: "",
    channel: "email",
    direction: "outbound",
  });
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: ["bd", "leads"],
    queryFn: async () => (await apiClient.bd.leads.list()).data ?? [],
  });

  const commsQuery = useQuery({
    queryKey: ["bd", "communications", leadFilter],
    queryFn: async () => {
      const res = await apiClient.bd.communications.list(
        leadFilter !== "all" ? { leadId: leadFilter } : undefined,
      );
      return res.data ?? [];
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCommunicationInput) => apiClient.bd.communications.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bd", "communications"] });
      setIsSheetOpen(false);
      setForm({ subject: "", body: "", channel: "email", direction: "outbound" });
    },
  });

  if (commsQuery.isLoading) return <LoadingState message="Loading communications..." />;
  if (commsQuery.isError) {
    return <ErrorState message="Failed to load communications." onRetry={() => commsQuery.refetch()} />;
  }

  const filtered = (commsQuery.data ?? []).filter((c: ClientCommunication) => {
    if (!debouncedSearch) return true;
    const q = debouncedSearch.toLowerCase();
    return (
      c.subject.toLowerCase().includes(q) ||
      c.body.toLowerCase().includes(q) ||
      c.lead?.title?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Communications"
        description="Log and review client interactions across leads and contacts."
        actions={<Button onClick={() => setIsSheetOpen(true)}>Log communication</Button>}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchBar
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subject or body..."
          containerClassName="max-w-md flex-1"
        />
        <Select value={leadFilter} onValueChange={setLeadFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Filter by lead" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All leads</SelectItem>
            {(leadsQuery.data ?? []).map((lead) => (
              <SelectItem key={lead.id} value={lead.id}>
                {lead.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No communications found.</p>
        ) : (
          filtered.map((comm) => (
            <article key={comm.id} className="rounded-xl border p-4 space-y-2">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold">{comm.subject}</h3>
                  {comm.lead && (
                    <p className="text-sm text-muted-foreground">Lead: {comm.lead.title}</p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {comm.timestamp.slice(0, 10)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{comm.body}</p>
              <div className="flex gap-2">
                <Badge variant="outline" className="capitalize">{comm.direction}</Badge>
                <Badge variant="secondary" className="capitalize">{comm.channel}</Badge>
              </div>
            </article>
          ))
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Log communication</SheetTitle>
          </SheetHeader>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(form);
            }}
          >
            <div className="space-y-2">
              <Label>Lead (optional)</Label>
              <Select
                value={form.leadId ?? "none"}
                onValueChange={(v) =>
                  setForm({ ...form, leadId: v === "none" ? undefined : v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(leadsQuery.data ?? []).map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select
                  value={form.channel}
                  onValueChange={(v) => setForm({ ...form, channel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="phone">Phone</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Direction</Label>
                <Select
                  value={form.direction}
                  onValueChange={(v) => setForm({ ...form, direction: v as "inbound" | "outbound" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="outbound">Outbound</SelectItem>
                    <SelectItem value="inbound">Inbound</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
