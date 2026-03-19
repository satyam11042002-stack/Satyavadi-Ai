import { motion } from "framer-motion";

interface TrustScoreRingProps {
  score: number;
  size?: number;
}

const getScoreColor = (score: number) => {
  if (score <= 30) return "hsl(var(--destructive))";
  if (score <= 60) return "hsl(var(--warning))";
  return "hsl(var(--success))";
};

const getScoreLabel = (score: number) => {
  if (score <= 39) return "Likely False";
  if (score <= 59) return "Unverified";
  if (score <= 79) return "Likely True";
  return "Highly Reliable";
};

const TrustScoreRing = ({ score, size = 140 }: TrustScoreRingProps) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);
  const label = getScoreLabel(score);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="text-3xl font-extrabold text-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score}
          </motion.span>
          <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Trust
          </span>
        </div>
      </div>
      <span
        className="text-xs font-semibold px-3 py-1 rounded-full"
        style={{ color, backgroundColor: `${color}15` }}
      >
        {label}
      </span>
    </div>
  );
};

export default TrustScoreRing;
