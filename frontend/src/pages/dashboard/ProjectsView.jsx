import { useEffect, useState } from "react";
import { useOutletContext, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Plus, Database, Copy, Check, Trash2, ArrowUpRight } from "lucide-react";
import { API } from "@/contexts/AuthContext";

const REGIONS = ["us-east-1", "us-west-2", "eu-west-1", "eu-central-1", "ap-south-1", "ap-southeast-1"];

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
        } finally { setBusy(false); }
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
    const copy = async (e) => {
        e.preventDefault(); e.stopPropagation();
        await navigator.clipboard.writeText(p.project_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:bg-white/[0.06] hover:border-teal-400/30 transition-all"
            data-testid={`project-card-${p.project_id}`}
        >
            <Link to={`/dashboard/projects/${p.project_id}`} className="block p-5" data-testid={`open-project-${p.project_id}`}>
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-md bg-teal-400/10 border border-teal-400/30 text-teal-300 flex items-center justify-center">
                                <Database className="w-4 h-4" />
                            </div>
                            <h3 className="font-display font-semibold text-white truncate">{p.name}</h3>
                        </div>
                    </div>
                    <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-teal-300 transition-colors" />
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
            </Link>
            <button onClick={() => onDelete(p.project_id)} aria-label="Delete project" className="absolute top-4 right-14 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-red-300 hover:border-red-400/30 z-10" data-testid={`project-delete-${p.project_id}`}>
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </motion.div>
    );
}

export default function ProjectsView() {
    const { profileMenu } = useOutletContext();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/projects`);
            setProjects(data);
        } catch {} finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const handleDelete = async (id) => {
        try {
            await axios.delete(`${API}/projects/${id}`);
            setProjects((ps) => ps.filter((p) => p.project_id !== id));
            toast.success("Project deleted.");
        } catch { toast.error("Could not delete project."); }
    };

    return (
        <>
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
                        {profileMenu}
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

            <NewProjectModal
                open={modal}
                onClose={() => setModal(false)}
                onCreated={(p) => setProjects((ps) => [p, ...ps])}
            />
        </>
    );
}
