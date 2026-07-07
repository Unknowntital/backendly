import { useState } from "react";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Check, Copy, Terminal } from "lucide-react";
import { CODE_SAMPLES } from "@/lib/data";

const highlight = (code) => {
    // very small syntax highlighter: keywords, strings, comments
    const kw = /\b(import|from|const|let|await|async|function|package|return|var|new|if|else|for|def|print|main|err|struct)\b/g;
    const str = /(&quot;[^&]*?&quot;|"[^"]*"|'[^']*')/g;
    const num = /\b(\d+(\.\d+)?)\b/g;
    const cmt = /(\/\/[^\n]*|#[^\n]*)/g;
    let out = code
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
    out = out.replace(cmt, '<span class="text-zinc-500">$1</span>');
    out = out.replace(str, '<span class="text-amber-300">$1</span>');
    out = out.replace(kw, '<span class="text-teal-300">$1</span>');
    out = out.replace(num, '<span class="text-amber-300">$1</span>');
    return out;
};

export default function CodeExamples() {
    const [active, setActive] = useState("JavaScript");
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        await navigator.clipboard.writeText(CODE_SAMPLES[active]);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <section id="code" className="relative py-24 md:py-32" data-testid="code-examples-section">
            <div className="container-x">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                            <Terminal className="w-3.5 h-3.5" /> SDK
                        </div>
                        <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-white">
                            Write less. Ship more.
                        </h2>
                        <p className="mt-4 text-base md:text-lg text-zinc-400 leading-relaxed">
                            A single, elegant SDK for every language you work in. Auth handled, types inferred, APIs
                            deployed — you just write the interesting parts.
                        </p>
                        <ul className="mt-8 space-y-3">
                            {[
                                "Type-safe from schema to client",
                                "Auth, RLS, and rate-limits enforced by default",
                                "Realtime subscriptions on any table",
                                "Zero-config edge deployment",
                            ].map((t) => (
                                <li key={t} className="flex items-start gap-3 text-sm text-zinc-300">
                                    <span className="mt-0.5 flex-none h-5 w-5 rounded-md bg-teal-400/15 border border-teal-400/40 flex items-center justify-center">
                                        <Check className="w-3 h-3 text-teal-300" strokeWidth={3} />
                                    </span>
                                    {t}
                                </li>
                            ))}
                        </ul>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.7 }}
                        className="relative"
                    >
                        <div className="absolute -inset-8 bg-teal-500/[0.06] blur-[80px] rounded-full pointer-events-none" />
                        <div className="relative rounded-[20px] overflow-hidden bg-black/70 backdrop-blur-2xl border border-white/[0.08] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]">
                            <Tabs value={active} onValueChange={setActive}>
                                <div className="flex items-center justify-between border-b border-white/[0.06] pl-2 pr-3">
                                    <TabsList className="bg-transparent p-0 h-11 gap-0">
                                        {Object.keys(CODE_SAMPLES).map((k) => (
                                            <TabsTrigger
                                                key={k}
                                                value={k}
                                                className="relative h-11 px-4 rounded-none bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-white text-zinc-500 hover:text-zinc-200 font-mono text-xs data-[state=active]:shadow-none data-[state=active]:after:content-[''] data-[state=active]:after:absolute data-[state=active]:after:bottom-[-1px] data-[state=active]:after:left-3 data-[state=active]:after:right-3 data-[state=active]:after:h-[2px] data-[state=active]:after:bg-teal-400 data-[state=active]:after:rounded-full"
                                                data-testid={`code-tab-${k.toLowerCase()}`}
                                            >
                                                {k}
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    <button
                                        onClick={copy}
                                        aria-label="Copy code"
                                        className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md text-xs text-zinc-400 hover:text-teal-300 hover:bg-white/[0.05] transition-colors"
                                        data-testid="code-copy-btn"
                                    >
                                        {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                                    </button>
                                </div>
                                {Object.entries(CODE_SAMPLES).map(([k, v]) => (
                                    <TabsContent key={k} value={k} className="m-0">
                                        <pre className="p-5 md:p-6 overflow-x-auto text-[13px] md:text-sm font-mono leading-relaxed text-zinc-200"
                                             dangerouslySetInnerHTML={{ __html: highlight(v) }} />
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
