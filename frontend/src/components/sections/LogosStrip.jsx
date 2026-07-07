import Marquee from "react-fast-marquee";
import {
    SiVercel, SiSupabase, SiRailway, SiCloudflare, SiLinear,
    SiNotion, SiFramer, SiFigma, SiPrisma, SiTailwindcss, SiVite, SiStripe
} from "react-icons/si";

const LOGOS = [
    { Icon: SiVercel, name: "Vercel" },
    { Icon: SiSupabase, name: "Supabase" },
    { Icon: SiRailway, name: "Railway" },
    { Icon: SiCloudflare, name: "Cloudflare" },
    { Icon: SiLinear, name: "Linear" },
    { Icon: SiNotion, name: "Notion" },
    { Icon: SiFramer, name: "Framer" },
    { Icon: SiFigma, name: "Figma" },
    { Icon: SiPrisma, name: "Prisma" },
    { Icon: SiTailwindcss, name: "Tailwind" },
    { Icon: SiVite, name: "Vite" },
    { Icon: SiStripe, name: "Stripe" },
];

export default function LogosStrip() {
    return (
        <section className="py-14 border-y border-white/[0.05]" data-testid="logos-strip">
            <div className="container-x">
                <p className="text-center text-xs font-medium tracking-widest uppercase text-zinc-500">
                    Trusted by developers building the next generation of apps
                </p>
                <div className="mt-8 relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
                    <Marquee gradient={false} speed={30} pauseOnHover>
                        {LOGOS.concat(LOGOS).map(({ Icon, name }, i) => (
                            <div key={i} className="mx-10 flex items-center gap-2 text-zinc-500 hover:text-zinc-200 transition-colors">
                                <Icon className="w-6 h-6" />
                                <span className="font-medium tracking-tight text-sm">{name}</span>
                            </div>
                        ))}
                    </Marquee>
                </div>
            </div>
        </section>
    );
}
