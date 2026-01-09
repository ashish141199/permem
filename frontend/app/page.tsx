import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { Zap, Brain, GitBranch } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Logo />
        <div className="flex items-center gap-3">
          <Link href="/auth/signup">
            <Button size="sm">
              Get Started
            </Button>
          </Link>
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            Automatic memory for any LLM
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
            Two methods. Batteries included. Permem automatically decides what to store, extracts rich context, and builds a knowledge graph — all behind the scenes.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8">
                Get Started Free
              </Button>
            </Link>
            <a
              href="https://github.com/ashish141199/permem"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="px-8">
                View Docs
              </Button>
            </a>
          </div>
        </div>

        {/* Code Examples */}
        <div className="max-w-4xl mx-auto mt-16 grid md:grid-cols-2 gap-4">
          {/* TypeScript Example */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="ml-2 text-sm text-muted-foreground">TypeScript</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground/80">
                <span className="text-primary">import</span> Permem <span className="text-primary">from</span> <span className="text-green-400">&apos;permem&apos;</span>{"\n\n"}
                <span className="text-primary">const</span> permem = <span className="text-primary">new</span> <span className="text-blue-400">Permem</span>(<span className="text-green-400">&apos;pk_...&apos;</span>){"\n\n"}
                <span className="text-muted-foreground">// Before LLM call - inject relevant memories</span>{"\n"}
                <span className="text-primary">const</span> {"{"} injectionText {"}"} = <span className="text-primary">await</span> permem.<span className="text-blue-400">inject</span>({"\n"}
                {"  "}userMessage, {"{"} userId {"}"}){"\n\n"}
                <span className="text-muted-foreground">// After LLM response - extract new memories</span>{"\n"}
                <span className="text-primary">await</span> permem.<span className="text-blue-400">extract</span>(messages, {"{"} userId {"}"})
              </code>
            </pre>
          </div>

          {/* Python Example */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-border flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="ml-2 text-sm text-muted-foreground">Python</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-foreground/80">
                <span className="text-primary">from</span> permem <span className="text-primary">import</span> Permem{"\n\n"}
                permem = <span className="text-blue-400">Permem</span>(<span className="text-green-400">&quot;pk_...&quot;</span>){"\n\n"}
                <span className="text-muted-foreground"># Before LLM call - inject relevant memories</span>{"\n"}
                result = <span className="text-primary">await</span> permem.<span className="text-blue-400">inject</span>({"\n"}
                {"  "}user_message, user_id=user_id){"\n\n"}
                <span className="text-muted-foreground"># After LLM response - extract new memories</span>{"\n"}
                <span className="text-primary">await</span> permem.<span className="text-blue-400">extract</span>(messages, user_id=user_id)
              </code>
            </pre>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto mt-24 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Fully Automatic</h3>
            <p className="text-muted-foreground text-sm">
              Permem decides what to store, when to store it, and handles deduplication. Just call inject &amp; extract.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Rich Context</h3>
            <p className="text-muted-foreground text-sm">
              Every memory includes type, importance, emotions, entities, topics, and timestamps — automatically extracted.
            </p>
          </div>
          <div className="text-center p-6">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <GitBranch className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Knowledge Graph</h3>
            <p className="text-muted-foreground text-sm">
              Memories are linked into a graph. Visualize connections per user or across your entire project.
            </p>
          </div>
        </div>

        {/* How it works */}
        <div className="max-w-3xl mx-auto mt-24">
          <h2 className="text-2xl font-bold text-center mb-12">How it works</h2>
          <div className="space-y-6">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</div>
              <div>
                <h3 className="font-semibold mb-1">User sends a message</h3>
                <p className="text-muted-foreground text-sm">Call <code className="bg-muted px-1.5 py-0.5 rounded text-xs">inject()</code> before your LLM call. Permem retrieves relevant memories and formats them for your system prompt.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</div>
              <div>
                <h3 className="font-semibold mb-1">LLM responds with context</h3>
                <p className="text-muted-foreground text-sm">Your LLM now has relevant memories in context. It can reference past conversations, preferences, and facts naturally.</p>
              </div>
            </div>
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</div>
              <div>
                <h3 className="font-semibold mb-1">Extract new memories</h3>
                <p className="text-muted-foreground text-sm">Call <code className="bg-muted px-1.5 py-0.5 rounded text-xs">extract()</code> after the response. Permem analyzes the conversation, extracts facts, skips duplicates, and stores new memories.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced methods */}
        <div className="max-w-3xl mx-auto mt-24 text-center">
          <p className="text-muted-foreground text-sm">
            Need more control? Use <code className="bg-muted px-1.5 py-0.5 rounded text-xs">memorize()</code> and <code className="bg-muted px-1.5 py-0.5 rounded text-xs">recall()</code> for manual memory management, or as tools for your AI agents.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border text-center text-muted-foreground text-sm">
        Built for developers who want their AI to remember.
      </footer>
    </div>
  );
}
