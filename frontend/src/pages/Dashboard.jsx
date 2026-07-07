import { useEffect, useState, useRef } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    Database, LogOut, ChevronDown, Users, BarChart3, Home
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
    { to: "/dashboard", label: "Projects", icon: Database, end: true },
    { to: "/dashboard/team", label: "Team", icon: Users },
    { to: "/dashboard/usage", label: "Usage", icon: BarChart3 },
];

function Sidebar({ user, onLogout }) {
    return (
        <aside className="hidden md:flex md:w-64 lg:w-72 flex-col border-r border-white/[0.06] bg-white/[0.015] p-5">
            <Link to="/" className="flex items-center gap-2" data-testid="dashboard-logo">
                <div className="h-8 w-8 rounded-lg border border-teal-400/40 bg-black/40 flex items-center justify-center font-mono text-teal-300 text-sm font-bold">{"{}"}</div>
                <span className="font-display font-bold text-lg tracking-tight text-white">Backendly</span>
            </Link>
            <nav className="mt-8 space-y-1 text-sm" aria-label="Dashboard nav">
                {NAV.map(({ to, label, icon: Icon, end }) => (
                    <NavLink
                        key={to}
                        to={to}
                        end={end}
                        className={({ isActive }) =>
                            `flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors ${
                                isActive
                                    ? "bg-teal-400/10 text-teal-300 border-l-2 border-teal-400 pl-2"
                                    : "text-zinc-400 hover:text-white hover:bg-white/[0.03]"
                            }`
                        }
                        data-testid={`sidebar-link-${label.toLowerCase()}`}
                    >
                        <Icon className="w-4 h-4" /> {label}
                    </NavLink>
                ))}
                <Link to="/" className="flex items-center gap-2.5 px-3 py-2 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] transition-colors text-sm">
                    <Home className="w-4 h-4" /> Back to site
                </Link>
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

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    useEffect(() => { document.title = "Dashboard · Backendly"; }, []);

    const handleLogout = async () => {
        await logout();
        toast.success("Signed out.");
        navigate("/", { replace: true });
    };

    return (
        <div className="min-h-screen bg-[#08090C] text-white flex" data-testid="dashboard-page">
            <Sidebar user={user} onLogout={handleLogout} />
            <div className="flex-1 flex flex-col min-w-0">
                <Outlet context={{ user, profileMenu: <ProfileMenu user={user} onLogout={handleLogout} /> }} />
            </div>
        </div>
    );
}
