import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp } from "lucide-react";
import { API } from "@/contexts/AuthContext";

function Sparkline({ series, color = "#2DD4BF" }) {
    const { path, area, viewW, viewH } = useMemo(() => {
        const w = 320, h = 60, pad = 4;
        if (!series || series.length === 0) return { path: "", area: "", viewW: w, viewH: h };
        const max = Math.max(...series);
        const min = Math.min(...series);
        const range = Math.max(1, max - min);
        const step = (w - pad * 2) / Math.max(1, series.length - 1);
        const pts = series.map((v, i) => [pad + i * step, h - pad - ((v - min) / range) * (h - pad * 2)]);
        const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
        const a = `${d} L${pts[pts.length - 1][0]},${h} L${pts[0][0]},${h} Z`;
        return { path: d, area: a, viewW: w, viewH: h };
    }, [series]);
    const gid = useMemo(() => `g-${Math.random().toString(36).slice(2, 8)}`, []);
    return (
        <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full h-14 overflow-visible" aria-hidden="true">
            <defs>
                <linearGradient id={gid} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={area} fill={`url(#${gid})`} />
            <path d={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

function pct(value, limit) {
    if (!limit) return 0;
    return Math.min(100, Math.round((value / limit) * 1000) / 10);
}

function formatValue(v, unit) {
    if (unit === "GB") return `${v.toLocaleString()} GB`;
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
    return v.toLocaleString();
}

function MetricCard({ m, i }) {
    const percent = pct(m.value, m.limit);
    const color = i % 2 === 0 ? "#2DD4BF" : "#F59E0B";
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
            className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-5 hover:bg-white/[0.06] hover:border-teal-400/30 transition-all"
            data-testid={`usage-metric-${m.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        >
            <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">{m.label}</span>
                <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
                <span className="font-display font-bold text-3xl text-white tracking-tight">{formatValue(m.value, m.unit)}</span>
                <span className="text-xs text-zinc-500 font-mono">/ {m.limit ? formatValue(m.limit, m.unit) : "—"}</span>
            </div>
            <div className="mt-3">
                <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percent}%`, background: color }} />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-zinc-500 font-mono">
                    <span>{percent}% used</span>
                    <span>this month</span>
                </div>
            </div>
            <div className="mt-4">
                <Sparkline series={m.series} color={color} />
            </div>
        </motion.div>
    );
}

export default function UsageView() {
    const { profileMenu } = useOutletContext();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get(`${API}/usage`);
                setData(data);
            } finally { setLoading(false); }
        })();
    }, []);

    return (
        <>
            <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08090C]/80 backdrop-blur-xl">
                <div className="flex items-center justify-between px-6 md:px-8 h-16">
                    <div>
                        <div className="text-xs text-zinc-500 font-mono">Personal</div>
                        <div className="text-sm text-white font-medium">Usage</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:inline-flex h-9 items-center gap-1.5 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-xs text-zinc-400 font-mono">
                            <span className="h-1.5 w-1.5 rounded-full bg-teal-400" />
                            Live data · updated just now
                        </div>
                        {profileMenu}
                    </div>
                </div>
            </header>

            <main className="flex-1 px-6 md:px-8 py-8">
                <div className="max-w-6xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="h-9 w-9 rounded-lg bg-teal-400/10 border border-teal-400/30 text-teal-300 flex items-center justify-center">
                            <BarChart3 className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-2xl text-white">Usage this month</h1>
                            <p className="text-sm text-zinc-400">
                                {data ? (
                                    <>Period {new Date(data.period_start).toLocaleDateString(undefined, { month: "short", day: "numeric" })} – {new Date(data.period_end).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · all workspaces</>
                                ) : "Loading…"}
                            </p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {[0, 1, 2, 3].map((i) => (
                                <div key={i} className="h-52 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="usage-grid">
                            {data.metrics.map((m, i) => <MetricCard key={m.label} m={m} i={i} />)}
                        </div>
                    )}

                    <div className="mt-8 rounded-xl bg-teal-500/[0.06] border border-teal-500/20 p-5 flex items-start gap-3">
                        <TrendingUp className="w-4 h-4 text-teal-300 mt-0.5" />
                        <div className="text-sm text-teal-100/90 leading-relaxed">
                            <span className="font-semibold">Everything's on the free tier.</span> If you're approaching any limit,
                            we'll email you before you hit it. Need higher limits or dedicated infrastructure?{" "}
                            <a href="/contact" className="underline underline-offset-4 hover:text-teal-200">Contact us</a>.
                        </div>
                    </div>
                </div>
            </main>
        </>
    );
}
