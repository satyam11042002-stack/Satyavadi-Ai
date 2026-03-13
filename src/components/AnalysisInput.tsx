import { useState, useRef, useEffect } from "react";
import { Search, Loader2, Link2, Mic, MicOff, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface AnalysisInputProps {
  onSubmit: (text: string) => void;
  onSubmitUrl: (url: string) => void;
  isLoading: boolean;
}

const WHATSAPP_PATTERNS = [
  "forward this to",
  "share immediately",
  "share this message",
  "send to everyone",
  "government secretly",
  "doctors warn",
  "shocking discovery",
  "urgent warning",
  "don't ignore this",
  "breaking news",
  "confirmed by nasa",
  "forwarded many times",
];

const AnalysisInput = ({ onSubmit, onSubmitUrl, isLoading }: AnalysisInputProps) => {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [whatsappText, setWhatsappText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const recognitionRef = useRef<any>(null);

  const supportsVoice = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = () => {
    if (!supportsVoice) {
      toast.error("Voice input is not supported in this browser");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      if (activeTab === "whatsapp") {
        setWhatsappText(transcript);
      } else {
        setText(transcript);
      }
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Voice recognition error. Please try again.");
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

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

  const handleWhatsAppSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (whatsappText.trim().length < 20) return;
    onSubmit(whatsappText.trim());
  };

  const isValidUrl = (s: string) => {
    try {
      new URL(s.startsWith("http") ? s : `https://${s}`);
      return s.trim().length > 0;
    } catch {
      return false;
    }
  };

  const detectedPatterns = whatsappText
    ? WHATSAPP_PATTERNS.filter((p) => whatsappText.toLowerCase().includes(p))
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-3xl mx-auto"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4 glass-card">
          <TabsTrigger value="text" className="flex-1 gap-1.5">
            <Search className="h-3.5 w-3.5" />
            Analyze Text
          </TabsTrigger>
          <TabsTrigger value="url" className="flex-1 gap-1.5">
            <Link2 className="h-3.5 w-3.5" />
            Article URL
          </TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-1 gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            WhatsApp
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste a news article, headline, or text in any language to verify its authenticity..."
                className="w-full min-h-[180px] p-4 pr-12 rounded-xl border border-input bg-card/70 backdrop-blur-sm text-card-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring text-sm leading-relaxed"
                disabled={isLoading}
              />
              {supportsVoice && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute top-3 right-3 ${isListening ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {isListening && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-destructive flex items-center gap-1.5"
              >
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                Listening... Speak now
              </motion.p>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {text.length < 20
                  ? `At least 20 characters required (${text.length}/20)`
                  : `${text.length} characters • Any language supported`}
              </p>
              <Button type="submit" disabled={text.trim().length < 20 || isLoading} size="lg" className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {isLoading ? "Analyzing..." : "Analyze"}
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
              className="w-full h-14 px-4 rounded-xl border border-input bg-card/70 backdrop-blur-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
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

        <TabsContent value="whatsapp">
          <form onSubmit={handleWhatsAppSubmit} className="space-y-4">
            <div className="relative">
              <textarea
                value={whatsappText}
                onChange={(e) => setWhatsappText(e.target.value)}
                placeholder="Paste a forwarded WhatsApp message here to check for misinformation..."
                className="w-full min-h-[180px] p-4 pr-12 rounded-xl border border-input bg-card/70 backdrop-blur-sm text-card-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring text-sm leading-relaxed"
                disabled={isLoading}
              />
              {supportsVoice && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  className={`absolute top-3 right-3 ${isListening ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              )}
            </div>
            {isListening && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                Listening... Speak now
              </motion.p>
            )}
            {detectedPatterns.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-3 py-2.5 rounded-lg bg-warning/10 border border-warning/20"
              >
                <p className="text-xs font-semibold text-warning mb-1.5">⚠️ Suspicious viral patterns detected:</p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedPatterns.map((p, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-warning/20 text-warning font-medium">
                      "{p}"
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {whatsappText.length < 20
                  ? `At least 20 characters required (${whatsappText.length}/20)`
                  : `${whatsappText.length} characters`}
              </p>
              <Button type="submit" disabled={whatsappText.trim().length < 20 || isLoading} size="lg" className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {isLoading ? "Analyzing..." : "Analyze Forward"}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AnalysisInput;
