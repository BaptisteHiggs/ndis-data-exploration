import { ReactNode } from "react";

interface NarrativeSectionProps {
  children: ReactNode;
  className?: string;
}

export default function NarrativeSection({ children, className = "" }: NarrativeSectionProps) {
  return (
    <section className={`bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8 mb-8 ${className}`}>
      {children}
    </section>
  );
}
