"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getMe,
  getProjectStats,
  getProjectMemories,
  updateProject,
  logout,
  isAuthenticated,
  type User,
  type Project,
  type Memory,
  type ProjectStats,
} from "@/lib/api";
import { Logo } from "@/components/logo";
import { Github } from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [stats, setStats] = useState<ProjectStats | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/auth/login");
      return;
    }

    loadData();
  }, [router]);

  const loadData = async () => {
    try {
      const meData = await getMe();
      setUser(meData.user);
      setProject(meData.project);

      if (meData.project) {
        const [statsData, memoriesData] = await Promise.all([
          getProjectStats(meData.project.id),
          getProjectMemories(meData.project.id, 50),
        ]);
        setStats(statsData);
        setMemories(memoriesData.memories);
      }
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const handleCopyApiKey = async () => {
    if (project?.apiKey) {
      await navigator.clipboard.writeText(project.apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleEditProject = () => {
    if (project) {
      setEditName(project.name);
      setEditDialogOpen(true);
    }
  };

  const handleSaveProject = async () => {
    if (!project || !editName.trim()) return;

    setSaving(true);
    try {
      const result = await updateProject(project.id, { name: editName.trim() });
      setProject(result.project);
      setEditDialogOpen(false);
    } catch (err) {
      console.error("Failed to update project:", err);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Logo />
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <span>{project?.name}</span>
              <button
                onClick={handleEditProject}
                className="text-muted-foreground hover:text-foreground p-1"
                title="Edit project name"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <a
              href="https://github.com/ashish141199/permem"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <Github className="w-4 h-4 mr-2" />
                Docs
              </Button>
            </a>
            <Button
              variant="ghost"
              onClick={handleLogout}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Memory Count */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Memories
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {stats?.memoryCount || 0}
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  / {stats?.maxMemories || 1000}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* API Key */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-3 py-2 rounded flex-1 overflow-hidden font-mono">
                  {project?.apiKey || "..."}
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCopyApiKey}
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Memories Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Memories</CardTitle>
          </CardHeader>
          <CardContent>
            {memories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No memories yet. Use the SDK to start storing memories.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Summary</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>User ID</TableHead>
                    <TableHead className="text-right">
                      Created
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {memories.map((memory) => (
                    <TableRow key={memory.id}>
                      <TableCell className="max-w-md truncate">
                        {memory.summary}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {memory.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/graph/${encodeURIComponent(memory.userId)}`}
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {memory.userId}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-right">
                        {formatDate(memory.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>
              Change your project name.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="projectName">
              Project Name
            </Label>
            <Input
              id="projectName"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="mt-2"
              placeholder="Enter project name"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProject}
              disabled={saving || !editName.trim()}
            >
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
