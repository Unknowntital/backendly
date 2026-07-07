import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const LINKS = [
    { label: "Product", href: "/#features" },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/#pricing" },
    { label: "Docs", href: "/docs" },
    { label: "Blog", href: "/#blog" },
    { label: "About", href: "/about" },
];

const Logo = () => (
    <Link to="/" className="flex items-center gap-2 group" data-testid="nav-logo">
        <div className="relative h-8 w-8 flex items-center justify-center">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-teal-400/30 to-amber-500/20 blur-md group-hover:blur-lg transition-all" />
            <div className="relative h-8 w-8 rounded-lg border border-teal-400/40 bg-black/40 flex items-center justify-center font-mono text-teal-300 text-sm font-bold">
                {"{}"}
            </div>
        </div>
        <span className="font-display font-bold text-xl tracking-tight text-white">
            Backendly
        </span>
    </Link>
);

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() => { setOpen(false); }, [location.pathname]);

    const linkFor = (href) => {
        if (href.startsWith("/#")) {
            return location.pathname === "/" ? href.slice(1) : href;
        }
        return href;
    };

    return (
        <>
            <header
                className={cn(
                    "fixed top-0 inset-x-0 z-50 transition-all duration-300",
                    scrolled
                        ? "bg-[#08090C]/75 backdrop-blur-2xl border-b border-white/[0.06] py-3"
                        : "bg-transparent py-5"
                )}
            >
                <nav className="container-x flex items-center justify-between" aria-label="Primary">
                    <Logo />
                    <ul className="hidden lg:flex items-center gap-1">
                        {LINKS.map((l) => (
                            <li key={l.label}>
                                {l.href.startsWith("/#") ? (
                                    <a
                                        href={linkFor(l.href)}
                                        className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md"
                                        data-testid={`nav-link-${l.label.toLowerCase()}`}
                                    >
                                        {l.label}
                                    </a>
                                ) : (
                                    <Link
                                        to={l.href}
                                        className="px-3 py-2 text-sm text-zinc-400 hover:text-white transition-colors rounded-md"
                                        data-testid={`nav-link-${l.label.toLowerCase()}`}
                                    >
                                        {l.label}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div className="hidden lg:flex items-center gap-3">
                        {user ? (
                            <>
                                <button
                                    onClick={async () => { await logout(); navigate("/"); }}
                                    className="text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 transition-colors"
                                    data-testid="nav-signout"
                                >
                                    Sign out
                                </button>
                                <Link to="/dashboard" className="btn-primary" data-testid="nav-dashboard">
                                    Dashboard <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-zinc-300 hover:text-white px-4 py-2 transition-colors" data-testid="nav-signin">
                                    Sign in
                                </Link>
                                <Link to="/signup" className="btn-primary" data-testid="nav-cta-start">
                                    Start Building Free
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                    <button
                        className="lg:hidden h-10 w-10 rounded-lg glass flex items-center justify-center text-white"
                        onClick={() => setOpen(true)}
                        aria-label="Open menu"
                        data-testid="nav-menu-open"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                </nav>
            </header>

            {/* Mobile overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-[60] lg:hidden transition-all duration-300",
                    open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                data-testid="nav-mobile-overlay"
            >
                <div className="absolute inset-0 bg-[#08090C]/95 backdrop-blur-2xl" />
                <div className="relative h-full flex flex-col">
                    <div className="container-x flex items-center justify-between py-5">
                        <Logo />
                        <button
                            className="h-10 w-10 rounded-lg glass flex items-center justify-center text-white"
                            onClick={() => setOpen(false)}
                            aria-label="Close menu"
                            data-testid="nav-menu-close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                    <ul className="container-x flex-1 flex flex-col justify-center gap-2">
                        {LINKS.map((l, i) => (
                            <li
                                key={l.label}
                                className={cn(open ? "animate-fade-in-up" : "opacity-0")}
                                style={{ animationDelay: `${i * 60}ms` }}
                            >
                                {l.href.startsWith("/#") ? (
                                    <a
                                        href={linkFor(l.href)}
                                        className="block py-4 text-3xl font-display font-semibold text-white hover:text-teal-300 transition-colors border-b border-white/[0.06]"
                                    >
                                        {l.label}
                                    </a>
                                ) : (
                                    <Link
                                        to={l.href}
                                        className="block py-4 text-3xl font-display font-semibold text-white hover:text-teal-300 transition-colors border-b border-white/[0.06]"
                                    >
                                        {l.label}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                    <div className="container-x py-8 flex flex-col gap-3">
                        {user ? (
                            <>
                                <button onClick={async () => { await logout(); navigate("/"); setOpen(false); }} className="btn-ghost w-full">Sign out</button>
                                <Link to="/dashboard" className="btn-primary w-full" onClick={() => setOpen(false)}>
                                    Dashboard <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        ) : (
                            <>
                                <Link to="/login" className="btn-ghost w-full" onClick={() => setOpen(false)}>Sign in</Link>
                                <Link to="/signup" className="btn-primary w-full" onClick={() => setOpen(false)}>
                                    Start Building Free <ArrowRight className="w-4 h-4" />
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
