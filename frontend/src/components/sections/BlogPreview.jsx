import { motion } from "framer-motion";
import { ArrowRight, Clock } from "lucide-react";
import { BLOG_POSTS } from "@/lib/data";

const GRADIENTS = [
    "from-teal-500/30 via-teal-400/10 to-transparent",
    "from-amber-500/30 via-amber-400/10 to-transparent",
    "from-purple-500/25 via-teal-500/10 to-transparent",
];

export default function BlogPreview() {
    return (
        <section id="blog" className="py-24 md:py-32" data-testid="blog-section">
            <div className="container-x">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
                >
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                            Blog
                        </div>
                        <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-white">
                            From the Backendly blog.
                        </h2>
                    </div>
                    <a href="#" className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-300 hover:text-teal-200 group">
                        View all posts <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </a>
                </motion.div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
                    {BLOG_POSTS.map((p, i) => (
                        <motion.article
                            key={p.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className="group rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] overflow-hidden hover:bg-white/[0.06] hover:border-teal-400/30 hover:-translate-y-1 transition-all duration-300"
                            data-testid={`blog-card-${i}`}
                        >
                            <div className={`h-40 bg-gradient-to-br ${GRADIENTS[i % 3]} relative overflow-hidden`}>
                                <div className="absolute inset-0 dot-pattern opacity-40" />
                            </div>
                            <div className="p-5">
                                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-teal-300">
                                    <span>{p.category}</span>
                                    <span className="text-zinc-600">·</span>
                                    <span className="text-zinc-500">{p.date}</span>
                                </div>
                                <h3 className="mt-3 font-display font-semibold text-lg text-white leading-snug group-hover:text-teal-100 transition-colors">
                                    {p.title}
                                </h3>
                                <p className="mt-2 text-sm text-zinc-400 leading-relaxed line-clamp-2">{p.excerpt}</p>
                                <div className="mt-4 flex items-center gap-1.5 text-xs text-zinc-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    {p.readTime}
                                </div>
                            </div>
                        </motion.article>
                    ))}
                </div>
            </div>
        </section>
    );
}
