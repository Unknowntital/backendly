import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, ArrowRight, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API, useAuth } from "@/contexts/AuthContext";

export default function ResetPassword() {
    const [params] = useSearchParams();
    const token = params.get("token") || "";
    const navigate = useNavigate();
    const { setAuthedUser } = useAuth();
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);

    useEffect(() => { document.title = "Choose a new password · Backendly"; }, []);

    const submit = async (e) => {
        e.preventDefault();
        if (password.length < 8) return toast.error("Password must be at least 8 characters.");
        if (password !== confirm) return toast.error("Passwords don't match.");
        setBusy(true);
        try {
            const { data } = await axios.post(`${API}/auth/reset-password`, { token, password });
            setAuthedUser(data);
            toast.success("Password reset. You're signed in.");
            navigate("/dashboard", { replace: true });
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not reset password.");
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
                        {!token ? (
                            <div data-testid="reset-missing-token">
                                <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                                    <AlertCircle className="w-6 h-6 text-red-300" />
                                </div>
                                <h1 className="mt-5 font-display font-bold text-3xl text-white tracking-tight">Missing reset link.</h1>
                                <p className="mt-2 text-sm text-zinc-400">This page needs a valid reset token. Please use the link from your email.</p>
                                <Link to="/forgot-password" className="btn-primary mt-8 w-full">Request a new link <ArrowRight className="w-4 h-4" /></Link>
                            </div>
                        ) : (
                            <>
                                <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight" data-testid="reset-heading">
                                    Choose a new password.
                                </h1>
                                <p className="mt-2 text-sm text-zinc-400">At least 8 characters. Use a password manager — we do.</p>
                                <form onSubmit={submit} className="mt-8 space-y-3" data-testid="reset-form">
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input type="password" required minLength={8} placeholder="New password"
                                               value={password} onChange={(e) => setPassword(e.target.value)}
                                               className={inputCls} data-testid="reset-password" />
                                    </div>
                                    <div className="relative">
                                        <Lock className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                        <input type="password" required minLength={8} placeholder="Confirm new password"
                                               value={confirm} onChange={(e) => setConfirm(e.target.value)}
                                               className={inputCls} data-testid="reset-confirm" />
                                    </div>
                                    <button type="submit" disabled={busy} className="btn-primary w-full disabled:opacity-70" data-testid="reset-submit">
                                        {busy ? "Updating…" : "Set new password"} <ArrowRight className="w-4 h-4" />
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </motion.div>
            </main>
        </div>
    );
}
