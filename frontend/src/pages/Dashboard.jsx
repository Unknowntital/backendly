import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    Plus, Database, LogOut, Copy, Check, Terminal, ChevronDown, Trash2, Search
} from "lucide-react";
import { API, useAuth } from "@/contexts/AuthContext";

const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-south-1", "ap-southeast-1"];

function Sidebar({ user, onLogout }) {
    return (
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-white/[0.06] bg-white/[0.015] p-5">
            <Link to="/" className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg border border-teal-400/40 bg-black/40 flex items-center justify-center font-mono text-teal-300 text-sm font-bold">{"{}"}</div>
                <span className="font-display font-bold text-lg tracking-tight text-white">Backendly</span>
            </Link>
            <nav className="mt-8 space-y-1 text-sm" aria-label="Dashboard nav">
                {[
                    { label: "Projects", icon: Database, active: true },
                    { label: "Team", icon: Terminal },
                    { label: "Usage", icon: Search },
                ].map(({ label, icon: Icon, active }) => (
                    <a key={label} href="#" className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${active ? "bg-teal-400/10 text-teal-300 border-l-2 border-teal-400 pl-2" : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"}`}>
                        <Icon className="w-4 h-4" /> {label}
                    </a>
                ))}
            </nav>
            <div className="mt-auto pt-6 border-t border-white/[0.06]">
                <div className="flex items-center gap-3 px-1">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400/30 to-amber-500/20 border border-white/10 flex items-center justify-center text-sm font-semibold text-white">
                        {(user?.name || user?.email || "?").slice(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-sm text-white font-medium truncate">{user?.name}</div>
                        <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
                    </div>
                </div>
                <button
                    onClick={onLogout}
                    className="mt-3 w-full h-9 rounded-md bg-white/[0.03] border border-white/[0.08] text-sm text-zinc-300 hover:text-white hover:border-teal-400/30 inline-flex items-center justify-center gap-2 transition-all"
                    data-testid="dashboard-logout"
                >
                    <LogOut className="w-3.5 h-3.5" /> Sign out
                </button>
            </div>
        </aside>
    );
}

function ProfileMenu({ user, onLogout }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const onClick = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);
    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 h-9 px-2 rounded-lg hover:bg-white/[0.04] transition-colors"
                data-testid="dashboard-profile-btn"
            >
                <div className="h-7 w-7 rounded-full bg-gradient-to-br from-teal-400/30 to-amber-500/20 border border-white/10 flex items-center justify-center text-xs font-semibold text-white">
                    {(user?.name || user?.email || "?").slice(0, 1).toUpperCase()}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl bg-[#0A0C10]/95 backdrop-blur-2xl border border-white/[0.08] shadow-2xl p-2 z-40" data-testid="dashboard-profile-menu">
                    <div className="px-3 py-2 border-b border-white/[0.06]">
                        <div className="text-sm font-medium text-white truncate">{user?.name}</div>
                        <div className="text-xs text-zinc-500 truncate">{user?.email}</div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="mt-1 w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-white hover:bg-white/[0.05] rounded-md flex items-center gap-2"
                        data-testid="dashboard-profile-logout"
                    >
                        <LogOut className="w-3.5 h-3.5" /> Sign out
                    </button>
                </div>
            )}
        </div>
    );
}

function NewProjectModal({ open, onClose, onCreated }) {
    const [name, setName] = useState("");
    const [region, setRegion] = useState(REGIONS[0]);
    const [busy, setBusy] = useState(false);
    if (!open) return null;
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await axios.post(`${API}/projects`, { name, region });
            onCreated(data);
            onClose();
            setName("");
            toast.success("Project created.");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not create project.");
        } finally {
            setBusy(false);
        }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
            <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={submit}
                className="w-full max-w-md rounded-[20px] bg-[#0A0C10] border border-white/[0.08] p-6 shadow-2xl"
                data-testid="new-project-modal"
            >
                <h3 className="font-display font-bold text-xl text-white">New project</h3>
                <p className="mt-1 text-sm text-zinc-400">Provision a Postgres project in seconds.</p>
                <div className="mt-6 space-y-3">
                    <div>
                        <label className="text-xs font-medium text-zinc-300">Project name</label>
                        <input required minLength={1} value={name} onChange={(e) => setName(e.target.value)} placeholder="my-side-project" className="mt-1.5 w-full h-11 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20" data-testid="new-project-name" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-300">Region</label>
                        <select value={region} onChange={(e) => setRegion(e.target.value)} className="mt-1.5 w-full h-11 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20" data-testid="new-project-region">
                            {REGIONS.map((r) => <option key={r} value={r} className="bg-[#0A0C10]">{r}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                    <button type="button" onClick={onClose} className="btn-ghost h-10 px-4">Cancel</button>
                    <button type="submit" disabled={busy} className="btn-primary disabled:opacity-70" data-testid="new-project-submit">{busy ? "Creating…" : "Create project"}</button>
                </div>
            </motion.form>
        </div>
    );
}

function ProjectCard({ p, onDelete }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(p.project_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] p-5 hover:bg-white/[0.06] hover:border-teal-400/30 transition-all"
            data-testid={`project-card-${p.project_id}`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-md bg-teal-400/10 border border-teal-400/30 text-teal-300 flex items-center justify-center">
                            <Database className="w-4 h-4" />
                        </div>
                        <h3 className="font-display font-semibold text-white truncate">{p.name}</h3>
                    </div>
                </div>
                <button onClick={() => onDelete(p.project_id)} aria-label="Delete project" className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-red-300 hover:border-red-400/30" data-testid={`project-delete-${p.project_id}`}>
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
            <div className="mt-4 space-y-2 text-xs text-zinc-400">
                <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Project ID</span>
                    <button onClick={copy} className="font-mono text-teal-300 hover:text-teal-200 inline-flex items-center gap-1">
                        {p.project_id} {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Region</span>
                    <span className="font-mono">{p.region}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Status</span>
                    <span className="inline-flex items-center gap-1.5 text-teal-300"><span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse" /> Ready</span>
                </div>
            </div>
        </motion.div>
    );
}

export default function Dashboard() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    useEffect(() => { document.title = "Dashboard · Backendly"; }, []);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/projects`);
            setProjects(data);
        } catch {} finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleLogout = async () => {
        await logout();
        toast.success("Signed out.");
        navigate("/", { replace: true });
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API}/projects/${id}`);
            setProjects((ps) => ps.filter((p) => p.project_id !== id));
            toast.success("Project deleted.");
        } catch (err) {
            toast.error("Could not delete project.");
        }
    };

    return (
        <div className="min-h-screen bg-[#08090C] text-white flex" data-testid="dashboard-page">
            <Sidebar user={user} onLogout={handleLogout} />

            <div className="flex-1 flex flex-col min-w-0">
                <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08090C]/80 backdrop-blur-xl">
                    <div className="flex items-center justify-between px-6 md:px-8 h-16">
                        <div>
                            <div className="text-xs text-zinc-500 font-mono">Personal</div>
                            <div className="text-sm text-white font-medium">Projects</div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setModal(true)} className="btn-primary h-9 px-4" data-testid="dashboard-new-project">
                                <Plus className="w-4 h-4" /> New project
                            </button>
                            <ProfileMenu user={user} onLogout={handleLogout} />
                        </div>
                    </div>
                </header>

                <main className="flex-1 px-6 md:px-8 py-8">
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {[0, 1, 2].map((i) => (
                                <div key={i} className="h-40 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />
                            ))}
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="mt-16 max-w-md mx-auto text-center" data-testid="dashboard-empty">
                            <div className="mx-auto h-14 w-14 rounded-2xl bg-teal-400/10 border border-teal-400/30 flex items-center justify-center">
                                <Database className="w-6 h-6 text-teal-300" />
                            </div>
                            <h2 className="mt-5 font-display font-bold text-2xl text-white">Your first project starts here.</h2>
                            <p className="mt-2 text-sm text-zinc-400">Spin up a Postgres project, wire your app to it, and start shipping — all in under two minutes.</p>
                            <button onClick={() => setModal(true)} className="mt-6 btn-primary">
                                <Plus className="w-4 h-4" /> Create your first project
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="dashboard-projects-grid">
                            {projects.map((p) => (
                                <ProjectCard key={p.project_id} p={p} onDelete={handleDelete} />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <NewProjectModal
                open={modal}
                onClose={() => setModal(false)}
                onCreated={(p) => setProjects((ps) => [p, ...ps])}
            />
        </div>
    );
}
