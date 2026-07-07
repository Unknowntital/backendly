import Marquee from "react-fast-marquee";
import { TESTIMONIALS } from "@/lib/data";
import { motion } from "framer-motion";

function Card({ t }) {
    return (
        <div className="w-[360px] md:w-[400px] mx-3 rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 hover:bg-white/[0.06] hover:border-teal-400/30 transition-all duration-300">
            <p className="text-sm md:text-base text-zinc-200 leading-relaxed">"{t.quote}"</p>
            <div className="mt-5 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400/30 to-amber-500/20 border border-white/10 flex items-center justify-center font-display font-semibold text-sm text-white">
                    {t.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-zinc-500">{t.role} · <span className="text-teal-400">{t.handle}</span></div>
                </div>
            </div>
        </div>
    );
}

export default function Testimonials() {
    return (
        <section className="py-24 md:py-32" data-testid="testimonials-section">
            <div className="container-x">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto"
                >
                    <div className="inline-flex items-center h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                        Loved by developers
                    </div>
                    <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-white">
                        Ship first. Talk about it later.
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-zinc-400">
                        A few notes from teams and indie hackers who moved to Backendly.
                    </p>
                </motion.div>
            </div>

            <div className="mt-14 space-y-4 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)]">
                <Marquee gradient={false} speed={40} pauseOnHover>
                    {TESTIMONIALS.map((t, i) => <Card key={`a${i}`} t={t} />)}
                </Marquee>
                <Marquee gradient={false} speed={35} direction="right" pauseOnHover>
                    {TESTIMONIALS.slice().reverse().map((t, i) => <Card key={`b${i}`} t={t} />)}
                </Marquee>
            </div>
        </section>
    );
}
