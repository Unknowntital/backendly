import { useState } from "react";
import { Link } from "react-router-dom";
import { SiGithub, SiX, SiDiscord } from "react-icons/si";
import { Linkedin } from "lucide-react";
import { ArrowRight, Check } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const COLS = [
    {
        title: "Product",
        links: [
            { label: "Features", href: "/#features" },
            { label: "AI Generation", href: "/#ai" },
            { label: "Pricing", href: "/#pricing" },
            { label: "Integrations", href: "/#integrations" },
            { label: "Changelog", href: "#" },
        ],
    },
    {
        title: "Developers",
        links: [
            { label: "Documentation", href: "/docs" },
            { label: "API Reference", href: "/docs" },
            { label: "SDKs", href: "/docs" },
            { label: "Status Page", href: "#" },
            { label: "Open Source", href: "#" },
        ],
    },
    {
        title: "Company",
        links: [
            { label: "About", href: "/about" },
            { label: "Blog", href: "/#blog" },
            { label: "Careers", href: "#" },
            { label: "Contact", href: "/contact" },
            { label: "Brand", href: "#" },
        ],
    },
    {
        title: "Legal",
        links: [
            { label: "Privacy", href: "#" },
            { label: "Terms", href: "#" },
            { label: "Security", href: "#" },
            { label: "DPA", href: "#" },
            { label: "Cookies", href: "#" },
        ],
    },
];

export default function Footer() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [subscribed, setSubscribed] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setLoading(true);
        try {
            await axios.post(`${API}/newsletter`, { email });
            setSubscribed(true);
            setEmail("");
            toast.success("You're on the list. Check your inbox soon.");
        } catch (err) {
            const detail = err?.response?.data?.detail || "Something went wrong. Try again.";
            toast.error(detail);
        } finally {
            setLoading(false);
        }
    };

    return (
        <footer className="relative border-t border-white/[0.06] mt-24" data-testid="footer">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-teal-500/[0.06] blur-[120px]" />
            </div>

            <div className="container-x relative py-16">
                <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_repeat(4,1fr)] gap-10">
                    <div>
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg border border-teal-400/40 bg-black/40 flex items-center justify-center font-mono text-teal-300 text-sm font-bold">
                                {"{}"}
                            </div>
                            <span className="font-display font-bold text-xl tracking-tight text-white">Backendly</span>
                        </div>
                        <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-xs">
                            The backend platform for developers who'd rather ship than configure.
                        </p>
                        <form onSubmit={submit} className="mt-6 flex gap-2" data-testid="newsletter-form">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@company.dev"
                                aria-label="Email address"
                                className="flex-1 h-10 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 transition-all"
                                data-testid="newsletter-input"
                            />
                            <button
                                type="submit"
                                disabled={loading || subscribed}
                                className="h-10 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm inline-flex items-center gap-1.5 disabled:opacity-70 transition-all shadow-[0_0_20px_-6px_rgba(245,158,11,0.5)]"
                                data-testid="newsletter-submit"
                            >
                                {subscribed ? <><Check className="w-4 h-4" /> Subscribed</> : loading ? "…" : <>Subscribe <ArrowRight className="w-3.5 h-3.5" /></>}
                            </button>
                        </form>
                        <div className="mt-6 flex gap-3">
                            {[
                                { Icon: SiGithub, label: "GitHub" },
                                { Icon: SiX, label: "Twitter" },
                                { Icon: SiDiscord, label: "Discord" },
                                { Icon: Linkedin, label: "LinkedIn" },
                            ].map(({ Icon, label }) => (
                                <a
                                    key={label}
                                    href="#"
                                    aria-label={label}
                                    className="h-9 w-9 rounded-lg glass flex items-center justify-center text-zinc-400 hover:text-teal-300 hover:border-teal-400/40 transition-all"
                                    data-testid={`footer-social-${label.toLowerCase()}`}
                                >
                                    <Icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {COLS.map((col) => (
                        <div key={col.title}>
                            <h3 className="text-xs font-semibold text-white tracking-widest uppercase">{col.title}</h3>
                            <ul className="mt-4 space-y-3">
                                {col.links.map((l) => (
                                    <li key={l.label}>
                                        {l.href.startsWith("/") && !l.href.startsWith("/#") ? (
                                            <Link to={l.href} className="text-sm text-zinc-400 hover:text-teal-300 transition-colors">
                                                {l.label}
                                            </Link>
                                        ) : (
                                            <a href={l.href} className="text-sm text-zinc-400 hover:text-teal-300 transition-colors">
                                                {l.label}
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="mt-14 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between gap-3 text-sm text-zinc-500">
                    <span>© {new Date().getFullYear()} Backendly Inc. Remote-first, building from everywhere.</span>
                    <span className="font-mono text-xs">v1.0 · All systems operational</span>
                </div>
            </div>
        </footer>
    );
}
