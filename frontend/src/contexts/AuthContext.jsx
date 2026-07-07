import { createContext, useContext, useEffect, useState, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

// Ensure cookies are sent on every request
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = useCallback(async () => {
        try {
            const { data } = await axios.get(`${API}/auth/me`);
            setUser(data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // CRITICAL: If returning from OAuth callback, skip the /me check.
        // AuthCallback will exchange the session_id and establish the session first.
        if (typeof window !== "undefined" && window.location.hash?.includes("session_id=")) {
            setLoading(false);
            return;
        }
        checkAuth();
    }, [checkAuth]);

    const login = async (email, password) => {
        const { data } = await axios.post(`${API}/auth/login`, { email, password });
        setUser(data);
        return data;
    };

    const register = async (email, password, name) => {
        const { data } = await axios.post(`${API}/auth/register`, { email, password, name });
        setUser(data);
        return data;
    };

    const logout = async () => {
        try { await axios.post(`${API}/auth/logout`); } catch {}
        setUser(null);
    };

    const setAuthedUser = (u) => setUser(u);

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, checkAuth, setAuthedUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
