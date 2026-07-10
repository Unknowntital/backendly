import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, User } from "lucide-react";
import { SiGoogle } from "react-icons/si";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
function googleLogin() {
    const redirectUrl = window.location.origin + "/dashboard";
    window.location.href = `http://localhost:8000/api/auth/google/login?redirect=${encodeURIComponent(redirectUrl)}`;
}

export default function AuthPage({ mode = "login" }) {
    const isSignup = mode === "signup";
    const navigate = useNavigate();
    const location = useLocation();
    const { user, login, register } = useAuth();
    const [form, setForm] = useState({ name: "", email: "", password: "" });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (user) navigate("/dashboard", { replace: true });
    }, [user, navigate]);

    useEffect(() => {
        document.title = (isSignup ? "Create account" : "Sign in") + " · Backendly";
    }, [isSignup]);

    useEffect(() => {
        const search = new URLSearchParams(location.search);
        if (search.get("error") === "oauth") toast.error("Google sign-in failed. Please try again.");
    }, [location.search]);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            if (isSignup) {
                await register(form.email, form.password, form.name);
                toast.success("Welcome to Backendly.");
            } else {
                await login(form.email, form.password);
                toast.success("Signed in.");
            }
            navigate("/dashboard", { replace: true });
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Authentication failed.");
        } finally {
            setBusy(false);
        }
    };

    const inputCls = "w-full h-11 pl-10 pr-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 transition-all";

    return (
        <div className="min-h-screen bg-[#08090C] text-white flex flex-col overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-24 w-[520px] h-[520px] rounded-full bg-teal-500/[0.14] blur-[130px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/[0.08] blur-[130px]" />
            </div>

            <header className="relative container-x pt-6">
                <Link to="/" className="inline-flex items-center gap-2 group" data-testid="auth-logo">
                    <div className="h-8 w-8 rounded-lg border border-teal-400/40 bg-black/40 flex items-center justify-center font-mono text-teal-300 text-sm font-bold">{"{}"}</div>
                    <span className="font-display font-bold text-xl tracking-tight text-white">Backendly</span>
                </Link>
            </header>

            <main className="relative flex-1 flex items-center justify-center px-6 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md"
                >
                    <div className="rounded-[20px] bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-8 md:p-10 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.6)]">
                        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight" data-testid="auth-heading">
                            {isSignup ? "Create your account." : "Welcome back."}
                        </h1>
                        <p className="mt-2 text-sm text-zinc-400">
                            {isSignup ? "Free forever. No credit card. Deploy in seconds." : "Sign in to keep shipping."}
                        </p>

                        <button
                            type="button"
                            onClick={googleLogin}
                            className="mt-8 w-full h-11 rounded-lg bg-white text-black font-semibold text-sm inline-flex items-center justify-center gap-2 hover:bg-zinc-100 transition-all"
                            data-testid="auth-google-btn"
                        >
                            <SiGoogle className="w-4 h-4" />
                            Continue with Google
                        </button>

                        <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-widest text-zinc-500">
                            <span className="flex-1 h-px bg-white/[0.06]" />
                            or
                            <span className="flex-1 h-px bg-white/[0.06]" />
                        </div>

                        <form onSubmit={submit} className="mt-6 space-y-3" data-testid="auth-form">
                            {isSignup && (
                                <div className="relative">
                                    <User className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                    <input
                                        required
                                        placeholder="Full name"
                                        value={form.name}
                                        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                                        className={inputCls}
                                        data-testid="auth-name"
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="email"
                                    required
                                    placeholder="you@company.dev"
                                    value={form.email}
                                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                    className={inputCls}
                                    data-testid="auth-email"
                                />
                            </div>
                            <div className="relative">
                                <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    placeholder={isSignup ? "At least 8 characters" : "Password"}
                                    value={form.password}
                                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                                    className={inputCls}
                                    data-testid="auth-password"
                                />
                            </div>
                            <button type="submit" disabled={busy} className="btn-primary w-full mt-2 disabled:opacity-70" data-testid="auth-submit">
                                {busy ? "…" : (isSignup ? "Create account" : "Sign in")}
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </form>

                        <p className="mt-6 text-sm text-zinc-400 text-center">
                            {isSignup ? (
                                <>Already have an account? <Link to="/login" className="text-teal-300 hover:text-teal-200 font-medium" data-testid="auth-switch-login">Sign in</Link></>
                            ) : (
                                <>
                                    New to Backendly? <Link to="/signup" className="text-teal-300 hover:text-teal-200 font-medium" data-testid="auth-switch-signup">Create an account</Link>
                                    <br />
                                    <Link to="/forgot-password" className="text-zinc-400 hover:text-teal-200 text-xs mt-2 inline-block" data-testid="auth-forgot-link">
                                        Forgot your password?
                                    </Link>
                                </>
                            )}
                        </p>
                    </div>

                    <p className="mt-6 text-center text-xs text-zinc-500">
                        By continuing you agree to our <a href="#" className="underline underline-offset-4 hover:text-zinc-300">Terms</a> and <a href="#" className="underline underline-offset-4 hover:text-zinc-300">Privacy</a>.
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
