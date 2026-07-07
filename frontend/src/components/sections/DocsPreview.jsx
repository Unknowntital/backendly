import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Book, ChevronRight, Info } from "lucide-react";

const NAV = [
    {
        title: "Getting Started",
        items: ["Introduction", "Quickstart", "Project Structure", "CLI"],
        active: "Quickstart",
    },
    {
        title: "Authentication",
        items: ["Overview", "Social Providers", "Magic Links", "MFA", "Sessions"],
    },
    {
        title: "Database",
        items: ["Schema", "Queries", "RLS", "Branching"],
    },
    {
        title: "Functions",
        items: ["Runtime", "Cron", "HTTP Triggers"],
    },
];

export default function DocsPreview() {
    return (
        <section id="docs" className="py-24 md:py-32" data-testid="docs-preview-section">
            <div className="container-x">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl"
                >
                    <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                        <Book className="w-3.5 h-3.5" /> Documentation
                    </div>
                    <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-white">
                        Docs written by engineers, not marketers.
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-zinc-400">
                        Copy-pasteable examples, honest edge cases, and a search that actually finds things.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                    className="mt-10 rounded-[20px] overflow-hidden bg-[#0A0C10] border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]"
                >
                    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] min-h-[520px]">
                        {/* Sidebar */}
                        <aside className="border-b lg:border-b-0 lg:border-r border-white/[0.06] p-5 bg-white/[0.015]">
                            <div className="h-9 rounded-md bg-white/[0.03] border border-white/[0.06] px-3 flex items-center text-xs text-zinc-500 font-mono">
                                <span>⌘K  Search docs…</span>
                            </div>
                            <nav className="mt-5 space-y-5 text-sm" aria-label="Docs">
                                {NAV.map((g) => (
                                    <div key={g.title}>
                                        <div className="text-[11px] font-semibold uppercase tracking-widest text-zinc-500 mb-2">
                                            {g.title}
                                        </div>
                                        <ul className="space-y-0.5">
                                            {g.items.map((it) => (
                                                <li key={it}>
                                                    <a
                                                        href="#"
                                                        className={`block px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                                                            g.active === it
                                                                ? 'bg-teal-400/10 text-teal-300 border-l-2 border-teal-400 pl-2'
                                                                : 'text-zinc-400 hover:text-white hover:bg-white/[0.03]'
                                                        }`}
                                                    >
                                                        {it}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </nav>
                        </aside>

                        {/* Content */}
                        <div className="p-6 md:p-8 lg:p-10">
                            <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-6" aria-label="Breadcrumb">
                                <span>Docs</span>
                                <ChevronRight className="w-3 h-3" />
                                <span>Getting Started</span>
                                <ChevronRight className="w-3 h-3" />
                                <span className="text-white">Quickstart</span>
                            </nav>

                            <h3 className="font-display font-bold text-2xl md:text-3xl text-white tracking-tight">
                                Quickstart
                            </h3>
                            <p className="mt-3 text-sm md:text-base text-zinc-400 leading-relaxed">
                                Get from zero to a deployed backend with auth, a Postgres table, and a live API in under two minutes.
                            </p>

                            <h4 className="mt-8 font-display text-lg font-semibold text-white">1. Install the SDK</h4>
                            <div className="mt-3 rounded-lg bg-black/60 border border-white/[0.06] p-4 font-mono text-[13px] text-zinc-300 overflow-x-auto">
                                <span className="text-teal-400">$</span> npm install <span className="text-amber-300">@backendly/sdk</span>
                            </div>

                            <h4 className="mt-8 font-display text-lg font-semibold text-white">2. Initialize a client</h4>
                            <div className="mt-3 rounded-lg bg-black/60 border border-white/[0.06] p-4 font-mono text-[13px] leading-relaxed text-zinc-300 overflow-x-auto">
                                <div><span className="text-teal-300">import</span> {"{ createClient }"} <span className="text-teal-300">from</span> <span className="text-amber-300">"@backendly/sdk"</span>;</div>
                                <div className="mt-2"><span className="text-teal-300">const</span> backendly = createClient({"{"} projectId, apiKey {"}"});</div>
                            </div>

                            <div className="mt-6 rounded-lg bg-teal-500/[0.06] border border-teal-500/20 p-4 flex gap-3">
                                <Info className="w-4 h-4 text-teal-300 flex-none mt-0.5" />
                                <p className="text-xs md:text-sm text-teal-100/90 leading-relaxed">
                                    <span className="font-semibold">Tip:</span> keep <code className="font-mono text-teal-300">apiKey</code> server-side. The CLI can generate a scoped browser key with row-level security automatically.
                                </p>
                            </div>

                            <div className="mt-8">
                                <Link to="/docs" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-300 hover:text-teal-200 group" data-testid="docs-explore-cta">
                                    Explore full documentation
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
