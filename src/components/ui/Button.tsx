import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "gold" | "glass" | "ghost" | "cyan" | "outline";
  size?: "sm" | "md" | "lg";
}

export function Button({
  className = "",
  variant = "glass",
  size = "md",
  children,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-sans font-medium transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none rounded-xl";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-6 py-3 text-base gap-2.5",
  };

  const variantClasses = {
    gold: "bg-gradient-to-r from-[#D4AF37] to-[#B38F24] text-black font-semibold shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:brightness-110",
    glass: "bg-white/[0.04] border border-white/[0.08] text-[#E2E8F0] hover:bg-white/[0.08] hover:border-white/[0.14]",
    ghost: "bg-transparent text-[#94A3B8] hover:text-white hover:bg-white/[0.05]",
    cyan: "bg-[#00F0FF]/15 border border-[#00F0FF]/40 text-[#00F0FF] shadow-[0_0_15px_rgba(0,240,255,0.2)] hover:bg-[#00F0FF]/25",
    outline: "bg-transparent border border-white/[0.12] text-white hover:border-[#D4AF37]/60 hover:text-[#F3E5AB]",
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
