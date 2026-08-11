"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { uploadFileViaPresign } from "@/lib/upload";
import { AlertBanner, LoadingState, ErrorState } from "@/components/admin/admin-states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ApplyPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, refetch } = useAuth();
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState<File | null>(null);
  const [guest, setGuest] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "" });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const jobQuery = useQuery({
    queryKey: ["careers", "job", params.slug],
    queryFn: async () => {
      const res = await apiClient.careers.getJob(params.slug);
      return res.data!;
    },
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobQuery.data) return;
    setSubmitting(true);
    setError(null);
    setFeedback(null);

    try {
      if (!user) {
        await apiClient.careers.register({
          email: guest.email,
          password: guest.password,
          firstName: guest.firstName,
          lastName: guest.lastName,
          phone: guest.phone || undefined,
        });
        await refetch();
      }

      await apiClient.careers.apply({
        jobPostingId: jobQuery.data.id,
        coverLetter: coverLetter || undefined,
        firstName: guest.firstName || undefined,
        lastName: guest.lastName || undefined,
        email: guest.email || undefined,
        phone: guest.phone || undefined,
      });

      if (resume) {
        const file = await uploadFileViaPresign(resume, "RESUME");
        await apiClient.recruitment.attachResume(file.id);
      }

      setFeedback("Application submitted successfully.");
      router.push("/candidate/dashboard");
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Application failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (jobQuery.isLoading) return <LoadingState message="Loading application form..." />;
  if (jobQuery.isError || !jobQuery.data) return <ErrorState message="Job not found." />;

  const job = jobQuery.data;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href={`/careers/${job.slug}`} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back to role
        </Link>
        <h1 className="mt-4 text-2xl font-semibold">Apply — {job.title}</h1>
      </div>

      {feedback && <AlertBanner variant="success" message={feedback} />}
      {error && <AlertBanner variant="error" message={error} />}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-white/20 bg-white/50 p-6 dark:bg-white/5">
        {!user && (
          <>
            <p className="text-sm text-muted-foreground">Create a candidate account as part of your application.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" required value={guest.firstName} onChange={(e) => setGuest({ ...guest, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input id="lastName" required value={guest.lastName} onChange={(e) => setGuest({ ...guest, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required value={guest.email} onChange={(e) => setGuest({ ...guest, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8} value={guest.password} onChange={(e) => setGuest({ ...guest, password: e.target.value })} />
            </div>
          </>
        )}

        <div className="space-y-2">
          <Label htmlFor="coverLetter">Cover letter</Label>
          <Textarea id="coverLetter" rows={5} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="resume">Resume (PDF or DOC)</Label>
          <Input id="resume" type="file" accept=".pdf,.doc,.docx" onChange={(e) => setResume(e.target.files?.[0] ?? null)} />
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? "Submitting..." : "Submit application"}
        </Button>
      </form>
    </div>
  );
}
