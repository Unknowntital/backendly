import "@/App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/contexts/AuthContext";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Docs from "@/pages/Docs";
import AuthPage from "@/pages/AuthPage";
import AuthCallback from "@/pages/AuthCallback";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import Dashboard from "@/pages/Dashboard";
import ProjectsView from "@/pages/dashboard/ProjectsView";
import ProjectDetail from "@/pages/dashboard/ProjectDetail";
import TeamView from "@/pages/dashboard/TeamView";
import UsageView from "@/pages/dashboard/UsageView";
import ProtectedRoute from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary";

function AppRouter() {
    const location = useLocation();
    // Detect session_id in URL fragment synchronously (must run BEFORE other routes)
    if (location.hash?.includes("session_id=")) {
        return <AuthCallback />;
    }
    return (
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/login" element={<AuthPage mode="login" />} />
            <Route path="/signup" element={<AuthPage mode="signup" />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            >
                <Route index element={<ProjectsView />} />
                <Route path="projects/:projectId" element={<ProjectDetail />} />
                <Route path="team" element={<TeamView />} />
                <Route path="usage" element={<UsageView />} />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <div className="App min-h-screen bg-[#08090C] text-white antialiased">
            <BrowserRouter>
                <ErrorBoundary>
                <AuthProvider>
                    <AppRouter />
                </AuthProvider>
                </ErrorBoundary>
            </BrowserRouter>
            <Toaster
                theme="dark"
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: "rgba(15, 15, 20, 0.9)",
                        border: "1px solid rgba(45, 212, 191, 0.3)",
                        color: "white",
                        backdropFilter: "blur(20px)",
                    },
                }}
            />
        </div>
    );
}

export default App;
