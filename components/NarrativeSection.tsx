import { ReactNode } from "react";

interface NarrativeSectionProps {
  children: ReactNode;
  className?: string;
}

export default function NarrativeSection({ children, className = "" }: NarrativeSectionProps) {
  return (
    <section className={`bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm rounded-lg shadow-xl border border-cyan-100 dark:border-slate-800 p-8 mb-8 ${className}`}>
      {children}
    </section>
  );
}
