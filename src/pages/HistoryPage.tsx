import { useState } from "react";
import Header from "@/components/Header";
import VerdictBadge from "@/components/VerdictBadge";
import { getHistory, clearHistory } from "@/lib/history";
import { AnalysisResult } from "@/lib/types";
import { Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";

const HistoryPage = () => {
  const [history, setHistory] = useState<AnalysisResult[]>(getHistory());

  const handleClear = () => {
    clearHistory();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Analysis History</h1>
          {history.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClear} className="gap-1.5 text-destructive hover:text-destructive">
              <Trash2 className="h-3.5 w-3.5" /> Clear All
            </Button>
          )}
        </div>

        {history.length === 0 ? (
          <div className="text-center py-20">
            <Clock className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No analyses yet. Go analyze some news!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {history.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{item.inputText}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(item.analyzedAt), "MMM d, yyyy · h:mm a")} · {item.probability}% fake probability
                    </p>
                  </div>
                  <VerdictBadge verdict={item.verdict} size="sm" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
};

export default HistoryPage;
