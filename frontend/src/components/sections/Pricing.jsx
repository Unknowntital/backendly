import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Check, ArrowRight } from "lucide-react";
import { PRICING_FEATURES } from "@/lib/data";

export default function Pricing() {
    return (
        <section id="pricing" className="relative py-24 md:py-32" data-testid="pricing-section">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] rounded-full bg-teal-500/[0.08] blur-[140px]" />
                <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-amber-500/[0.05] blur-[120px]" />
            </div>

            <div className="container-x relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto"
                >
                    <div className="inline-flex items-center h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                        Pricing
                    </div>
                    <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-white">
                        Free. No catch.
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-zinc-400">
                        One plan. Every feature. Built for developers who just want to ship.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.7 }}
                    className="mt-14 max-w-3xl mx-auto"
                >
                    <div className="relative rounded-[24px] overflow-hidden">
                        <div className="absolute -inset-px rounded-[24px] bg-gradient-to-br from-teal-400/40 via-amber-500/20 to-teal-400/40 pointer-events-none opacity-70" />
                        <div className="relative rounded-[24px] bg-[#0A0C10]/90 backdrop-blur-2xl border border-white/[0.06] p-8 md:p-12">
                            <div className="flex items-baseline justify-center gap-2">
                                <span className="font-display font-bold text-7xl md:text-8xl text-white tracking-tight">$0</span>
                                <span className="text-zinc-400 text-lg">/ forever</span>
                            </div>
                            <p className="mt-3 text-center text-sm md:text-base text-zinc-400 max-w-md mx-auto">
                                Every feature. No hidden tiers. No credit card. No "contact sales for pricing" pop-ups.
                            </p>

                            <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3" data-testid="pricing-features">
                                {PRICING_FEATURES.map((f) => (
                                    <li key={f} className="flex items-start gap-3 text-sm text-zinc-200">
                                        <span className="mt-0.5 flex-none h-5 w-5 rounded-md bg-teal-400/15 border border-teal-400/40 flex items-center justify-center">
                                            <Check className="w-3 h-3 text-teal-300" strokeWidth={3} />
                                        </span>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-10 flex justify-center">
                                <Link to="/signup" className="btn-primary group" data-testid="pricing-cta">
                                    Start Building Free
                                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    <p className="mt-8 text-center text-sm text-zinc-400">
                        Need dedicated infrastructure or on-prem?{" "}
                        <Link to="/contact" className="text-teal-300 hover:text-teal-200 font-medium underline underline-offset-4" data-testid="pricing-contact-link">
                            Contact us
                        </Link>
                        {" "}— we'll design something for your team.
                    </p>
                </motion.div>
            </div>
        </section>
    );
}
