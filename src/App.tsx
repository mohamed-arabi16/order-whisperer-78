import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { TranslationProvider } from "@/hooks/useTranslation";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import MenuManagement from "./pages/MenuManagement";
import PublicMenu from "./pages/PublicMenu";
import RestaurantBranding from "./components/branding/RestaurantBranding";
import QRCodeGenerator from "./components/qr/QRCodeGenerator";
import Analytics from "./pages/Analytics";
import NotFound from "./pages/NotFound";
import Header from "./components/Header";
import Pricing from "./pages/Pricing";
import Contact from "./pages/Contact";

const queryClient = new QueryClient();

/**
 * The root component of the application.
 * It sets up all the necessary providers and defines the application's routes.
 *
 * @returns {JSX.Element} The rendered application.
 */
const App = (): JSX.Element => (
  <QueryClientProvider client={queryClient}>
    <TranslationProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/menu-management" element={<MenuManagement />} />
              <Route path="/branding" element={<RestaurantBranding />} />
              <Route path="/qr-code" element={<QRCodeGenerator />} />
              <Route path="/menu/:slug" element={<PublicMenu />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/contact" element={<Contact />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </TranslationProvider>
  </QueryClientProvider>
);

export default App;
