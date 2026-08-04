import { useRef, useState } from "react";
import {
  Landmark, Search, Loader2, Building2, Users, GraduationCap, Newspaper,
  FileText, ExternalLink, CalendarClock, Info, HelpCircle, TrendingUp, Sparkles,
  Scale, ScrollText, BookOpen, Globe, Clock, ShieldCheck, Bot, ListChecks,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { callEdgeFunction } from "@/lib/edgeClient";

interface JanSatyaReport {
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

const TRENDING = [
  "NEP 2020",
  "Digital Personal Data Protection Act",
  "PM Awas Yojana",
  "Agniveer Scheme",
  "Uniform Civil Code (UCC)",
  "One Nation One Election",
  "Ayushman Bharat",
  "New Labour Codes",
];

const PERSPECTIVES = [
  { key: "government", label: "Government View", icon: Building2 },
  { key: "citizens", label: "Citizens View", icon: Users },
  { key: "experts", label: "Experts View", icon: GraduationCap },
  { key: "media", label: "Media View", icon: Newspaper },
] as const;

const IMPACTS = [
  { key: "whoBenefits", label: "Who Benefits" },
  { key: "whoMayBeAffected", label: "Who May Be Affected" },
  { key: "shortTermImpact", label: "Short-Term Impact" },
  { key: "longTermImpact", label: "Long-Term Impact" },
] as const;

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, delay: i * 0.06 },
});

/** Maps a free-text source type to an icon + readable label. Presentation only. */
const sourceMeta = (type = "") => {
  const t = type.toLowerCase();
  if (t.includes("parliament") || t.includes("lok sabha") || t.includes("rajya"))
    return { icon: Scale, label: "Parliament" };
  if (t.includes("gazette") || t.includes("notification"))
    return { icon: ScrollText, label: "Gazette" };
  if (t.includes("ministry") || t.includes("department"))
    return { icon: Building2, label: "Ministry" };
  if (t.includes("research") || t.includes("study") || t.includes("think"))
    return { icon: BookOpen, label: "Research" };
  if (t.includes("gov")) return { icon: Landmark, label: "Government" };
  return { icon: Globe, label: type || "Public Source" };
};

const hostOf = (url: string) => {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
};

const JanSatyaPage = () => {
  const [query, setQuery] = useState("");
  const [report, setReport] = useState<JanSatyaReport | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);
  const [activeTopic, setActiveTopic] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const inflight = useRef(false);

  const runSearch = async (raw: string) => {
    const q = raw.trim();
    if (q.length < 2) {
      toast.error("Enter a policy, bill, scheme or public issue to analyze");
      return;
    }
    if (inflight.current) return;
    inflight.current = true;
    setIsLoading(true);
    setReport(null);
    setActiveTopic(q);
    try {
      const data = await callEdgeFunction("jansatya-report", { query: q });
      setReport(data);
      setGeneratedAt(new Date());
    } catch (err) {
      console.error("JanSatya error:", err);
      toast.error(err instanceof Error ? err.message : "Could not generate the report");
    } finally {
      inflight.current = false;
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-3 sm:px-4 py-8 sm:py-12 max-w-5xl">
        {/* Hero + search */}
        <motion.section {...fade()} className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-primary">
            <Sparkles className="h-3 w-3" />
            JanSatya · Civic Intelligence
          </div>
          <h1 className="mt-4 text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
            Understand any policy. Without the noise.
          </h1>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
            Neutral, AI-generated explainers on government policies, bills, schemes and public issues — with every side represented.
          </p>

          <div className="mt-7 glass-card-strong rounded-2xl p-2 sm:p-2.5 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch(query)}
                placeholder="Search any Government Policy, Bill, Scheme or Public Issue..."
                className="pl-9 h-11 border-0 bg-transparent focus-visible:ring-0 text-sm"
                maxLength={300}
              />
            </div>
            <Button onClick={() => runSearch(query)} disabled={isLoading} className="h-11 px-6 shrink-0">
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              <span className="ml-2">{isLoading ? "Analyzing" : "Analyze"}</span>
            </Button>
          </div>

          <div className="mt-5">
            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mb-3">
              <TrendingUp className="h-3.5 w-3.5" /> Trending topics
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {TRENDING.map((t) => (
                <button
                  key={t}
                  disabled={isLoading}
                  onClick={() => { setQuery(t); runSearch(t); }}
                  className="glass-card rounded-full px-3 py-1.5 text-xs font-medium text-foreground/80 transition-all hover:text-primary hover:border-primary/40 hover:-translate-y-0.5 disabled:opacity-50"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </motion.section>

        {/* Loading */}
        {isLoading && (
          <div className="mt-10 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="glass-card rounded-2xl p-6 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ))}
            <p className="text-center text-xs text-muted-foreground">
              Building a neutral report on “{activeTopic}”…
            </p>
          </div>
        )}

        {/* Report */}
        <AnimatePresence>
          {report && !isLoading && (
            <motion.div key={report.title} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-10 space-y-6">
              {/* Header card */}
              <motion.div {...fade(0)} className="glass-card-strong rounded-2xl p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium uppercase tracking-wider">
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-1">{report.category}</span>
                  <span className="rounded-full bg-success/10 text-success px-2.5 py-1">{report.status}</span>
                </div>
                <h2 className="mt-3 text-xl sm:text-2xl font-bold text-foreground">{report.title}</h2>
              </motion.div>

              {/* 1. Executive Summary */}
              <Section index={1} icon={FileText} title="Executive Summary" delay={1}>
                <p className="text-sm leading-relaxed text-foreground/85">{report.executiveSummary}</p>
              </Section>

              {/* 2. Why it matters */}
              <Section index={2} icon={Info} title="Why It Matters" delay={2}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {IMPACTS.map(({ key, label }) => (
                    <div key={key} className="rounded-xl border border-border/60 bg-muted/30 p-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">{label}</h4>
                      <ul className="space-y-1.5">
                        {(report.whyItMatters?.[key] || []).map((p, i) => (
                          <li key={i} className="text-sm text-foreground/80 flex gap-2">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </Section>

              {/* 3. Perspectives */}
              <Section index={3} icon={Users} title="Multi-Perspective Analysis" delay={3}
                subtitle="All viewpoints are presented as claims — not as verdicts.">
                <div className="grid gap-3 sm:grid-cols-2">
                  {PERSPECTIVES.map(({ key, label, icon: Icon }, i) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.05 * i }}
                      className="glass-card rounded-xl p-4 transition-transform hover:-translate-y-0.5"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <div className="rounded-lg bg-primary/10 p-1.5"><Icon className="h-4 w-4 text-primary" /></div>
                        <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                      </div>
                      <ul className="space-y-2">
                        {(report.perspectives?.[key] || []).map((p, j) => (
                          <li key={j} className="text-sm text-foreground/80 flex gap-2">
                            <span className="mt-1.5 h-1 w-1 rounded-full bg-muted-foreground shrink-0" />{p}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  ))}
                </div>
              </Section>

              {/* 4. Official sources */}
              {report.officialSources?.length > 0 && (
                <Section index={4} icon={Landmark} title="Official Sources" delay={4}>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {report.officialSources.map((s, i) => (
                      <a
                        key={i}
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-start gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 transition-all hover:border-primary/40 hover:bg-primary/5"
                      >
                        <Landmark className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary">{s.name}</p>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{s.type}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      </a>
                    ))}
                  </div>
                </Section>
              )}

              {/* 5. Timeline */}
              {report.timeline?.length > 0 && (
                <Section index={5} icon={CalendarClock} title="Timeline" delay={5}>
                  <ol className="relative border-l border-border/70 pl-5 space-y-5">
                    {report.timeline.map((t, i) => (
                      <li key={i} className="relative">
                        <span className={`absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2 border-background ${
                          t.phase === "current" ? "bg-success" : t.phase === "announcement" ? "bg-primary" : "bg-muted-foreground"
                        }`} />
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.date}</p>
                        <p className="text-sm font-semibold text-foreground">{t.title}</p>
                        <p className="text-sm text-foreground/75">{t.detail}</p>
                      </li>
                    ))}
                  </ol>
                </Section>
              )}

              {/* 6. Key facts */}
              {report.keyFacts?.length > 0 && (
                <Section index={6} icon={Sparkles} title="Key Facts" delay={6}>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {report.keyFacts.map((f, i) => (
                      <div key={i} className="glass-card rounded-xl p-4 transition-transform hover:-translate-y-0.5">
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{f.label}</p>
                        <p className="mt-1 text-sm font-semibold text-foreground">{f.value}</p>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* 7. FAQs */}
              {report.faqs?.length > 0 && (
                <Section index={7} icon={HelpCircle} title="Frequently Asked Questions" delay={7}>
                  <Accordion type="single" collapsible className="w-full">
                    {report.faqs.map((f, i) => (
                      <AccordionItem key={i} value={`faq-${i}`}>
                        <AccordionTrigger className="text-sm text-left">{f.question}</AccordionTrigger>
                        <AccordionContent className="text-sm text-foreground/80">{f.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </Section>
              )}

              {/* 8. Disclaimer */}
              <motion.div {...fade(8)} className="rounded-2xl border border-warning/30 bg-warning/5 p-4 flex gap-3">
                <Info className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                <p className="text-xs sm:text-sm text-foreground/80">
                  This analysis is AI-generated using publicly available information and should not be treated as legal advice.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

const Section = ({
  index, icon: Icon, title, subtitle, delay, children,
}: {
  index: number;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  delay: number;
  children: React.ReactNode;
}) => (
  <motion.section {...fade(delay)} className="glass-card rounded-2xl p-5 sm:p-6">
    <div className="flex items-start gap-3 mb-4">
      <div className="rounded-xl bg-primary/10 p-2"><Icon className="h-4 w-4 text-primary" /></div>
      <div>
        <h3 className="text-base sm:text-lg font-semibold text-foreground">
          <span className="text-muted-foreground mr-1.5">{index}.</span>{title}
        </h3>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </motion.section>
);

export default JanSatyaPage;
