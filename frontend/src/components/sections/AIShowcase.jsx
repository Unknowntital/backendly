import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Wand2 } from "lucide-react";

const PROMPTS = [
    "A todo app with user accounts and shared lists",
    "A subscription SaaS with Stripe billing and team roles",
    "A social feed with realtime comments and image uploads",
];

const OUTPUT = [
    { label: "users", type: "table", cols: ["id", "email", "name", "created_at"] },
    { label: "lists", type: "table", cols: ["id", "owner_id", "title", "shared_with[]"] },
    { label: "todos", type: "table", cols: ["id", "list_id", "text", "done", "assignee"] },
    { label: "POST /api/lists", type: "route" },
    { label: "GET /api/lists/:id/todos", type: "route" },
    { label: "fn onTodoCompleted()", type: "fn" },
];

export default function AIShowcase() {
    const [idx, setIdx] = useState(0);
    const [shown, setShown] = useState("");

    useEffect(() => {
        const target = PROMPTS[idx];
        setShown("");
        let i = 0;
        const iv = setInterval(() => {
            i++;
            setShown(target.slice(0, i));
            if (i >= target.length) {
                clearInterval(iv);
                setTimeout(() => setIdx((v) => (v + 1) % PROMPTS.length), 2600);
            }
        }, 34);
        return () => clearInterval(iv);
    }, [idx]);

    return (
        <section id="ai" className="relative py-24 md:py-32 overflow-hidden" data-testid="ai-showcase-section">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-amber-500/[0.09] blur-[150px]" />
                <div className="absolute top-1/3 left-1/3 w-[420px] h-[420px] rounded-full bg-teal-500/[0.08] blur-[120px]" />
            </div>

            <div className="container-x relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto"
                >
                    <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full glass border-amber-500/30 text-xs font-medium text-amber-300">
                        <Wand2 className="w-3.5 h-3.5" /> AI Spotlight
                    </div>
                    <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-white">
                        Describe your app.<br/>
                        <span className="bg-gradient-to-r from-amber-300 to-teal-300 bg-clip-text text-transparent">Backendly builds the backend.</span>
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-zinc-400 leading-relaxed">
                        A prompt in, a production-ready schema out. Auth rules, APIs, functions, and realtime channels — all
                        scaffolded, all yours to edit.
                    </p>
                </motion.div>

                <div className="mt-14 grid grid-cols-1 lg:grid-cols-[1fr_auto_1.2fr] gap-6 items-center">
                    {/* Prompt input */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="rounded-[20px] bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] p-5"
                        data-testid="ai-prompt-panel"
                    >
                        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                            <span className="font-mono">prompt.txt</span>
                        </div>
                        <div className="min-h-[120px] font-mono text-sm md:text-base text-white leading-relaxed">
                            {shown}
                            <span className="caret text-amber-400">▍</span>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button className="h-9 px-4 rounded-lg bg-amber-500 text-black font-semibold text-xs inline-flex items-center gap-1.5 hover:bg-amber-400 shadow-[0_0_25px_-8px_rgba(245,158,11,0.6)]">
                                <Wand2 className="w-3.5 h-3.5" /> Generate
                            </button>
                        </div>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.25 }}
                        className="flex justify-center lg:justify-center"
                    >
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-teal-400/20 to-amber-500/20 border border-teal-400/30 flex items-center justify-center">
                            <ArrowRight className="w-5 h-5 text-teal-300 rotate-90 lg:rotate-0" />
                        </div>
                    </motion.div>

                    {/* Output */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.35 }}
                        className="relative rounded-[20px] bg-black/60 backdrop-blur-2xl border border-white/[0.08] p-5 overflow-hidden"
                        data-testid="ai-output-panel"
                    >
                        <div className="absolute -inset-px rounded-[20px] pointer-events-none bg-gradient-to-br from-teal-400/20 via-transparent to-amber-500/10" />
                        <div className="relative">
                            <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                                <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"/>
                                <span className="font-mono">Generated in 2.4s</span>
                            </div>
                            <div className="space-y-2">
                                {OUTPUT.map((o, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, x: 10 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                                        className="flex items-center gap-3 rounded-md px-3 py-2 bg-white/[0.03] border border-white/[0.06] font-mono text-xs md:text-[13px]"
                                    >
                                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                                            o.type === 'table' ? 'bg-teal-400/15 text-teal-300' :
                                            o.type === 'route' ? 'bg-amber-400/15 text-amber-300' :
                                            'bg-purple-400/15 text-purple-300'
                                        }`}>
                                            {o.type.toUpperCase()}
                                        </span>
                                        <span className="text-white">{o.label}</span>
                                        {o.cols && (
                                            <span className="text-zinc-500 truncate">
                                                ({o.cols.join(", ")})
                                            </span>
                                        )}
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
