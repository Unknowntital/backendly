import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export default function FinalCTA() {
    return (
        <section className="py-24 md:py-28" data-testid="final-cta-section">
            <div className="container-x">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.7 }}
                    className="relative rounded-[24px] overflow-hidden"
                >
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-teal-500/[0.18] blur-[130px]" />
                        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-amber-500/[0.14] blur-[130px]" />
                        <div className="absolute inset-0 dot-pattern opacity-20" />
                    </div>
                    <div className="relative bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-10 md:p-16 text-center">
                        <h2 className="font-display font-bold text-4xl md:text-5xl lg:text-6xl tracking-tight text-white leading-[1.05] max-w-3xl mx-auto">
                            Your backend, done in <span className="bg-gradient-to-r from-teal-300 to-amber-300 bg-clip-text text-transparent">minutes.</span>
                        </h2>
                        <p className="mt-5 max-w-xl mx-auto text-base md:text-lg text-zinc-400">
                            Sign up, run one command, and watch a production-ready backend appear.
                        </p>
                        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                            <Link to="/signup" className="btn-primary group" data-testid="final-cta-primary">
                                Start Building Free
                                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                            </Link>
                            <Link to="/docs" className="btn-ghost">Read the docs</Link>
                        </div>
                        <p className="mt-4 text-xs text-zinc-500">No credit card required · Free tier forever</p>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
