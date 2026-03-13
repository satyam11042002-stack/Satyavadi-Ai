import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface AnalysisInputProps {
  onSubmit: (text: string) => void;
  isLoading: boolean;
}

const AnalysisInput = ({ onSubmit, isLoading }: AnalysisInputProps) => {
  const [text, setText] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 20) return;
    onSubmit(text.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste a news article, headline, or URL here to verify its authenticity..."
          className="w-full min-h-[180px] p-4 rounded-xl border border-input bg-card text-card-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring text-sm leading-relaxed"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {text.length < 20
              ? `At least 20 characters required (${text.length}/20)`
              : `${text.length} characters`}
          </p>
          <Button
            type="submit"
            disabled={text.trim().length < 20 || isLoading}
            size="lg"
            className="gap-2"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isLoading ? "Analyzing..." : "Analyze News"}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default AnalysisInput;
