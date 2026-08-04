import Logo from "@/components/Logo";

const Footer = () => {
  return (
    <footer className="w-full border-t border-border/60 bg-background/60 backdrop-blur-sm mt-16">
      <div className="container mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Logo className="h-6" />
          <span className="font-semibold text-foreground">Satyavadi AI</span>
          <span className="hidden sm:inline">— AI Fake News Detector</span>
        </div>
        <p className="text-xs text-muted-foreground tracking-wide">
          Built by <span className="font-medium text-foreground">Satyam Roy</span> · © {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
};

export default Footer;