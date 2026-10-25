import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "gold" | "cyan" | "emerald" | "violet" | "crimson" | "amber" | "muted";
}

export function Badge({
  className = "",
  variant = "muted",
  children,
  ...props
}: BadgeProps) {
  const variantStyles = {
    gold: "bg-[#D4AF37]/15 border-[#D4AF37]/35 text-[#F3E5AB]",
    cyan: "bg-[#00F0FF]/15 border-[#00F0FF]/35 text-[#00F0FF]",
    emerald: "bg-[#10B981]/15 border-[#10B981]/35 text-[#10B981]",
    violet: "bg-[#8B5CF6]/15 border-[#8B5CF6]/35 text-[#8B5CF6]",
    crimson: "bg-[#F43F5E]/15 border-[#F43F5E]/35 text-[#F43F5E]",
    amber: "bg-[#F59E0B]/15 border-[#F59E0B]/35 text-[#F59E0B]",
    muted: "bg-white/[0.04] border-white/[0.08] text-[#94A3B8]",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full border font-mono text-[10px] font-medium tracking-wide uppercase ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
