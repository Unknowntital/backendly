import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import axios from "axios";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { UserPlus, Trash2, Shield, Users } from "lucide-react";
import { API } from "@/contexts/AuthContext";

const ROLES = ["member", "admin"];

function InviteModal({ open, onClose, onInvited }) {
    const [email, setEmail] = useState("");
    const [role, setRole] = useState("member");
    const [busy, setBusy] = useState(false);
    if (!open) return null;
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const { data } = await axios.post(`${API}/team/invite`, { email, role });
            onInvited(data);
            setEmail("");
            onClose();
            toast.success(`Invitation sent to ${email}.`);
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not send invite.");
        } finally { setBusy(false); }
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
            <motion.form
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                onSubmit={submit}
                className="w-full max-w-md rounded-[20px] bg-[#0A0C10] border border-white/[0.08] p-6 shadow-2xl"
                data-testid="invite-modal"
            >
                <h3 className="font-display font-bold text-xl text-white">Invite a teammate</h3>
                <p className="mt-1 text-sm text-zinc-400">They'll get an email with a link to join your workspace.</p>
                <div className="mt-6 space-y-3">
                    <div>
                        <label className="text-xs font-medium text-zinc-300">Email</label>
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.dev" className="mt-1.5 w-full h-11 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20" data-testid="invite-email" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-zinc-300">Role</label>
                        <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 w-full h-11 px-3 rounded-lg bg-white/[0.03] border border-white/[0.08] text-sm text-white focus:outline-none focus:border-teal-400/60 focus:ring-2 focus:ring-teal-400/20" data-testid="invite-role">
                            {ROLES.map((r) => <option key={r} value={r} className="bg-[#0A0C10]">{r}</option>)}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex gap-3 justify-end">
                    <button type="button" onClick={onClose} className="btn-ghost h-10 px-4">Cancel</button>
                    <button type="submit" disabled={busy} className="btn-primary disabled:opacity-70" data-testid="invite-submit">{busy ? "Sending…" : "Send invite"}</button>
                </div>
            </motion.form>
        </div>
    );
}

function RoleBadge({ role }) {
    const cls = role === "owner"
        ? "bg-amber-400/15 border-amber-400/40 text-amber-300"
        : role === "admin"
        ? "bg-teal-400/15 border-teal-400/40 text-teal-300"
        : "bg-white/[0.05] border-white/[0.1] text-zinc-300";
    return (
        <span className={`inline-flex items-center gap-1 h-6 px-2 rounded-md border text-[11px] font-medium uppercase tracking-wider ${cls}`}>
            {role === "owner" && <Shield className="w-3 h-3" />} {role}
        </span>
    );
}

export default function TeamView() {
    const { profileMenu } = useOutletContext();
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modal, setModal] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`${API}/team/members`);
            setMembers(data);
        } catch {} finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const remove = async (id) => {
        try {
            await axios.delete(`${API}/team/members/${id}`);
            setMembers((m) => m.filter((x) => x.member_id !== id));
            toast.success("Member removed.");
        } catch (err) {
            toast.error(err?.response?.data?.detail || "Could not remove member.");
        }
    };

    return (
        <>
            <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#08090C]/80 backdrop-blur-xl">
                <div className="flex items-center justify-between px-6 md:px-8 h-16">
                    <div>
                        <div className="text-xs text-zinc-500 font-mono">Personal</div>
                        <div className="text-sm text-white font-medium">Team</div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setModal(true)} className="btn-primary h-9 px-4" data-testid="team-invite-btn">
                            <UserPlus className="w-4 h-4" /> Invite member
                        </button>
                        {profileMenu}
                    </div>
                </div>
            </header>

            <main className="flex-1 px-6 md:px-8 py-8">
                <div className="max-w-4xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-9 w-9 rounded-lg bg-teal-400/10 border border-teal-400/30 text-teal-300 flex items-center justify-center">
                            <Users className="w-4 h-4" />
                        </div>
                        <div>
                            <h1 className="font-display font-bold text-2xl text-white">Team members</h1>
                            <p className="text-sm text-zinc-400">Invite teammates and manage roles for your workspace.</p>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] overflow-hidden" data-testid="team-list">
                        {loading ? (
                            <div className="p-6 space-y-3">
                                {[0, 1, 2].map((i) => <div key={i} className="h-12 bg-white/[0.02] rounded-md animate-pulse" />)}
                            </div>
                        ) : (
                            <ul className="divide-y divide-white/[0.06]">
                                {members.map((m) => (
                                    <li key={m.member_id} className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02]" data-testid={`team-row-${m.member_id}`}>
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400/30 to-amber-500/20 border border-white/10 flex items-center justify-center text-sm font-semibold text-white">
                                            {m.name.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm text-white font-medium truncate">{m.name}</div>
                                            <div className="text-xs text-zinc-500 truncate">{m.email}</div>
                                        </div>
                                        <RoleBadge role={m.role} />
                                        <span className={`text-[11px] font-medium uppercase tracking-wider ${m.status === "active" ? "text-teal-300" : "text-amber-300"}`}>
                                            {m.status}
                                        </span>
                                        {m.role !== "owner" ? (
                                            <button
                                                onClick={() => remove(m.member_id)}
                                                aria-label={`Remove ${m.name}`}
                                                className="h-8 w-8 rounded-md bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-zinc-400 hover:text-red-300 hover:border-red-400/30 transition-colors"
                                                data-testid={`team-remove-${m.member_id}`}
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        ) : (
                                            <div className="w-8" />
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </main>

            <InviteModal
                open={modal}
                onClose={() => setModal(false)}
                onInvited={(m) => setMembers((prev) => [...prev, m])}
            />
        </>
    );
}
