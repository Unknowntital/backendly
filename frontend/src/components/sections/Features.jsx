import { motion } from "framer-motion";
import { FEATURES } from "@/lib/data";
import { cn } from "@/lib/utils";

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function Features() {
    return (
        <section id="features" className="relative py-24 md:py-32" data-testid="features-section">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full bg-teal-500/[0.05] blur-[140px]" />
            </div>

            <div className="container-x relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl"
                >
                    <div className="inline-flex items-center h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                        Platform
                    </div>
                    <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-white">
                        Everything your backend needs.
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-zinc-400 leading-relaxed">
                        One platform for auth, data, storage, APIs, functions, and realtime — the entire backend
                        stack, without the ops. So you can focus on the interesting bugs.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-80px" }}
                    className="mt-12 grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(200px,auto)] gap-5"
                >
                    {FEATURES.map((f) => {
                        const Icon = f.icon;
                        return (
                            <motion.article
                                key={f.key}
                                variants={item}
                                className={cn(
                                    "group relative rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 overflow-hidden",
                                    "hover:bg-white/[0.06] hover:border-teal-400/30 transition-all duration-300",
                                    f.span
                                )}
                                data-testid={`feature-card-${f.key}`}
                            >
                                {f.featured && (
                                    <div className="absolute -inset-px rounded-xl bg-gradient-to-br from-teal-400/30 via-transparent to-amber-500/20 opacity-60 pointer-events-none" />
                                )}
                                <div className="relative">
                                    <div className={cn(
                                        "inline-flex items-center justify-center h-11 w-11 rounded-lg",
                                        f.featured
                                            ? "bg-gradient-to-br from-teal-400/20 to-amber-500/10 border border-teal-400/40 text-teal-300"
                                            : "bg-white/[0.04] border border-white/[0.08] text-teal-300 group-hover:border-teal-400/40"
                                    )}>
                                        <Icon className="w-5 h-5" strokeWidth={1.6} />
                                    </div>
                                    <h3 className={cn(
                                        "mt-5 font-display font-semibold text-white",
                                        f.featured ? "text-2xl md:text-3xl" : "text-lg"
                                    )}>
                                        {f.title}
                                    </h3>
                                    <p className={cn(
                                        "mt-2 text-zinc-400 leading-relaxed",
                                        f.featured ? "text-base md:text-lg max-w-md" : "text-sm"
                                    )}>
                                        {f.blurb}
                                    </p>
                                    {f.featured && f.bullets && (
                                        <ul className="mt-6 flex flex-wrap gap-2">
                                            {f.bullets.map((b) => (
                                                <li key={b} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md bg-black/40 border border-white/[0.08] text-xs font-mono text-teal-300">
                                                    <span className="h-1 w-1 rounded-full bg-teal-400"/> {b}
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </motion.article>
                        );
                    })}
                </motion.div>
            </div>
        </section>
    );
}
