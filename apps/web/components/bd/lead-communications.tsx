"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { ClientCommunication, CreateCommunicationInput } from "@/types/bd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type LeadCommunicationsProps = {
  leadId: string;
  contactId?: string;
  communications: ClientCommunication[];
};

export function LeadCommunications({ leadId, contactId, communications }: LeadCommunicationsProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateCommunicationInput>({
    leadId,
    contactId,
    subject: "",
    body: "",
    channel: "email",
    direction: "outbound",
  });

  const mutation = useMutation({
    mutationFn: (data: CreateCommunicationInput) => apiClient.bd.communications.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bd", "leads", leadId] });
      queryClient.invalidateQueries({ queryKey: ["bd", "communications"] });
      setForm({
        leadId,
        contactId,
        subject: "",
        body: "",
        channel: "email",
        direction: "outbound",
      });
    },
  });

  return (
    <section className="rounded-xl border p-5 space-y-4">
      <h3 className="font-semibold">Communications</h3>

      <ul className="space-y-3 max-h-64 overflow-y-auto">
        {communications.length === 0 ? (
          <li className="text-sm text-muted-foreground">No communications logged yet.</li>
        ) : (
          communications.map((comm) => (
            <li key={comm.id} className="rounded-md border px-3 py-2 text-sm space-y-1">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{comm.subject}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {comm.timestamp.slice(0, 10)}
                </span>
              </div>
              <p className="text-muted-foreground line-clamp-2">{comm.body}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {comm.direction} · {comm.channel}
              </p>
            </li>
          ))
        )}
      </ul>

      <form
        className="space-y-3 border-t pt-4"
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(form);
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <Label htmlFor="comm-subject">Subject</Label>
            <Input
              id="comm-subject"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1">
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
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-1">
          <Label htmlFor="comm-body">Message</Label>
          <Textarea
            id="comm-body"
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={3}
            required
          />
        </div>
        <Button type="submit" size="sm" disabled={mutation.isPending}>
          {mutation.isPending ? "Logging..." : "Log communication"}
        </Button>
      </form>
    </section>
  );
}
