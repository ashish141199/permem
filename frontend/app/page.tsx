import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-900 to-black text-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="text-2xl font-bold">Permem</div>
        <Link href="/auth/login">
          <Button variant="ghost" className="text-white hover:bg-white/10">
            Login
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Add memory to any LLM
          </h1>
          <p className="text-xl text-zinc-400 mb-8 max-w-xl mx-auto">
            Persistent memory for AI. Store, recall, and inject context with a single line of code.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/auth/signup">
              <Button size="lg" className="bg-white text-black hover:bg-zinc-200 px-8">
                Get Started Free
              </Button>
            </Link>
            <a
              href="https://github.com/ashish141199/permem"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" variant="outline" className="border-zinc-700 hover:bg-white/10 px-8">
                View Docs
              </Button>
            </a>
          </div>
        </div>

        {/* Code Example */}
        <div className="max-w-2xl mx-auto mt-16">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <div className="px-4 py-2 border-b border-zinc-800 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
              <span className="ml-2 text-sm text-zinc-500">example.ts</span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-zinc-300">
                <span className="text-purple-400">import</span> permem <span className="text-purple-400">from</span> <span className="text-green-400">&apos;permem&apos;</span>{"\n\n"}
                <span className="text-zinc-500">// Store a memory</span>{"\n"}
                <span className="text-purple-400">await</span> permem.<span className="text-blue-400">memorize</span>(<span className="text-green-400">&quot;User loves coffee&quot;</span>, {"{"} userId: <span className="text-green-400">&apos;user-123&apos;</span> {"}"}){"\n\n"}
                <span className="text-zinc-500">// Recall memories</span>{"\n"}
                <span className="text-purple-400">const</span> {"{"} memories {"}"} = <span className="text-purple-400">await</span> permem.<span className="text-blue-400">recall</span>(<span className="text-green-400">&quot;What does user like?&quot;</span>, {"{"} userId: <span className="text-green-400">&apos;user-123&apos;</span> {"}"})
              </code>
            </pre>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-24 grid md:grid-cols-3 gap-8">
          <div className="text-center p-6">
            <div className="text-4xl mb-4">{"{"} {"}"}</div>
            <h3 className="text-lg font-semibold mb-2">Simple API</h3>
            <p className="text-zinc-400 text-sm">Four methods: memorize, recall, inject, extract. That&apos;s it.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">~</div>
            <h3 className="text-lg font-semibold mb-2">Smart Dedup</h3>
            <p className="text-zinc-400 text-sm">AI automatically deduplicates and links related memories.</p>
          </div>
          <div className="text-center p-6">
            <div className="text-4xl mb-4">&gt;_</div>
            <h3 className="text-lg font-semibold mb-2">Any LLM</h3>
            <p className="text-zinc-400 text-sm">Works with OpenAI, Anthropic, local models, or any provider.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-zinc-800 text-center text-zinc-500 text-sm">
        Built for developers who want their AI to remember.
      </footer>
    </div>
  );
}
