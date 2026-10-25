import React from "react";
import { X } from "lucide-react";

interface HudFrameProps {
  title: string;
  eyebrow?: string;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  accent?: "default" | "gold" | "cyan" | "violet";
}

export function HudFrame({
  title,
  eyebrow,
  onClose,
  children,
  className = "",
  accent = "default",
}: HudFrameProps) {
  const accentClasses = {
    default: "glass-panel-elevated border-white/[0.08]",
    gold: "glass-panel-gold border-[#D4AF37]/35 shadow-[0_0_25px_rgba(212,175,55,0.12)]",
    cyan: "glass-panel border-[#00F0FF]/35 shadow-[0_0_25px_rgba(0,240,255,0.12)]",
    violet: "glass-panel border-[#8B5CF6]/35 shadow-[0_0_25px_rgba(139,92,246,0.12)]",
  };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden flex flex-col pointer-events-auto ${accentClasses[accent]} ${className}`}
    >
      {/* Top Hairline Specular Highlight */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.18] to-transparent" />

      {/* Frame Header Bar */}
      <div className="px-5 py-3.5 border-b border-white/[0.07] flex items-center justify-between">
        <div>
          {eyebrow && (
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#94A3B8] block mb-0.5">
              {eyebrow}
            </span>
          )}
          <h3 className="font-sans text-sm font-semibold text-white tracking-tight">{title}</h3>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-[#94A3B8] hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Frame Body */}
      <div className="p-5 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
