"use client";

import { use } from "react";
import { ProjectTabs } from "@/components/pm/project-tabs";

export default function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <div className="space-y-6">
      <ProjectTabs projectId={id} />
      {children}
    </div>
  );
}
