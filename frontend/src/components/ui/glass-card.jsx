import * as React from "react";
import { cn } from "@/lib/utils";

export const GlassCard = React.forwardRef(({ className, hover = true, glow = false, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            "relative rounded-xl bg-white/[0.04] backdrop-blur-xl border border-white/[0.08]",
            "shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
            hover && "hover:bg-white/[0.06] hover:border-teal-400/30 transition-all duration-300",
            glow && "before:absolute before:inset-0 before:rounded-xl before:pointer-events-none",
            className
        )}
        {...props}
    />
));
GlassCard.displayName = "GlassCard";
