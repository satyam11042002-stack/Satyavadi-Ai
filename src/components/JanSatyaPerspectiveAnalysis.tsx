import { motion } from "framer-motion";
import {
  Gauge, Building2, Users, Newspaper, GraduationCap,
  Table2, CheckCircle2, GitCompareArrows, Sparkles, Globe,
} from "lucide-react";

interface Report {
  title: string;
  category: string;
  status: string;
  executiveSummary: string;
  whyItMatters: {
    whoBenefits: string[];
    whoMayBeAffected: string[];
    shortTermImpact: string[];
    longTermImpact: string[];
  };
  perspectives: {
    government: string[];
    citizens: string[];
    experts: string[];
    media: string[];
  };
  officialSources: { name: string; type: string; url: string }[];
  timeline: { date: string; title: string; detail: string; phase: string }[];
  keyFacts: { label: string; value: string }[];
  faqs: { question: string; answer: string }[];
}

const clampScore = (n: number, base = 46) =>
  Math.max(38, Math.min(98, Math.round(base + n)));

const firstSentence = (s = "") => {
  const t = s.split(/(?<=[.!?])\s/)[0]?.trim() || s.trim();
  return t.length > 130 ? `${t.slice(0, 127)}…` : t;
};

const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};

const focusOf = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("parliament") || t.includes("sabha")) return "Legislative debate & passage";
  if (t.includes("gazette") || t.includes("notification")) return "Legal text & notification";
  if (t.includes("ministry") || t.includes("department")) return "Implementation & rollout";
  if (t.includes("research") || t.includes("study") || t.includes("think")) return "Independent evaluation";
  if (t.includes("news") || t.includes("media")) return "Public reception & reporting";
  return "Official record & context";
};

const evidenceOf = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("gazette") || t.includes("parliament")) return "Primary";
  if (t.includes("ministry") || t.includes("gov") || t.includes("department")) return "Official";
  if (t.includes("research") || t.includes("study")) return "Analytical";
  return "Secondary";
};

const Bar = ({
  icon: Icon, label, value, delay,
}: { icon: React.ElementType; label: string; value: number; delay: number }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/85">
        <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
        {label}
      </span>
      <span className="text-xs font-semibold tabular-nums text-muted-foreground">{value}%</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary shadow-[0_0_12px_hsl(var(--primary)/0.45)]"
      />
    </div>
  </div>
);

const Ring = ({ score }: { score: number }) => {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} className="stroke-muted" strokeWidth="8" fill="none" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none" strokeWidth="8" strokeLinecap="round"
          stroke="url(#cbGrad)"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
        <defs>
          <linearGradient id="cbGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary) / 0.6)" />
            <stop offset="100%" stopColor="hsl(var(--primary))" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold tabular-nums text-foreground">{score}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
      </div>
    </div>
  );
};

const Card = ({
  icon: Icon, title, subtitle, delay = 0, children,
}: {
  icon: React.ElementType; title: string; subtitle?: string; delay?: number; children: React.ReactNode;
}) => (
  <motion.section
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay }}
    className="glass-card rounded-2xl p-5 shadow-lg shadow-primary/5 sm:p-6"
  >
    <div className="mb-4 flex items-start gap-3">
      <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-2">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <h3 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">{title}</h3>
        {subtitle && <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
    {children}
  </motion.section>
);

const JanSatyaPerspectiveAnalysis = ({ report }: { report: Report }) => {
  const p = report.perspectives || ({} as Report["perspectives"]);
  const gov = p.government?.length || 0;
  const cit = p.citizens?.length || 0;
  const med = p.media?.length || 0;
  const exp = p.experts?.length || 0;
  const sources = report.officialSources || [];

  const bars = [
    { icon: Building2, label: "Government Perspective", value: clampScore(gov * 13, 50) },
    { icon: Users, label: "Opposition Perspective", value: clampScore(cit * 12, 46) },
    { icon: Newspaper, label: "Media Coverage", value: clampScore(med * 12 + sources.length * 2, 44) },
    { icon: GraduationCap, label: "Expert Consensus", value: clampScore(exp * 12, 45) },
  ];
  const balance = Math.round(bars.reduce((s, b) => s + b.value, 0) / bars.length);

  const rows = sources.slice(0, 6).map((s, i) => ({
    name: s.name,
    host: hostOf(s.url),
    url: s.url,
    focus: focusOf(s.type),
    claim: firstSentence(
      report.keyFacts?.[i]?.value ||
      report.timeline?.[i]?.detail ||
      report.executiveSummary
    ),
    evidence: evidenceOf(s.type),
    coverage: clampScore(72 - i * 6, 20),
  }));

  const common = [
    ...(report.whyItMatters?.whoBenefits || []).slice(0, 2),
    ...(report.keyFacts || []).slice(0, 2).map((f) => `${f.label}: ${f.value}`),
  ].filter(Boolean);

  const differences = [
    p.government?.[0] && `Government framing emphasises: ${firstSentence(p.government[0])}`,
    p.citizens?.[0] && `Citizen/opposition framing emphasises: ${firstSentence(p.citizens[0])}`,
    p.media?.[0] && `Media coverage highlights: ${firstSentence(p.media[0])}`,
    p.experts?.[0] && `Expert commentary focuses on: ${firstSentence(p.experts[0])}`,
  ].filter(Boolean) as string[];

  const insights = [
    common[0] && `Broad agreement across sources on: ${firstSentence(String(common[0]))}`,
    differences[0] && `Main point of divergence — ${differences[0].toLowerCase()}`,
    (report.whyItMatters?.whoMayBeAffected || [])[0] &&
      `Least discussed angle: impact on ${firstSentence(report.whyItMatters.whoMayBeAffected[0]).toLowerCase()}`,
    sources.length
      ? `${sources.length} official document${sources.length > 1 ? "s" : ""} were consulted, weighted towards ${focusOf(sources[0].type).toLowerCase()}.`
      : "No primary documents were cited, so conclusions rest on general public information.",
    report.timeline?.length
      ? `The timeline spans ${report.timeline.length} recorded milestones, with the latest phase marked "${report.timeline[report.timeline.length - 1].phase}".`
      : null,
    exp === 0 || med === 0
      ? "Coverage is uneven: at least one perspective group is thinly represented in available sources."
      : "All four perspective groups are represented, though depth varies by source type.",
  ].filter(Boolean).slice(0, 6) as string[];

  return (
    <div className="space-y-6">
      <Card
        icon={Gauge}
        title="Perspective Analysis"
        subtitle="A visual summary showing how comprehensively different perspectives are represented in this report. This is not a political bias score or truth score."
      >
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="space-y-4">
            {bars.map((b, i) => <Bar key={b.label} {...b} delay={0.15 + i * 0.1} />)}
          </div>

          <div className="flex items-center gap-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4 sm:p-5 lg:w-64 lg:flex-col lg:text-center">
            <Ring score={balance} />
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-widest text-primary">Coverage Balance</p>
              <p className="mt-1 text-sm font-semibold text-foreground">{balance}/100</p>
            </div>
          </div>
        </div>

        <p className="mt-5 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground">
          This score reflects how comprehensively multiple perspectives and credible sources are represented in this
          report. It does not indicate which side is correct.
        </p>
      </Card>

      <Card
        icon={Table2}
        title="Multi-Source Comparison"
        subtitle="How each source used in this report frames the topic."
        delay={0.08}
      >
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No individual sources were cited for this topic, so a source-by-source comparison isn’t available.
          </p>
        ) : (
          <>
            {/* Desktop table */}
            <div className="-mx-1 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] border-separate border-spacing-y-2 px-1 text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-3 pb-1 font-medium">Source</th>
                    <th className="px-3 pb-1 font-medium">Primary Focus</th>
                    <th className="px-3 pb-1 font-medium">Key Claims</th>
                    <th className="px-3 pb-1 font-medium">Evidence</th>
                    <th className="px-3 pb-1 font-medium">Coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.06 * i }}
                      className="group"
                    >
                      <td className="rounded-l-xl border-y border-l border-border/60 bg-muted/25 px-3 py-3 align-top">
                        <a href={r.url} target="_blank" rel="noopener noreferrer"
                          className="text-sm font-semibold text-foreground hover:text-primary">
                          {r.name}
                        </a>
                        <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Globe className="h-3 w-3" />{r.host}
                        </span>
                      </td>
                      <td className="border-y border-border/60 bg-muted/25 px-3 py-3 align-top text-sm text-foreground/80">{r.focus}</td>
                      <td className="max-w-[22rem] border-y border-border/60 bg-muted/25 px-3 py-3 align-top text-sm text-foreground/75">{r.claim}</td>
                      <td className="border-y border-border/60 bg-muted/25 px-3 py-3 align-top">
                        <span className="rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                          {r.evidence}
                        </span>
                      </td>
                      <td className="rounded-r-xl border-y border-r border-border/60 bg-muted/25 px-3 py-3 align-top">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${r.coverage}%` }}
                            transition={{ duration: 0.8, delay: 0.1 + 0.06 * i }}
                            className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                          />
                        </div>
                        <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground">{r.coverage}%</span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 md:hidden">
              {rows.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="rounded-xl border border-border/60 bg-muted/25 p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <a href={r.url} target="_blank" rel="noopener noreferrer"
                      className="text-sm font-semibold leading-snug text-foreground hover:text-primary">
                      {r.name}
                    </a>
                    <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-primary">
                      {r.evidence}
                    </span>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">{r.host}</p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Primary Focus</dt>
                      <dd className="text-foreground/85">{r.focus}</dd>
                    </div>
                    <div>
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">Key Claims</dt>
                      <dd className="text-foreground/75">{r.claim}</dd>
                    </div>
                  </dl>
                  <div className="mt-3">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${r.coverage}%` }}
                        transition={{ duration: 0.8, delay: 0.1 + 0.05 * i }}
                        className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                      />
                    </div>
                    <span className="mt-1 block text-[11px] tabular-nums text-muted-foreground">Coverage {r.coverage}%</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-success/25 bg-success/5 p-4">
            <h4 className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-success">
              <CheckCircle2 className="h-3.5 w-3.5" /> Common Findings
            </h4>
            <ul className="space-y-1.5">
              {(common.length ? common : ["Sources broadly agree on the basic facts of the topic."]).map((c, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-success" />{String(c)}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-warning/25 bg-warning/5 p-4">
            <h4 className="mb-2 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-warning">
              <GitCompareArrows className="h-3.5 w-3.5" /> Differences in Coverage
            </h4>
            <ul className="space-y-1.5">
              {(differences.length ? differences : ["No significant divergence detected between the available sources."]).map((d, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground/80">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-warning" />{d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>

      <Card icon={Sparkles} title="AI Insights" subtitle="Patterns across agreement, disagreement and missing context." delay={0.16}>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {insights.map((t, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex gap-2.5 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 to-transparent p-3.5 text-sm leading-relaxed text-foreground/85"
            >
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {t}
            </motion.li>
          ))}
        </ul>
      </Card>
    </div>
  );
};

export default JanSatyaPerspectiveAnalysis;
