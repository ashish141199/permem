"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMe, getGraph, isAuthenticated, API_URL, type Project, type GraphData } from "@/lib/api";
import { Logo } from "@/components/logo";

// Type colors matching the backend
const TYPE_COLORS: Record<string, string> = {
  core: "#ff6b6b",
  fact: "#4ecdc4",
  decision: "#45b7d1",
  preference: "#96ceb4",
  note: "#dfe6e9",
  event: "#fdcb6e",
  insight: "#a29bfe",
  goal: "#fd79a8",
  relationship: "#00b894",
  emotion: "#e17055",
};

export default function GraphPage() {
  const params = useParams();
  const router = useRouter();
  const userId = decodeURIComponent(params.userId as string);

  const [project, setProject] = useState<Project | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    loadData();
  }, [router, userId]);

  const loadData = async () => {
    try {
      const meData = await getMe();
      setProject(meData.project);

      if (meData.project) {
        const data = await getGraph(meData.project.id, userId);
        setGraphData(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load graph");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading graph...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">{error}</p>
            <div className="mt-4 text-center">
              <Link href="/dashboard">
                <Button variant="outline">
                  Back to Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo href="/dashboard" />
            <span className="text-muted-foreground">/</span>
            <span className="text-muted-foreground">{project?.name}</span>
            <span className="text-muted-foreground">/</span>
            <span>Graph: {userId}</span>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {graphData?.nodes.length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Connections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {graphData?.edges.length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Legend */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-sm">Memory Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {Object.entries(TYPE_COLORS).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm text-muted-foreground capitalize">{type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Memories List */}
        <Card>
          <CardHeader>
            <CardTitle>
              Memories for {userId}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {graphData?.nodes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No memories found for this user.
              </p>
            ) : (
              <div className="space-y-3">
                {graphData?.nodes.map((node) => (
                  <div
                    key={node.id}
                    className="p-4 bg-muted/50 rounded-lg border border-border"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: TYPE_COLORS[node.type] || "#999" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p>{node.label}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {node.type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Importance: {node.importance}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Link to full graph visualization */}
        {graphData && graphData.nodes.length > 0 && project && (
          <div className="mt-6 text-center">
            <a
              href={`${API_URL}/graph?projectId=${project.id}&userId=${encodeURIComponent(userId)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button>
                Open Interactive Graph
              </Button>
            </a>
            <p className="text-muted-foreground text-sm mt-2">
              Opens the full force-directed graph visualization
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
