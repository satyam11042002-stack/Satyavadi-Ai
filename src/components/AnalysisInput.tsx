import { useState, useRef, useEffect } from "react";
import { Search, Loader2, Link2, Mic, MicOff, MessageSquare, ImageIcon, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { extractTextFromImage } from "@/lib/ocr";

interface AnalysisInputProps {
  onSubmit: (text: string) => void;
  onSubmitUrl: (url: string) => void;
  isLoading: boolean;
}

const WHATSAPP_PATTERNS = [
  "forward this to", "share immediately", "share this message",
  "send to everyone", "send to all", "government secretly",
  "doctors warn", "shocking discovery", "urgent warning",
  "don't ignore this", "breaking news", "confirmed by nasa",
  "forwarded many times", "share this urgently", "share urgently",
  "forward to all", "forward immediately", "spread the word",
];

const AnalysisInput = ({ onSubmit, onSubmitUrl, isLoading }: AnalysisInputProps) => {
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [whatsappText, setWhatsappText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeTab, setActiveTab] = useState("text");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [extractedOcrText, setExtractedOcrText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const supportsVoice = typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const startListening = () => {
    if (!supportsVoice) { toast.error("Voice input is not supported in this browser"); return; }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) transcript += event.results[i][0].transcript;
      if (activeTab === "whatsapp") setWhatsappText(transcript);
      else setText(transcript);
    };
    recognition.onerror = () => { setIsListening(false); toast.error("Voice recognition error."); };
    recognition.onend = () => setIsListening(false);
    recognition.start();
    recognitionRef.current = recognition;
    setIsListening(true);
  };

  const stopListening = () => { recognitionRef.current?.stop(); setIsListening(false); };
  useEffect(() => { return () => recognitionRef.current?.stop(); }, []);

  const handleTextSubmit = (e: React.FormEvent) => { e.preventDefault(); if (text.trim().length < 20) return; onSubmit(text.trim()); };
  const handleUrlSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!url.trim()) return; onSubmitUrl(url.trim()); };
  const handleWhatsAppSubmit = (e: React.FormEvent) => { e.preventDefault(); if (whatsappText.trim().length < 20) return; onSubmit(whatsappText.trim()); };

  const isValidUrl = (s: string) => { try { new URL(s.startsWith("http") ? s : `https://${s}`); return s.trim().length > 0; } catch { return false; } };

  const detectedPatterns = whatsappText ? WHATSAPP_PATTERNS.filter((p) => whatsappText.toLowerCase().includes(p)) : [];

  // Screenshot/OCR handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10MB"); return; }
    setSelectedImage(file);
    setExtractedOcrText("");
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleExtractText = async () => {
    if (!selectedImage) return;
    setIsExtracting(true);
    try {
      const extracted = await extractTextFromImage(selectedImage);
      setExtractedOcrText(extracted);
      toast.success("Text extracted successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "OCR extraction failed");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleScreenshotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (extractedOcrText.trim().length < 20) return;
    onSubmit(extractedOcrText.trim());
  };

  const clearImage = () => { setSelectedImage(null); setImagePreview(""); setExtractedOcrText(""); };

  const VoiceButton = ({ disabled }: { disabled: boolean }) => supportsVoice ? (
    <Button type="button" variant="ghost" size="icon"
      onClick={isListening ? stopListening : startListening}
      className={`absolute top-3 right-3 ${isListening ? "text-destructive animate-pulse" : "text-muted-foreground"}`}
      disabled={disabled}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  ) : null;

  const ListeningIndicator = () => isListening ? (
    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive flex items-center gap-1.5">
      <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> Listening... Speak now
    </motion.p>
  ) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-3xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full mb-4 glass-card">
          <TabsTrigger value="text" className="flex-1 gap-1.5"><Search className="h-3.5 w-3.5" />Text</TabsTrigger>
          <TabsTrigger value="url" className="flex-1 gap-1.5"><Link2 className="h-3.5 w-3.5" />URL</TabsTrigger>
          <TabsTrigger value="whatsapp" className="flex-1 gap-1.5"><MessageSquare className="h-3.5 w-3.5" />WhatsApp</TabsTrigger>
          <TabsTrigger value="screenshot" className="flex-1 gap-1.5"><ImageIcon className="h-3.5 w-3.5" />Screenshot</TabsTrigger>
        </TabsList>

        <TabsContent value="text">
          <form onSubmit={handleTextSubmit} className="space-y-4">
            <div className="relative">
              <textarea value={text} onChange={(e) => setText(e.target.value)}
                placeholder="Paste a news article, headline, or text in any language to verify its authenticity..."
                className="w-full min-h-[180px] p-4 pr-12 rounded-xl border border-input bg-card/70 backdrop-blur-sm text-card-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring text-sm leading-relaxed"
                disabled={isLoading} />
              <VoiceButton disabled={isLoading} />
            </div>
            <ListeningIndicator />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {text.length < 20 ? `At least 20 characters required (${text.length}/20)` : `${text.length} characters • Any language supported`}
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
            <input type="text" value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/news-article"
              className="w-full h-14 px-4 rounded-xl border border-input bg-card/70 backdrop-blur-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
              disabled={isLoading} />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Paste a full article URL to extract and analyze</p>
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
              <textarea value={whatsappText} onChange={(e) => setWhatsappText(e.target.value)}
                placeholder="Paste a forwarded WhatsApp message here to check for misinformation..."
                className="w-full min-h-[180px] p-4 pr-12 rounded-xl border border-input bg-card/70 backdrop-blur-sm text-card-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring text-sm leading-relaxed"
                disabled={isLoading} />
              <VoiceButton disabled={isLoading} />
            </div>
            <ListeningIndicator />
            <AnimatePresence>
              {detectedPatterns.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="px-3 py-2.5 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-xs font-semibold text-warning mb-1.5">⚠️ This message appears to be a viral forward and may contain misinformation</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detectedPatterns.map((p, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded-md bg-warning/20 text-warning font-medium">"{p}"</span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {whatsappText.length < 20 ? `At least 20 characters required (${whatsappText.length}/20)` : `${whatsappText.length} characters`}
              </p>
              <Button type="submit" disabled={whatsappText.trim().length < 20 || isLoading} size="lg" className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {isLoading ? "Analyzing..." : "Analyze Forward"}
              </Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="screenshot">
          <form onSubmit={handleScreenshotSubmit} className="space-y-4">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            
            {!selectedImage ? (
              <motion.div
                onClick={() => fileInputRef.current?.click()}
                className="w-full min-h-[180px] rounded-xl border-2 border-dashed border-input bg-card/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">Upload a screenshot</p>
                  <p className="text-xs text-muted-foreground">Click or drag & drop • PNG, JPG up to 10MB</p>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden border border-input bg-card/70">
                  <img src={imagePreview} alt="Selected screenshot" className="w-full max-h-[200px] object-contain bg-muted/30" />
                  <Button type="button" variant="ghost" size="icon"
                    onClick={clearImage}
                    className="absolute top-2 right-2 h-7 w-7 bg-background/80 backdrop-blur-sm hover:bg-destructive/10"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {!extractedOcrText && (
                  <Button type="button" onClick={handleExtractText} disabled={isExtracting} className="w-full gap-2" variant="outline">
                    {isExtracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    {isExtracting ? "Extracting text..." : "Extract Text (OCR)"}
                  </Button>
                )}

                {extractedOcrText && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                    <p className="text-xs font-semibold text-foreground">📝 Extracted Text:</p>
                    <div className="p-3 rounded-lg bg-muted/50 border border-border/50 max-h-[120px] overflow-y-auto">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{extractedOcrText}</p>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {!selectedImage ? "Upload a fake news screenshot to analyze" :
                  !extractedOcrText ? "Extract text first, then analyze" :
                  extractedOcrText.length < 20 ? "Extracted text too short" : "Ready to analyze"}
              </p>
              <Button type="submit" disabled={extractedOcrText.trim().length < 20 || isLoading} size="lg" className="gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                {isLoading ? "Analyzing..." : "Analyze Screenshot"}
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AnalysisInput;
