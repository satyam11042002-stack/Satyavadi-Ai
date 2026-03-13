import { Verdict } from "@/lib/types";
import { ShieldCheck, AlertTriangle, ShieldAlert } from "lucide-react";

const config: Record<Verdict, { label: string; className: string; Icon: typeof ShieldCheck }> = {
  real: { label: "Real News", className: "bg-success/10 text-success border-success/30", Icon: ShieldCheck },
  misleading: { label: "Possibly Misleading", className: "bg-warning/10 text-warning border-warning/30", Icon: AlertTriangle },
  fake: { label: "Fake News", className: "bg-destructive/10 text-destructive border-destructive/30", Icon: ShieldAlert },
};

const VerdictBadge = ({ verdict, size = "lg" }: { verdict: Verdict; size?: "sm" | "lg" }) => {
  const { label, className, Icon } = config[verdict];
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1.5 border rounded-full font-semibold ${className} ${
        isSmall ? "px-2.5 py-0.5 text-xs" : "px-4 py-1.5 text-sm"
      }`}
    >
      <Icon className={isSmall ? "h-3 w-3" : "h-4 w-4"} />
      {label}
    </span>
  );
};

export default VerdictBadge;
