import { useEffect } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import DocsPreview from "@/components/sections/DocsPreview";
import FinalCTA from "@/components/sections/FinalCTA";

export default function Docs() {
    useEffect(() => { document.title = "Docs · Backendly"; }, []);
    return (
        <PageWrapper>
            <section className="pt-36 md:pt-44 pb-4">
                <div className="container-x max-w-3xl">
                    <div className="inline-flex items-center h-7 px-3 rounded-full glass text-xs font-medium text-teal-300">
                        Documentation
                    </div>
                    <h1 className="mt-5 font-display font-bold text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight text-white">
                        Everything you need to build.
                    </h1>
                    <p className="mt-4 text-lg text-zinc-400 leading-relaxed">
                        Start with the quickstart, then dive into whichever layer you need. Everything is copy-pasteable.
                    </p>
                </div>
            </section>
            <DocsPreview />
            <FinalCTA />
        </PageWrapper>
    );
}
