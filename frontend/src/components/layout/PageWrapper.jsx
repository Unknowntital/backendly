import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

export default function PageWrapper({ children, className = "" }) {
    return (
        <div className={`min-h-screen bg-[#08090C] text-white overflow-x-hidden ${className}`}>
            <Navbar />
            <main id="main">{children}</main>
            <Footer />
        </div>
    );
}
