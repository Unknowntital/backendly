import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/contexts/AuthContext";

// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
export default function AuthCallback() {
    const navigate = useNavigate();
    const { setAuthedUser } = useAuth();
    const processed = useRef(false);

    useEffect(() => {
        if (processed.current) return;
        processed.current = true;

        const hash = window.location.hash || "";
        const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
        const sessionId = params.get("session_id");

        if (!sessionId) {
            navigate("/login", { replace: true });
            return;
        }

        (async () => {
            try {
                const { data } = await axios.post(`${API}/auth/session`, { session_id: sessionId });
                setAuthedUser(data);
                // Clean the hash so refresh doesn't re-trigger the callback
                window.history.replaceState({}, document.title, window.location.pathname);
                navigate("/dashboard", { replace: true, state: { user: data } });
            } catch (e) {
                navigate("/login?error=oauth", { replace: true });
            }
        })();
    }, [navigate, setAuthedUser]);

    return (
        <div className="min-h-screen bg-[#08090C] flex items-center justify-center">
            <div className="text-center">
                <div className="mx-auto h-10 w-10 rounded-full border-2 border-teal-400/30 border-t-teal-400 animate-spin" />
                <p className="mt-4 text-sm text-zinc-400 font-mono">Signing you in…</p>
            </div>
        </div>
    );
}
