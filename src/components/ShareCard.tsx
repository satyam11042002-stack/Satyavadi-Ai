import { AnalysisResult } from "@/lib/types";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareCardProps {
  result: AnalysisResult;
}

const getScoreColor = (score: number) => {
  if (score <= 30) return "text-destructive";
  if (score <= 60) return "text-warning";
  return "text-success";
};

const ShareCard = ({ result }: ShareCardProps) => {
  const siteUrl = window.location.origin;
  const warningText =
    result.probability >= 60
      ? "⚠️ This article may contain misinformation"
      : result.probability >= 35
      ? "⚡ This article contains possibly misleading content"
      : "✅ This article appears to be credible";

  const shareText = `${warningText}\n\n📊 Fake Probability: ${result.probability}%\n🛡️ Trust Score: ${result.trustScore}/100\n\nVerify news at ${siteUrl}`;

  const shareToWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");
  };

  const shareToTwitter = () => {
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const shareToTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(shareText)}`,
      "_blank"
    );
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareText);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="space-y-3">
      {/* Visual Share Card */}
      <div className="rounded-xl border border-border bg-gradient-to-br from-card to-muted p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-bold text-foreground text-sm">TruthLens</span>
          <span className="text-[10px] text-muted-foreground ml-auto">AI Fake News Detector</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-extrabold text-foreground">{result.probability}%</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Fake Probability
            </div>
          </div>
          <div className="h-12 w-px bg-border" />
          <div className="text-center">
            <div className={`text-3xl font-extrabold ${getScoreColor(result.trustScore)}`}>
              {result.trustScore}
            </div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
              Trust Score
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground italic">{warningText}</p>
        <p className="text-[10px] text-muted-foreground">{siteUrl}</p>
      </div>

      {/* Share Buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={shareToWhatsApp} className="gap-1.5 text-xs">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </Button>
        <Button size="sm" variant="outline" onClick={shareToTwitter} className="gap-1.5 text-xs">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
          Twitter
        </Button>
        <Button size="sm" variant="outline" onClick={shareToTelegram} className="gap-1.5 text-xs">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
          Telegram
        </Button>
        <Button size="sm" variant="outline" onClick={copyLink} className="gap-1.5 text-xs">
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Copy Link
        </Button>
      </div>
    </div>
  );
};

export default ShareCard;
