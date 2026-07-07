import { useEffect } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import Hero from "@/components/sections/Hero";
import LogosStrip from "@/components/sections/LogosStrip";
import Features from "@/components/sections/Features";
import CodeExamples from "@/components/sections/CodeExamples";
import Integrations from "@/components/sections/Integrations";
import DocsPreview from "@/components/sections/DocsPreview";
import Pricing from "@/components/sections/Pricing";
import Testimonials from "@/components/sections/Testimonials";
import BlogPreview from "@/components/sections/BlogPreview";
import FAQ from "@/components/sections/FAQ";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Home() {
    useEffect(() => {
        document.title = "Backendly · Ship your backend in minutes";
        const meta = (name, content) => {
            let el = document.querySelector(`meta[name="${name}"]`);
            if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
            el.setAttribute("content", content);
        };
        meta("description", "Auth, Postgres, storage, APIs, functions, and realtime — one platform, one SDK, zero DevOps. Free forever.");
    }, []);
    return (
        <PageWrapper>
            <Hero />
            <LogosStrip />
            <Features />
            <CodeExamples />
            <Integrations />
            <DocsPreview />
            <Pricing />
            <Testimonials />
            <BlogPreview />
            <FAQ />
            <FinalCTA />
        </PageWrapper>
    );
}
