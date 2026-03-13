import { AnalysisSignal } from "@/lib/types";
import { Heart, AlertTriangle, Users, GitBranch, MousePointerClick } from "lucide-react";
import { motion } from "framer-motion";

const signalIcons: Record<string, typeof Heart> = {
  "Emotional/Sensational Language": Heart,
  "Suspicious/Exaggerated Claims": AlertTriangle,
  "Lack of Credible Sources": Users,
  "Logical Inconsistencies": GitBranch,
  "Clickbait Headline Patterns": MousePointerClick,
};

const severityColor: Record<string, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

const severityBg: Record<string, string> = {
  low: "bg-success/10",
  medium: "bg-warning/10",
  high: "bg-destructive/10",
};

interface AnalysisSignalsProps {
  signals: AnalysisSignal[];
}

const AnalysisSignals = ({ signals }: AnalysisSignalsProps) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Analysis Signals</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {signals.map((signal, i) => {
          const Icon = signalIcons[signal.label] || AlertTriangle;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border ${
                signal.detected ? severityBg[signal.severity] : "bg-card"
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 ${
                  signal.detected ? severityColor[signal.severity] : "text-muted-foreground"
                }`}
              />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-medium text-foreground truncate block">
                  {signal.label}
                </span>
              </div>
              <span
                className={`text-[10px] font-bold uppercase ${
                  signal.detected ? severityColor[signal.severity] : "text-muted-foreground"
                }`}
              >
                {signal.detected ? signal.severity : "clear"}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisSignals;
