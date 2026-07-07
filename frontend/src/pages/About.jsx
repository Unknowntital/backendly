import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import PageWrapper from "@/components/layout/PageWrapper";
import { VALUES, TEAM, STATS } from "@/lib/data";
import FinalCTA from "@/components/sections/FinalCTA";

function CountUp({ value, suffix = "" }) {
    const ref = useRef(null);
    const inView = useInView(ref, { once: true, margin: "-100px" });
    const [n, setN] = useState(0);
    useEffect(() => {
        if (!inView) return;
        const dur = 1500;
        const start = performance.now();
        let raf;
        const tick = (t) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            setN(value * eased);
            if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [inView, value]);
    const isDecimal = value % 1 !== 0;
    const isThousand = value >= 1000;
    const display = isDecimal ? n.toFixed(2) : isThousand ? Math.round(n).toLocaleString() : Math.round(n);
    return <span ref={ref}>{display}{suffix}</span>;
}

export default function About() {
    useEffect(() => { document.title = "About · Backendly"; }, []);
    return (
        <PageWrapper>
            <section className="relative pt-36 md:pt-44 pb-16" data-testid="about-hero">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 -left-24 w-[500px] h-[500px] rounded-full bg-teal-500/[0.12] blur-[130px] animate-drift" />
                    <div className="absolute top-40 -right-20 w-[500px] h-[500px] rounded-full bg-amber-500/[0.08] blur-[130px] animate-drift-slow" />
                </div>
                <div className="container-x relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-3xl"
                    >
                        <div className="inline-flex items-center h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                            About Backendly
                        </div>
                        <h1 className="mt-5 font-display font-bold text-4xl md:text-5xl lg:text-[72px] leading-[1.05] tracking-tight text-white">
                            We're building the backend layer every developer deserves.
                        </h1>
                        <p className="mt-6 text-lg text-zinc-400 leading-relaxed">
                            Backendly exists because too much of a developer's day disappears into infrastructure — provisioning
                            databases, wiring auth, arguing about deploy pipelines. We think that time belongs to the product.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Story */}
            <section className="py-16 md:py-20">
                <div className="container-x max-w-4xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">Our story</h2>
                        <div className="mt-6 space-y-4 text-zinc-300 leading-relaxed">
                            <p>
                                We started Backendly after shipping (and re-shipping) the same auth flow, storage bucket, and
                                webhooks pipeline for the fourth time in as many years. Every project began with a week of
                                plumbing before a single feature could land.
                            </p>
                            <p>
                                So we built the tool we wanted: a single platform that treats auth, Postgres, storage, functions,
                                and realtime as one coherent system — with a free tier that lets you ship real things, not
                                a marketing demo.
                            </p>
                            <p>
                                Today, Backendly powers everything from weekend side projects to production apps serving millions
                                of requests. We're building for developers who ship — and who'd rather spend the afternoon on
                                their product than their infra bill.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Values */}
            <section className="py-16 md:py-20">
                <div className="container-x">
                    <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight max-w-2xl">
                        What we care about.
                    </h2>
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {VALUES.map((v, i) => (
                            <motion.div
                                key={v.title}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: i * 0.08 }}
                                className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 hover:bg-white/[0.06] hover:border-teal-400/30 transition-all"
                                data-testid={`value-${v.title.toLowerCase()}`}
                            >
                                <div className="h-8 w-8 rounded-lg bg-teal-400/15 border border-teal-400/40 text-teal-300 flex items-center justify-center font-display font-bold">
                                    {i + 1}
                                </div>
                                <h3 className="mt-4 font-display font-semibold text-lg text-white">{v.title}</h3>
                                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">{v.body}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-16 md:py-20">
                <div className="container-x">
                    <div className="rounded-[24px] bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-10">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-8" data-testid="stats-strip">
                            {STATS.map((s) => (
                                <div key={s.label}>
                                    <div className="font-display font-bold text-4xl md:text-5xl bg-gradient-to-r from-teal-300 to-amber-300 bg-clip-text text-transparent tracking-tight">
                                        <CountUp value={s.value} suffix={s.suffix} />
                                    </div>
                                    <div className="mt-2 text-sm text-zinc-400">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Team */}
            <section className="py-16 md:py-20">
                <div className="container-x">
                    <h2 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight">The team.</h2>
                    <p className="mt-3 text-zinc-400 max-w-xl">A small crew of engineers, designers, and developer advocates working remotely from six time zones.</p>
                    <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
                        {TEAM.map((m) => (
                            <div key={m.name} className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-5 text-center hover:bg-white/[0.06] hover:border-teal-400/30 hover:-translate-y-1 transition-all duration-300">
                                <div className="mx-auto h-14 w-14 rounded-full bg-gradient-to-br from-teal-400/30 to-amber-500/20 border border-white/10 flex items-center justify-center font-display font-bold text-white">
                                    {m.initials}
                                </div>
                                <div className="mt-3 text-sm font-medium text-white">{m.name}</div>
                                <div className="text-xs text-zinc-500">{m.role}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <FinalCTA />
        </PageWrapper>
    );
}
