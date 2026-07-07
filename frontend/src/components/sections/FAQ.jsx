import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FAQS } from "@/lib/data";

export default function FAQ() {
    return (
        <section id="faq" className="py-24 md:py-32" data-testid="faq-section">
            <div className="container-x">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                    className="max-w-2xl mx-auto text-center"
                >
                    <div className="inline-flex items-center h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                        FAQ
                    </div>
                    <h2 className="mt-4 font-display font-bold text-3xl md:text-4xl lg:text-5xl tracking-tight text-white">
                        Questions, answered.
                    </h2>
                    <p className="mt-4 text-base md:text-lg text-zinc-400">
                        The honest ones. If yours isn't here, ping us on Discord.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-80px" }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="mt-12 max-w-3xl mx-auto"
                >
                    <Accordion type="single" collapsible className="space-y-3">
                        {FAQS.map((f, i) => (
                            <AccordionItem
                                key={i}
                                value={`item-${i}`}
                                className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] px-5 border-b hover:border-teal-400/20 transition-colors"
                            >
                                <AccordionTrigger
                                    className="py-5 text-left font-display font-medium text-base md:text-lg text-white hover:no-underline"
                                    data-testid={`faq-trigger-${i}`}
                                >
                                    {f.q}
                                </AccordionTrigger>
                                <AccordionContent className="pb-5 text-sm md:text-base text-zinc-400 leading-relaxed">
                                    {f.a}
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </motion.div>
            </div>
        </section>
    );
}
