import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Home from "@/pages/Home";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Docs from "@/pages/Docs";

function App() {
    return (
        <div className="App min-h-screen bg-[#08090C] text-white antialiased">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/docs" element={<Docs />} />
                </Routes>
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
