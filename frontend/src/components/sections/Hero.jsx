import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const LINES = [
    { text: "$ npm i @backendly/sdk", type: "cmd" },
    { text: "✓ installed in 1.2s", type: "ok" },
    { text: "> import { backendly } from '@backendly/sdk'", type: "code" },
    { text: "> await backendly.db.table('users').create({", type: "code" },
    { text: "    email: 'ada@lovelace.dev',", type: "code" },
    { text: "    role: 'admin'", type: "code" },
    { text: "  })", type: "code" },
    { text: "→ user_01H8P3JZ created · realtime broadcast sent", type: "ok" },
];

function useTyping(lines) {
    const [rendered, setRendered] = useState([""]);
    useEffect(() => {
        let li = 0, ci = 0;
        const step = () => {
            if (li >= lines.length) return;
            const line = lines[li].text;
            setRendered((prev) => {
                const next = [...prev];
                next[li] = line.slice(0, ci + 1);
                return next;
            });
            ci++;
            if (ci > line.length) {
                li++;
                ci = 0;
                setRendered((prev) => (li < lines.length ? [...prev, ""] : prev));
                setTimeout(step, 380);
            } else {
                setTimeout(step, 22 + Math.random() * 30);
            }
        };
        const t = setTimeout(step, 500);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return rendered;
}

export default function Hero() {
    const rendered = useTyping(LINES);

    return (
        <section className="relative pt-36 md:pt-44 pb-20 md:pb-28 overflow-hidden" data-testid="hero-section">
            {/* Background glows */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-20 -left-24 w-[520px] h-[520px] rounded-full bg-teal-500/[0.14] blur-[130px] animate-drift" />
                <div className="absolute top-40 right-0 w-[560px] h-[560px] rounded-full bg-amber-500/[0.10] blur-[140px] animate-drift-slow" />
                <div className="absolute inset-0 grid-pattern opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
            </div>

            <div className="container-x relative">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="flex flex-col items-center text-center"
                >
                    <div className="inline-flex items-center gap-2 h-8 px-3 rounded-full glass border-amber-500/30" data-testid="hero-badge">
                        <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400" />
                        </span>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span className="text-xs font-medium text-zinc-200">
                            Now with AI-powered backend generation
                        </span>
                    </div>

                    <h1
                        className="mt-6 font-display font-bold text-[44px] sm:text-6xl lg:text-[80px] leading-[1.05] tracking-tight max-w-5xl text-white"
                        data-testid="hero-headline"
                    >
                        Ship your backend before
                        <br />
                        <span className="bg-gradient-to-r from-teal-300 via-teal-200 to-amber-300 bg-clip-text text-transparent">
                            your coffee gets cold.
                        </span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-base md:text-lg text-zinc-400 leading-[1.7]" data-testid="hero-subheadline">
                        Auth, Postgres, storage, APIs, functions, and realtime — one platform, one SDK, zero DevOps.
                        Built for developers who ship on Fridays.
                    </p>

                    <div className="mt-8 flex flex-col sm:flex-row gap-3">
                        <a href="#pricing" className="btn-primary group" data-testid="hero-cta-primary">
                            Start Building Free
                            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                        </a>
                        <Link to="/docs" className="btn-ghost" data-testid="hero-cta-secondary">
                            View Documentation
                        </Link>
                    </div>

                    <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-teal-400"/> No credit card required</span>
                        <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-teal-400"/> Free tier forever</span>
                        <span className="flex items-center gap-1.5"><span className="h-1 w-1 rounded-full bg-teal-400"/> Deploy in seconds</span>
                    </div>
                </motion.div>

                {/* Terminal */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                    className="mt-16 mx-auto max-w-4xl"
                    data-testid="hero-terminal"
                >
                    <div className="relative rounded-[20px] overflow-hidden bg-black/60 backdrop-blur-2xl border border-white/10 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]">
                        <div className="absolute -inset-px rounded-[20px] pointer-events-none bg-gradient-to-br from-teal-400/20 via-transparent to-amber-500/20 opacity-60" />
                        <div className="relative">
                            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                                <span className="h-2.5 w-2.5 rounded-full bg-teal-400/70" />
                                <span className="ml-3 text-xs font-mono text-zinc-500">~/apps/coffee-shop — backendly</span>
                            </div>
                            <div className="p-5 md:p-6 font-mono text-[13px] md:text-sm leading-relaxed min-h-[280px] text-left">
                                {rendered.map((line, i) => {
                                    const type = LINES[i]?.type;
                                    const color = type === "cmd"
                                        ? "text-white"
                                        : type === "ok"
                                        ? "text-teal-300"
                                        : "text-zinc-300";
                                    return (
                                        <div key={i} className={color}>
                                            {type === "cmd" && <span className="text-teal-400">$</span>}
                                            {type === "code" && line.startsWith(">") && <span className="text-amber-400">›</span>}
                                            <span className="whitespace-pre">
                                                {" "}{type === "cmd" ? line.slice(2) : line.startsWith(">") ? line.slice(1) : line}
                                            </span>
                                            {i === rendered.length - 1 && <span className="caret text-teal-300">▍</span>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
