import { useEffect, useMemo, useState } from "react";
import { useOutletContext, useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
    ArrowLeft, Plus, Trash2, Copy, Check, Database, Key,
    BarChart3, Eye, EyeOff, Code, AlertTriangle, X
} from "lucide-react";
import { API } from "@/contexts/AuthContext";
import RealtimeTab from "../../components/sections/RealtimeTab";

const FIELD_TYPES = ["string", "integer", "float", "boolean", "datetime", "json"];
const TABS = ["Tables", "Realtime", "API Keys", "Usage", "API"];

function Tabs({ active, onChange }) {
    return (
        <div className="flex items-center gap-1 border-b border-white/[0.06]" role="tablist">
            {TABS.map((t) => (
                <button
                    key={t}
                    role="tab"
                    aria-selected={active === t}
                    onClick={() => onChange(t)}
                    className={`relative h-11 px-4 text-sm font-medium transition-colors ${
                        active === t ? "text-white" : "text-zinc-500 hover:text-zinc-200"
                    }`}
                    data-testid={`project-tab-${t.toLowerCase().replace(/\s+/g, '-')}`}
                >
                    {t}
                    {active === t && (
                        <span className="absolute bottom-[-1px] left-3 right-3 h-[2px] bg-teal-400 rounded-full" />
                    )}
                </button>
            ))}
        </div>
    );
}

/* ------------------- TABLES TAB ------------------- */
function NewTableModal({ projectId, open, onClose, onCreated }) {
    const [name, setName] = useState("");
    const [fields, setFields] = useState([{ name: "", type: "string", required: false, default: "" }]);
    const [busy, setBusy] = useState(false);
    if (!open) return null;

    const update = (i, k, v) => setFields((fs) => fs.map((f, idx) => idx === i ? { ...f, [k]: v } : f));
    const addField = () => setFields((fs) => [...fs, { name: "", type: "string", required: false, default: "" }]);
    const removeField = (i) => setFields((fs) => fs.filter((_, idx) => idx !== i));

    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const cleaned = fields
                .filter((f) => f.name.trim())
                .map((f) => ({
                    name: f.name.trim(),
                    type: f.type,
                    required: !!f.required,
                    default: f.default === "" ? null : f.default,
                }));
            const { data } = await axios.post(`${API}/projects/${projectId}/tables`, { name: name.trim(), fields: cleaned });
            onCreated(data);
            setName("");
            setFields([{ name: "", type: "string", required: false, default: "" }]);
            onClose();
            toast.success(`Table '${data.name}' created.`);
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not create table.");
        } finally { setBusy(false); }
    };

    const inputCls = "h-10 px-3 rounded-md bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20 transition-all";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
            <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={submit}
                className="w-full max-w-2xl rounded-[20px] bg-[#0A0C10] border border-white/[0.08] p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
                data-testid="new-table-modal"
            >
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-display font-bold text-xl text-white">New table</h3>
                        <p className="mt-1 text-sm text-zinc-400">Backendly will generate REST endpoints for this table automatically.</p>
                    </div>
                    <button type="button" onClick={onClose} className="h-8 w-8 rounded-md hover:bg-white/[0.05] flex items-center justify-center text-zinc-400"><X className="w-4 h-4" /></button>
                </div>

                <div className="mt-6">
                    <label className="text-xs font-medium text-zinc-300">Table name</label>
                    <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="orders" className={`mt-1.5 w-full ${inputCls}`} pattern="[a-z][a-z0-9_]*" data-testid="new-table-name" />
                    <p className="mt-1 text-[11px] text-zinc-500 font-mono">lowercase, letters/digits/underscores, starts with a letter</p>
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-xs font-medium text-zinc-300">Fields</label>
                        <button type="button" onClick={addField} className="text-xs text-teal-300 hover:text-teal-200 inline-flex items-center gap-1" data-testid="new-table-add-field">
                            <Plus className="w-3.5 h-3.5" /> Add field
                        </button>
                    </div>
                    <div className="space-y-2" data-testid="new-table-fields">
                        {fields.map((f, i) => (
                            <div key={i} className="grid grid-cols-[1.4fr_1fr_auto_1fr_auto] gap-2 items-center">
                                <input value={f.name} onChange={(e) => update(i, "name", e.target.value)} placeholder="field_name" className={inputCls} pattern="[a-z][a-z0-9_]*" data-testid={`new-field-name-${i}`} />
                                <select value={f.type} onChange={(e) => update(i, "type", e.target.value)} className={inputCls} data-testid={`new-field-type-${i}`}>
                                    {FIELD_TYPES.map((t) => <option key={t} value={t} className="bg-[#0A0C10]">{t}</option>)}
                                </select>
                                <label className="inline-flex items-center gap-1.5 text-xs text-zinc-400 h-10 px-3 rounded-md bg-white/[0.03] border border-white/[0.08] cursor-pointer whitespace-nowrap">
                                    <input type="checkbox" checked={f.required} onChange={(e) => update(i, "required", e.target.checked)} className="accent-teal-400" />
                                    required
                                </label>
                                <input value={f.default} onChange={(e) => update(i, "default", e.target.value)} placeholder="default (optional)" className={inputCls} />
                                <button type="button" onClick={() => removeField(i)} aria-label="Remove field" className="h-10 w-10 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-red-300 hover:border-red-400/30">
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 flex gap-3 justify-end">
                    <button type="button" onClick={onClose} className="btn-ghost h-10 px-4">Cancel</button>
                    <button type="submit" disabled={busy} className="btn-primary disabled:opacity-70" data-testid="new-table-submit">
                        {busy ? "Creating…" : "Create table"}
                    </button>
                </div>
            </motion.form>
        </div>
    );
}

function TablesTab({ project, tables, onReload }) {
    const [modal, setModal] = useState(false);
    const remove = async (t) => {
        if (!window.confirm(`Delete table '${t.name}' and all its records?`)) return;
        try {
            await axios.delete(`${API}/projects/${project.project_id}/tables/${t.table_id}`);
            toast.success("Table deleted.");
            onReload();
        } catch (err) { toast.error(err?.response?.data?.detail || "Could not delete table."); }
    };
    return (
        <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="font-display font-semibold text-lg text-white">Schema</h2>
                    <p className="text-sm text-zinc-400">Define tables and Backendly generates REST endpoints for them.</p>
                </div>
                <button onClick={() => setModal(true)} className="btn-primary h-9 px-4" data-testid="new-table-btn">
                    <Plus className="w-4 h-4" /> New table
                </button>
            </div>

            {tables.length === 0 ? (
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-10 text-center" data-testid="tables-empty">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-teal-400/10 border border-teal-400/30 flex items-center justify-center">
                        <Database className="w-5 h-5 text-teal-300" />
                    </div>
                    <h3 className="mt-4 font-display font-bold text-lg text-white">No tables yet.</h3>
                    <p className="mt-1 text-sm text-zinc-400">Create your first table — you'll get instant REST endpoints for it.</p>
                    <button onClick={() => setModal(true)} className="btn-primary mt-5"><Plus className="w-4 h-4" /> Create your first table</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tables.map((t) => (
                        <div key={t.table_id} className="group rounded-xl bg-white/[0.03] border border-white/[0.08] p-5 hover:border-teal-400/30 transition-all" data-testid={`table-card-${t.name}`}>
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <Database className="w-4 h-4 text-teal-300" />
                                        <h3 className="font-mono font-semibold text-white">{t.name}</h3>
                                    </div>
                                    <p className="text-xs text-zinc-500 mt-1">{t.fields.length} field{t.fields.length !== 1 ? "s" : ""}</p>
                                </div>
                                <button onClick={() => remove(t)} aria-label="Delete table" className="opacity-0 group-hover:opacity-100 h-8 w-8 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-red-300 hover:border-red-400/30 transition-all" data-testid={`table-delete-${t.name}`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="mt-4 rounded-md bg-black/40 border border-white/[0.06] p-3 space-y-1.5 font-mono text-xs">
                                {t.fields.map((f) => (
                                    <div key={f.name} className="flex items-center justify-between">
                                        <span className="text-white">{f.name}</span>
                                        <div className="flex items-center gap-2 text-[11px]">
                                            <span className="text-teal-300">{f.type}</span>
                                            {f.required && <span className="text-amber-300">required</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <NewTableModal projectId={project.project_id} open={modal} onClose={() => setModal(false)} onCreated={() => onReload()} />
        </div>
    );
}

/* ------------------- API KEYS TAB ------------------- */
function CreatedKeyBanner({ created, onDismiss }) {
    const [copied, setCopied] = useState(false);
    if (!created) return null;
    const copy = async () => {
        await navigator.clipboard.writeText(created.key);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
    };
    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-amber-500/[0.08] border border-amber-500/30 p-5 mb-6"
            data-testid="created-key-banner"
        >
            <div className="flex items-start gap-3">
                <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 flex-none" />
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-amber-100">Copy this key now — you won't see it again.</h4>
                    <p className="mt-1 text-xs text-amber-200/70">Store it in a secret manager. If you lose it, revoke and create a new one.</p>
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-black/50 border border-white/[0.08] p-3 font-mono text-sm text-teal-300 break-all">
                        <span className="flex-1">{created.key}</span>
                        <button onClick={copy} className="flex-none h-8 px-3 rounded-md bg-amber-500 text-black text-xs font-semibold inline-flex items-center gap-1 hover:bg-amber-400" data-testid="copy-created-key">
                            {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                        </button>
                    </div>
                </div>
                <button onClick={onDismiss} aria-label="Dismiss" className="h-7 w-7 rounded-md hover:bg-white/[0.05] flex items-center justify-center text-zinc-400"><X className="w-3.5 h-3.5" /></button>
            </div>
        </motion.div>
    );
}

function ApiKeysTab({ project }) {
    const [keys, setKeys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [name, setName] = useState("");
    const [created, setCreated] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/projects/${project.project_id}/api-keys`);
            setKeys(data);
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [project.project_id]);

    const create = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setCreating(true);
        try {
            const { data } = await axios.post(`${API}/projects/${project.project_id}/api-keys`, { name: name.trim() });
            setCreated(data);
            setName("");
            load();
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not create key.");
        } finally { setCreating(false); }
    };

    const revoke = async (k) => {
        if (!window.confirm(`Revoke '${k.name}'? This immediately breaks any client using it.`)) return;
        try {
            await axios.delete(`${API}/projects/${project.project_id}/api-keys/${k.key_id}`);
            toast.success("API key revoked.");
            load();
        } catch { toast.error("Could not revoke."); }
    };

    return (
        <div className="mt-6">
            <CreatedKeyBanner created={created} onDismiss={() => setCreated(null)} />

            <div className="flex items-end justify-between mb-4 gap-4">
                <div>
                    <h2 className="font-display font-semibold text-lg text-white">API keys</h2>
                    <p className="text-sm text-zinc-400">One key = one project. Send it as an <code className="font-mono text-teal-300">X-API-Key</code> header.</p>
                </div>
                <form onSubmit={create} className="flex gap-2" data-testid="create-key-form">
                    <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Production" className="h-9 px-3 rounded-md bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20" data-testid="create-key-name" />
                    <button type="submit" disabled={creating} className="btn-primary h-9 px-4 disabled:opacity-70" data-testid="create-key-submit"><Plus className="w-4 h-4" /> Create key</button>
                </form>
            </div>

            <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
                {loading ? (
                    <div className="p-6 space-y-3">{[0, 1].map((i) => <div key={i} className="h-12 bg-white/[0.02] rounded-md animate-pulse" />)}</div>
                ) : keys.length === 0 ? (
                    <div className="p-8 text-center text-sm text-zinc-500">No API keys yet. Create one to start hitting <span className="font-mono text-teal-300">/api/v1/*</span>.</div>
                ) : (
                    <ul className="divide-y divide-white/[0.06]" data-testid="api-keys-list">
                        {keys.map((k) => (
                            <li key={k.key_id} className="flex items-center gap-4 px-5 py-4" data-testid={`api-key-row-${k.key_id}`}>
                                <div className="h-9 w-9 rounded-md bg-teal-400/10 border border-teal-400/30 text-teal-300 flex items-center justify-center"><Key className="w-4 h-4" /></div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm text-white font-medium truncate">{k.name}</div>
                                    <div className="text-xs text-zinc-500 font-mono truncate">{k.prefix}••••••••{k.last4}</div>
                                </div>
                                <div className="text-xs text-zinc-500 hidden md:block">
                                    {k.last_used_at ? `Last used ${new Date(k.last_used_at).toLocaleString()}` : "Never used"}
                                </div>
                                <button onClick={() => revoke(k)} aria-label="Revoke key" className="h-8 w-8 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-red-300 hover:border-red-400/30" data-testid={`revoke-key-${k.key_id}`}>
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

/* ------------------- USAGE TAB ------------------- */
function ProjectUsageTab({ project }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        (async () => {
            try {
                const { data } = await axios.get(`${API}/projects/${project.project_id}/usage`);
                setData(data);
            } finally { setLoading(false); }
        })();
    }, [project.project_id]);

    const formatValue = (v, unit) => {
        if (unit === "GB") return `${v.toLocaleString()} GB`;
        if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
        if (v >= 1_000) return `${(v / 1_000).toFixed(1)}k`;
        return v.toLocaleString();
    };

    return (
        <div className="mt-6">
            <div className="mb-4">
                <h2 className="font-display font-semibold text-lg text-white">Usage</h2>
                <p className="text-sm text-zinc-400">Real request counts. Live from your API v1 endpoints.</p>
            </div>
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">{[0, 1, 2, 3].map((i) => <div key={i} className="h-32 rounded-xl bg-white/[0.02] border border-white/[0.06] animate-pulse" />)}</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5" data-testid="project-usage-grid">
                    {data.metrics.map((m) => {
                        const percent = m.limit ? Math.min(100, Math.round((m.value / m.limit) * 1000) / 10) : 0;
                        return (
                            <div key={m.label} className="rounded-xl bg-white/[0.03] border border-white/[0.08] p-5" data-testid={`project-metric-${m.label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                                <span className="text-xs font-medium uppercase tracking-widest text-zinc-500">{m.label}</span>
                                <div className="mt-2 flex items-baseline gap-2">
                                    <span className="font-display font-bold text-3xl text-white tracking-tight">{formatValue(m.value, m.unit)}</span>
                                    <span className="text-xs text-zinc-500 font-mono">/ {m.limit ? formatValue(m.limit, m.unit) : "—"}</span>
                                </div>
                                <div className="mt-3 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                                    <div className="h-full bg-teal-400 rounded-full" style={{ width: `${percent}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/* ------------------- API DOCS TAB ------------------- */
function ApiTab({ project, tables }) {
    const [copied, setCopied] = useState("");
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const sampleTable = tables[0]?.name || "your_table";
    const copy = async (text, id) => {
        await navigator.clipboard.writeText(text);
        setCopied(id);
        setTimeout(() => setCopied(""), 1200);
    };
    const cmd = (s) => (
        <div className="relative rounded-lg bg-black/60 border border-white/[0.08] p-4 font-mono text-[13px] text-zinc-300 overflow-x-auto group">
            <button onClick={() => copy(s, s)} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 h-7 px-2 rounded-md bg-white/[0.05] text-xs text-zinc-300 inline-flex items-center gap-1">
                {copied === s ? <Check className="w-3 h-3 text-teal-300" /> : <Copy className="w-3 h-3" />}
            </button>
            <pre className="whitespace-pre-wrap"><code>{s}</code></pre>
        </div>
    );
    return (
        <div className="mt-6 max-w-3xl">
            <h2 className="font-display font-semibold text-lg text-white">Your API</h2>
            <p className="mt-1 text-sm text-zinc-400">Copy-pasteable examples using your project's API key. Replace <code className="font-mono text-teal-300">$BKL_KEY</code> with a real key from the API Keys tab.</p>

            <h3 className="mt-6 font-display text-base font-semibold text-white">Base URL</h3>
            <div className="mt-2">{cmd(`${backendUrl}/api/v1`)}</div>

            <h3 className="mt-6 font-display text-base font-semibold text-white">List records</h3>
            <div className="mt-2">{cmd(`curl "${backendUrl}/api/v1/${sampleTable}" \\
  -H "X-API-Key: $BKL_KEY"`)}</div>

            <h3 className="mt-6 font-display text-base font-semibold text-white">Create a record</h3>
            <div className="mt-2">{cmd(`curl -X POST "${backendUrl}/api/v1/${sampleTable}" \\
  -H "X-API-Key: $BKL_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{ "your": "data" }'`)}</div>

            <h3 className="mt-6 font-display text-base font-semibold text-white">Update / Delete</h3>
            <div className="mt-2 space-y-3">
                {cmd(`curl -X PATCH "${backendUrl}/api/v1/${sampleTable}/<record_id>" \\
  -H "X-API-Key: $BKL_KEY" -H "Content-Type: application/json" \\
  -d '{ "field": "new value" }'`)}
                {cmd(`curl -X DELETE "${backendUrl}/api/v1/${sampleTable}/<record_id>" \\
  -H "X-API-Key: $BKL_KEY"`)}
            </div>

            <h3 className="mt-6 font-display text-base font-semibold text-white">JavaScript / fetch</h3>
            <div className="mt-2">{cmd(`const res = await fetch("${backendUrl}/api/v1/${sampleTable}", {
  headers: { "X-API-Key": process.env.BKL_KEY },
});
const { data } = await res.json();`)}</div>
        </div>
    );
}

/* ------------------- PAGE ------------------- */
export default function ProjectDetail() {
    const { projectId } = useParams();
    const { profileMenu } = useOutletContext();
    const [project, setProject] = useState(null);
    const [tables, setTables] = useState([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState("Tables");
    const navigate = useNavigate();

    const load = async () => {
        try {
            const [p, t] = await Promise.all([
                axios.get(`${API}/projects/${projectId}`),
                axios.get(`${API}/projects/${projectId}/tables`),
            ]);
            setProject(p.data);
            setTables(t.data);
        } catch (err) {
            if (err?.response?.status === 404) {
                toast.error("Project not found.");
                navigate("/dashboard", { replace: true });
            }
        } finally { setLoading(false); }
    };
    useEffect(() => { load(); /* eslint-disable-next-line */ }, [projectId]);

    if (loading || !project) {
        return (
            <main className="flex-1 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-2 border-teal-400/30 border-t-teal-400 animate-spin" />
            </main>
        );
    }

    return (
        <>
            <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08090C]/80 backdrop-blur-xl">
                <div className="flex items-center justify-between px-6 md:px-8 h-16">
                    <div className="flex items-center gap-3 min-w-0">
                        <Link to="/dashboard" className="h-8 w-8 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-white hover:border-teal-400/30" aria-label="Back to projects" data-testid="back-to-projects">
                            <ArrowLeft className="w-4 h-4" />
                        </Link>
                        <div className="min-w-0">
                            <div className="text-xs text-zinc-500 font-mono truncate">{project.project_id} · {project.region}</div>
                            <div className="text-sm text-white font-medium truncate" data-testid="project-name">{project.name}</div>
                        </div>
                    </div>
                    {profileMenu}
                </div>
                <div className="px-6 md:px-8">
                    <Tabs active={tab} onChange={setTab} />
                </div>
            </header>

            <main className="flex-1 px-6 md:px-8 py-8">
                {tab === "Tables" && <TablesTab project={project} tables={tables} onReload={load} />}
                {tab === "Realtime" && <RealtimeTab project={project} />}
                {tab === "API Keys" && <ApiKeysTab project={project} />}
                {tab === "Usage" && <ProjectUsageTab project={project} />}
                {tab === "API" && <ApiTab project={project} tables={tables} />}
            </main>
        </>
    );
}
