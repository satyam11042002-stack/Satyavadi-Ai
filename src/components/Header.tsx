import { Shield, History, Moon, Sun, BadgeCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

const Header = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <header className="w-full border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto flex items-center justify-between h-16 px-3 sm:px-4 gap-2 max-w-full">
        <Link to="/" className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
          <Shield className="h-6 w-6 sm:h-7 sm:w-7 text-primary shrink-0" />
          <div className="flex flex-col leading-none min-w-0">
            <span className="text-base sm:text-xl font-bold tracking-tight text-foreground truncate">
              Satyavadi AI
            </span>
            <span className="hidden sm:block text-[9px] text-muted-foreground tracking-widest uppercase">Powered by Intelligence</span>
          </div>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          <Link
            to="/"
            className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              location.pathname === "/"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Analyze
          </Link>
          <Link
            to="/verify"
            className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-1.5 ${
              location.pathname === "/verify"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BadgeCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            Verify
          </Link>
          <Link
            to="/history"
            className={`px-2 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors flex items-center gap-1 sm:gap-1.5 ${
              location.pathname === "/history"
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline sm:inline">History</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="ml-0.5 sm:ml-1 h-8 w-8 sm:h-9 sm:w-9 shrink-0"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
