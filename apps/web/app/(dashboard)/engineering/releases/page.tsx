"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Rocket, GitBranch, Package } from "lucide-react";
import { ReleaseStatus, ReleaseType } from "@/types/engineering";

export default function ReleasesPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [version, setVersion] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<ReleaseType>(ReleaseType.MINOR);
  const [description, setDescription] = useState("");
  const [releaseDate, setReleaseDate] = useState("");
  const queryClient = useQueryClient();

  const { data: releases, isLoading } = useQuery({
    queryKey: ["engineering", "releases"],
    queryFn: () => apiClient.engineering.releases.list({}),
  });

  const { data: projects } = useQuery({
    queryKey: ["pm", "projects"],
    queryFn: () => apiClient.pm.projects.list({}),
  });

  const createMutation = useMutation({
    mutationFn: () => apiClient.engineering.releases.create({
      projectId,
      version,
      name,
      type,
      description,
      releaseDate,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engineering", "releases"] });
      setIsOpen(false);
      resetForm();
    },
  });

  const deployMutation = useMutation({
    mutationFn: (id: string) => apiClient.engineering.releases.deploy(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engineering", "releases"] });
    },
  });

  const rollbackMutation = useMutation({
    mutationFn: (id: string) => apiClient.engineering.releases.rollback(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engineering", "releases"] });
    },
  });

  const resetForm = () => {
    setProjectId("");
    setVersion("");
    setName("");
    setType(ReleaseType.MINOR);
    setDescription("");
    setReleaseDate("");
  };

  const getStatusColor = (status: ReleaseStatus) => {
    const colors = {
      [ReleaseStatus.PLANNING]: "bg-gray-500",
      [ReleaseStatus.IN_PROGRESS]: "bg-blue-500",
      [ReleaseStatus.TESTING]: "bg-yellow-500",
      [ReleaseStatus.STAGING]: "bg-purple-500",
      [ReleaseStatus.RELEASED]: "bg-green-500",
      [ReleaseStatus.ROLLED_BACK]: "bg-red-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getTypeColor = (type: ReleaseType) => {
    const colors = {
      [ReleaseType.MAJOR]: "bg-red-100 text-red-800",
      [ReleaseType.MINOR]: "bg-blue-100 text-blue-800",
      [ReleaseType.PATCH]: "bg-green-100 text-green-800",
      [ReleaseType.HOTFIX]: "bg-orange-100 text-orange-800",
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Releases</h1>
          <p className="text-muted-foreground">Manage software releases and deployments</p>
        </div>
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Release
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Release</SheetTitle>
              <SheetDescription>Plan a new software release</SheetDescription>
            </SheetHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Version</Label>
                <Input
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g., 1.2.0"
                />
              </div>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Summer Release"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ReleaseType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ReleaseType.MAJOR}>Major</SelectItem>
                    <SelectItem value={ReleaseType.MINOR}>Minor</SelectItem>
                    <SelectItem value={ReleaseType.PATCH}>Patch</SelectItem>
                    <SelectItem value={ReleaseType.HOTFIX}>Hotfix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Release Date</Label>
                <Input
                  type="date"
                  value={releaseDate}
                  onChange={(e) => setReleaseDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what's in this release..."
                  rows={3}
                />
              </div>
              <Button
                onClick={() => createMutation.mutate()}
                disabled={!projectId || !version || !name || createMutation.isPending}
                className="w-full"
              >
                Create Release
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Releases List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            All Releases
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading...</div>
          ) : releases && releases.length > 0 ? (
            <div className="space-y-3">
              {releases.map((release) => (
                <div key={release.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <p className="font-medium">{release.name} (v{release.version})</p>
                      <Badge className={getStatusColor(release.status)}>
                        {release.status}
                      </Badge>
                      <Badge variant="outline" className={getTypeColor(release.type)}>
                        {release.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{release.project?.name}</p>
                    {release.description && (
                      <p className="text-sm text-muted-foreground">{release.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {release.releaseDate && (
                        <span>Release Date: {format(new Date(release.releaseDate), "MMM d, yyyy")}</span>
                      )}
                      {release.tagName && <span>Tag: {release.tagName}</span>}
                      {release.buildNumber && <span>Build: {release.buildNumber}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {release.status === ReleaseStatus.STAGING && (
                      <Button
                        size="sm"
                        onClick={() => deployMutation.mutate(release.id)}
                        disabled={deployMutation.isPending}
                      >
                        <Rocket className="mr-1 h-3 w-3" />
                        Deploy
                      </Button>
                    )}
                    {release.status === ReleaseStatus.RELEASED && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => rollbackMutation.mutate(release.id)}
                        disabled={rollbackMutation.isPending}
                      >
                        Rollback
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No releases yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
