"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getMe, getGraph, isAuthenticated, type Project, type GraphData } from "@/lib/api";
import { Logo } from "@/components/logo";

// Dynamically import ForceGraph2D to avoid SSR issues
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Loading graph...</p>
    </div>
  ),
});

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
  const graphRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<Project | null>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGraph, setShowGraph] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    loadData();
  }, [router, userId]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (graphRef.current) {
        setDimensions({
          width: graphRef.current.clientWidth,
          height: Math.max(500, window.innerHeight - 300),
        });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [showGraph]);

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

  // Transform data for react-force-graph
  const getForceGraphData = useCallback(() => {
    if (!graphData) return { nodes: [], links: [] };

    const nodes = graphData.nodes.map((node) => ({
      id: node.id,
      label: node.label,
      type: node.type,
      importance: node.importance,
      color: TYPE_COLORS[node.type] || "#999",
    }));

    const links = graphData.edges.map((edge) => ({
      source: edge.source,
      target: edge.target,
      label: edge.label,
      weight: edge.weight,
    }));

    return { nodes, links };
  }, [graphData]);

  // Custom node rendering
  const nodeCanvasObject = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (node: any, ctx: CanvasRenderingContext2D) => {
      if (node.x === undefined || node.y === undefined) return;

      const label = node.label || "";
      const fontSize = 12;
      const nodeRadius = 6 + (node.importance || 0) * 2;

      // Draw node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = node.color || "#999";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Draw label
      ctx.font = `${fontSize}px Sans-Serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillStyle = "#ccc";
      ctx.fillText(label.substring(0, 30) + (label.length > 30 ? "..." : ""), node.x, node.y + nodeRadius + 2);
    },
    []
  );

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
                <Button variant="outline">Back to Dashboard</Button>
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
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Memories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{graphData?.nodes.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Connections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{graphData?.edges.length || 0}</div>
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
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm text-muted-foreground capitalize">{type}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Interactive Graph Toggle */}
        {graphData && graphData.nodes.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Interactive Graph</h2>
              <Button variant={showGraph ? "outline" : "default"} onClick={() => setShowGraph(!showGraph)}>
                {showGraph ? "Hide Graph" : "Show Interactive Graph"}
              </Button>
            </div>

            {showGraph && (
              <Card>
                <CardContent className="p-0">
                  <div ref={graphRef} className="w-full bg-[#1a1a2e] rounded-lg overflow-hidden" style={{ height: dimensions.height }}>
                    <ForceGraph2D
                      graphData={getForceGraphData()}
                      width={dimensions.width}
                      height={dimensions.height}
                      nodeCanvasObject={nodeCanvasObject}
                      nodePointerAreaPaint={(node, color, ctx) => {
                        if (node.x === undefined || node.y === undefined) return;
                        const importance = (node as { importance?: number }).importance || 0;
                        const nodeRadius = 6 + importance * 2;
                        ctx.beginPath();
                        ctx.arc(node.x, node.y, nodeRadius + 5, 0, 2 * Math.PI);
                        ctx.fillStyle = color;
                        ctx.fill();
                      }}
                      linkColor={() => "rgba(255,255,255,0.2)"}
                      linkWidth={(link) => Math.sqrt((link as { weight?: number }).weight || 1)}
                      backgroundColor="#1a1a2e"
                      cooldownTicks={100}
                      onNodeClick={(node) => {
                        const label = (node as { label?: string }).label;
                        if (label) {
                          alert(`Memory: ${label}`);
                        }
                      }}
                    />
                  </div>
                  <p className="text-muted-foreground text-sm text-center py-2">
                    Drag to pan, scroll to zoom, click nodes for details
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Memories List */}
        <Card>
          <CardHeader>
            <CardTitle>Memories for {userId}</CardTitle>
          </CardHeader>
          <CardContent>
            {graphData?.nodes.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No memories found for this user.</p>
            ) : (
              <div className="space-y-3">
                {graphData?.nodes.map((node) => (
                  <div key={node.id} className="p-4 bg-muted/50 rounded-lg border border-border">
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
                          <span className="text-xs text-muted-foreground">Importance: {node.importance}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
