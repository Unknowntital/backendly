import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/contexts/AuthContext";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [busy, setBusy] = useState(false);
    const [sent, setSent] = useState(false);

    useEffect(() => { document.title = "Reset password · Backendly"; }, []);

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await axios.post(`${API}/auth/forgot-password`, { email });
            setSent(true);
        } catch (err) {
            toast.error("Something went wrong. Please try again.");
        } finally { setBusy(false); }
    };

    const inputCls = "w-full h-11 pl-10 pr-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 transition-all";

    return (
        <div className="min-h-screen bg-[#08090C] text-white flex flex-col overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 -left-24 w-[520px] h-[520px] rounded-full bg-teal-500/[0.14] blur-[130px]" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-amber-500/[0.08] blur-[130px]" />
            </div>
            <header className="relative container-x pt-6">
                <Link to="/" className="inline-flex items-center gap-2">
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
                        {sent ? (
                            <div data-testid="forgot-success">
                                <div className="h-12 w-12 rounded-2xl bg-teal-400/10 border border-teal-400/30 flex items-center justify-center">
                                    <CheckCircle2 className="w-6 h-6 text-teal-300" />
                                </div>
                                <h1 className="mt-5 font-display font-bold text-3xl text-white tracking-tight">Check your inbox.</h1>
                                <p className="mt-2 text-sm text-zinc-400 leading-relaxed">
                                    If an account exists for <span className="text-white font-medium">{email}</span>, we've sent a link to reset your password. The link is good for 30 minutes.
                                </p>
                                <Link to="/login" className="btn-primary mt-8 w-full" data-testid="forgot-back-to-login">
                                    Back to sign in <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <>
                                <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight" data-testid="forgot-heading">
                                    Forgot your password?
                                </h1>
                                <p className="mt-2 text-sm text-zinc-400">
                                    No stress. Enter your email and we'll send you a link to set a new one.
                                </p>
                                <form onSubmit={submit} className="mt-8 space-y-3" data-testid="forgot-form">
                                    <div className="relative">
                                        <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="email" required
                                            placeholder="you@company.dev"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className={inputCls}
                                            data-testid="forgot-email"
                                        />
                                    </div>
                                    <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70" data-testid="forgot-submit">
                                        {busy ? "Sending…" : "Send reset link"} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>
                                <p className="mt-6 text-sm text-zinc-400 text-center">
                                    Remembered it? <Link to="/login" className="text-teal-300 hover:text-teal-200 font-medium">Sign in</Link>
                                </p>
                            </>
                        )}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
