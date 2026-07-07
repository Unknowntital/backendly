import { useEffect, useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { motion } from "framer-motion";
import axios from "axios";
import { toast } from "sonner";
import { Mail, MessageCircle, LifeBuoy, Send, Check } from "lucide-react";
import { SiDiscord, SiX } from "react-icons/si";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SUBJECTS = ["General inquiry", "Sales & teams", "Technical support", "Partnerships", "Media / press"];

export default function Contact() {
    const [form, setForm] = useState({ name: "", email: "", company: "", subject: "General inquiry", message: "" });
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => { document.title = "Contact · Backendly"; }, []);

    const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

    const submit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await axios.post(`${API}/contact`, form);
            setSent(true);
            toast.success("Message sent. We'll be in touch shortly.");
            setForm({ name: "", email: "", company: "", subject: "General inquiry", message: "" });
        } catch (err) {
            const detail = err?.response?.data?.detail;
            toast.error(typeof detail === "string" ? detail : "Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full h-11 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 transition-all";

    return (
        <PageWrapper>
            <section className="relative pt-36 md:pt-44 pb-16">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[400px] rounded-full bg-teal-500/[0.10] blur-[130px]" />
                </div>
                <div className="container-x relative">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="max-w-2xl"
                    >
                        <div className="inline-flex items-center h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                            Contact
                        </div>
                        <h1 className="mt-5 font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-white">
                            Say hello.
                        </h1>
                        <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
                            Sales questions, partnership ideas, help with a migration — we read every message.
                        </p>
                    </motion.div>
                </div>
            </section>

            <section className="pb-24">
                <div className="container-x">
                    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-8">
                        <motion.form
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            onSubmit={submit}
                            className="rounded-[20px] bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-6 md:p-8"
                            data-testid="contact-form"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="text-xs font-medium text-zinc-300">Full name</label>
                                    <input id="name" required value={form.name} onChange={update("name")} className={`mt-1.5 ${inputCls}`} placeholder="Ada Lovelace" data-testid="contact-name" />
                                </div>
                                <div>
                                    <label htmlFor="email" className="text-xs font-medium text-zinc-300">Email</label>
                                    <input id="email" type="email" required value={form.email} onChange={update("email")} className={`mt-1.5 ${inputCls}`} placeholder="you@company.dev" data-testid="contact-email" />
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="company" className="text-xs font-medium text-zinc-300">Company <span className="text-zinc-500">(optional)</span></label>
                                    <input id="company" value={form.company} onChange={update("company")} className={`mt-1.5 ${inputCls}`} placeholder="Backendly" data-testid="contact-company" />
                                </div>
                                <div>
                                    <label htmlFor="subject" className="text-xs font-medium text-zinc-300">Subject</label>
                                    <select id="subject" value={form.subject} onChange={update("subject")} className={`mt-1.5 ${inputCls} appearance-none`} data-testid="contact-subject">
                                        {SUBJECTS.map((s) => <option key={s} value={s} className="bg-[#0A0C10]">{s}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label htmlFor="message" className="text-xs font-medium text-zinc-300">Message</label>
                                <textarea id="message" required value={form.message} onChange={update("message")} rows={6} className={`mt-1.5 w-full px-3 py-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 transition-all leading-relaxed`} placeholder="Tell us what you're building…" data-testid="contact-message" />
                            </div>
                            <button
                                type="submit"
                                disabled={loading || sent}
                                className="mt-6 btn-primary group disabled:opacity-70"
                                data-testid="contact-submit"
                            >
                                {sent ? <><Check className="w-4 h-4" /> Message sent</> : loading ? "Sending…" : <>Send message <Send className="w-4 h-4" /></>}
                            </button>
                        </motion.form>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="space-y-4"
                        >
                            {[
                                { Icon: Mail, title: "Support", body: "support@backendly.dev", note: "Replies within one business day." },
                                { Icon: LifeBuoy, title: "Sales", body: "sales@backendly.dev", note: "For teams and dedicated infrastructure." },
                                { Icon: SiDiscord, title: "Community", body: "discord.gg/backendly", note: "9,000+ developers. Fast, friendly answers." },
                                { Icon: SiX, title: "On X / Twitter", body: "@backendly", note: "Product news, incidents, occasional memes." },
                                { Icon: MessageCircle, title: "Where we work", body: "Remote-first · building from everywhere", note: "Six time zones. Zero offices. Async by default." },
                            ].map((c) => (
                                <div key={c.title} className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-5 hover:bg-white/[0.06] hover:border-teal-400/30 transition-all">
                                    <div className="flex items-start gap-3">
                                        <div className="h-9 w-9 rounded-lg bg-teal-400/10 border border-teal-400/30 text-teal-300 flex items-center justify-center">
                                            <c.Icon className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <div className="text-xs uppercase tracking-widest text-zinc-500 font-semibold">{c.title}</div>
                                            <div className="mt-1 text-sm font-medium text-white">{c.body}</div>
                                            <div className="mt-0.5 text-xs text-zinc-400">{c.note}</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>
        </PageWrapper>
    );
}
