import { useState } from "react";
import { Search, Loader2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";

interface AnalysisInputProps {
  onSubmit: (text: string) => void;
  onSubmitUrl: (url: string) => void;
  isLoading: boolean;
}

const AnalysisInput = ({ onSubmit, onSubmitUrl, isLoading }: AnalysisInputProps) => {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length < 20) return;
    onSubmit(text.trim());
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmitUrl(url.trim());
  };

  const isValidUrl = (s: string) => {
    try {
      new URL(s.startsWith("http") ? s : `https://${s}`);
      return s.trim().length > 0;
    } catch {
      return false;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-3xl mx-auto"
    >
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="text" className="flex-1 gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Analyze Text
          </TabsTrigger>
          <TabsTrigger value="url" className="flex-1 gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Analyze Article URL
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste a news article, headline, or text here to verify its authenticity..."
              className="w-full min-h-[180px] p-4 rounded-xl border border-input bg-card text-card-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring text-sm leading-relaxed"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {text.length < 20
                  ? `At least 20 characters required (${text.length}/20)`
                  : `${text.length} characters`}
              </p>
              <Button type="submit" disabled={text.trim().length < 20 || isLoading} size="lg" className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {isLoading ? "Analyzing..." : "Analyze News"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="url">
          <form onSubmit={handleUrlSubmit} className="space-y-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/news-article"
              className="w-full h-14 px-4 rounded-xl border border-input bg-card text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              disabled={isLoading}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Paste a full article URL to extract and analyze its content
              </p>
              <Button type="submit" disabled={!isValidUrl(url) || isLoading} size="lg" className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                {isLoading ? "Analyzing..." : "Analyze URL"}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AnalysisInput;
