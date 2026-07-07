import { motion } from "framer-motion";
import {
    SiNextdotjs, SiReact, SiVuedotjs, SiSvelte, SiFlutter, SiExpo,
    SiStripe, SiVercel, SiGithub, SiZapier, SiDiscord
} from "react-icons/si";
import { MessageSquare } from "lucide-react";

const ITEMS = [
    { Icon: SiNextdotjs, name: "Next.js" },
    { Icon: SiReact, name: "React" },
    { Icon: SiVuedotjs, name: "Vue" },
    { Icon: SiSvelte, name: "Svelte" },
    { Icon: SiFlutter, name: "Flutter" },
    { Icon: SiExpo, name: "Expo" },
    { Icon: SiStripe, name: "Stripe" },
    { Icon: SiVercel, name: "Vercel" },
    { Icon: SiGithub, name: "GitHub" },
    { Icon: MessageSquare, name: "Slack" },
    { Icon: SiZapier, name: "Zapier" },
    { Icon: SiDiscord, name: "Discord" },
];

export default function Integrations() {
    return (
        <section id="integrations" className="py-24 md:py-32" data-testid="integrations-section">
            <div className="container-x">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-2xl mx-auto"
                >
                    <div className="inline-flex items-center h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                        Integrations
                    </div>
                    <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-white">
                        Plays well with your entire stack.
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-zinc-400">
                        Drop-in support for the frameworks, tools, and services you already use.
                    </p>
                </motion.div>

                <div className="mt-14 grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {ITEMS.map(({ Icon, name }, i) => (
                        <motion.div
                            key={name}
                            initial={{ opacity: 0, y: 12 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.4, delay: i * 0.04 }}
                            className="group aspect-square rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] hover:border-teal-400/30 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center justify-center gap-2 p-4"
                            data-testid={`integration-${name.toLowerCase().replace('.','-')}`}
                        >
                            <Icon className="w-7 h-7 md:w-8 md:h-8 text-zinc-400 group-hover:text-teal-300 transition-colors" />
                            <span className="text-xs font-medium text-zinc-500 group-hover:text-white transition-colors">{name}</span>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
