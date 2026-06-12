import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import HistoryPage from "./pages/HistoryPage";
import VerifyPage from "./pages/VerifyPage";
import NotFound from "./pages/NotFound";
import Footer from "./components/Footer";
import { startBackendWarmUp } from "@/lib/edgeClient";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Boot the backend immediately so the user's first request is never cold
    startBackendWarmUp();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/verify" element={<VerifyPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
