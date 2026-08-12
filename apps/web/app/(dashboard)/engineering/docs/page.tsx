"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, ExternalLink, Search } from "lucide-react";
import Link from "next/link";

export default function DocumentationPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data: docs, isLoading } = useQuery({
    queryKey: ["engineering", "docs", search, category],
    queryFn: () => apiClient.engineering.documentation.list({ search, category }),
  });

  const categories = docs
    ? Array.from(new Set(docs.map((doc) => doc.category).filter(Boolean)))
    : [];

  const filteredDocs = category
    ? docs?.filter((doc) => doc.category === category)
    : docs;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documentation</h1>
          <p className="text-muted-foreground">Technical documentation and resources</p>
        </div>
        <Button>
          <FileText className="mr-2 h-4 w-4" />
          New Doc
        </Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search documentation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories Tabs */}
      <Tabs value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? undefined : v)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((cat) => (
            <TabsTrigger key={cat} value={cat!}>
              {cat}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={category || "all"} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <div className="col-span-full text-center py-8">Loading...</div>
            ) : filteredDocs && filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <Card key={doc.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{doc.title}</CardTitle>
                        {doc.category && (
                          <Badge variant="outline" className="mt-2">
                            {doc.category}
                          </Badge>
                        )}
                      </div>
                      {doc.isPublished && (
                        <Badge variant="default" className="bg-green-500">
                          Published
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {doc.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {doc.description}
                        </p>
                      )}
                      {doc.version && (
                        <p className="text-xs text-muted-foreground">Version: {doc.version}</p>
                      )}
                      {doc.project && (
                        <p className="text-xs text-muted-foreground">
                          Project: {doc.project.name}
                        </p>
                      )}
                      {doc.url ? (
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-primary hover:underline"
                        >
                          <ExternalLink className="mr-1 h-3 w-3" />
                          View Documentation
                        </a>
                      ) : (
                        <Link href={`/engineering/docs/${doc.id}`}>
                          <Button variant="outline" size="sm" className="w-full">
                            View Details
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center text-muted-foreground py-8">
                No documentation found
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
