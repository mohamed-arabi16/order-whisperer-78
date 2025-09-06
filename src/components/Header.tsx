import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useNavigate, Link } from "react-router-dom";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * The main header for the application.
 * It includes navigation links, language switcher, and authentication buttons.
 * It also has a mobile-friendly responsive design.
 *
 * @returns {JSX.Element | null} The rendered header component, or null if on a public menu page.
 */
const Header = (): JSX.Element | null => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t, isRTL } = useTranslation();
  const { user, signOut } = useAuth();
  const { setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide header on public menu pages
  if (location.pathname?.startsWith('/menu/')) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'}`}>
          <div className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center">
            <span className="text-background font-bold text-lg">ر</span>
          </div>
          <span className="text-xl font-bold">{t('header.brand')}</span>
        </div>

        {/* Desktop Navigation */}
        <nav className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse space-x-8' : 'space-x-8'}`}>
          <a href="/#features" className="text-muted-foreground hover:text-foreground transition-smooth">
            {t('header.features')}
          </a>
          <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
            {t('header.pricing')}
          </Link>
          <a href="/#demo" className="text-muted-foreground hover:text-foreground transition-smooth">
            {t('header.demo')}
          </a>
          <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-smooth">
            {t('header.contact')}
          </Link>
        </nav>

        <div className={`hidden md:flex items-center ${isRTL ? 'space-x-reverse space-x-4' : 'space-x-4'}`}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <LanguageSwitcher />
          {user ? (
            <>
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                {t('header.dashboard')}
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                {t('header.signOut')}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/auth')}>
                {t('header.signIn')}
              </Button>
              <Button variant="hero" onClick={() => navigate('/auth')}>
                {t('header.getStarted')}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 right-0 md:hidden bg-background border-b border-border shadow-lg">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <a href="/#features" className="block text-muted-foreground hover:text-foreground transition-smooth" onClick={() => setIsMenuOpen(false)}>
              {t('header.features')}
            </a>
            <Link to="/pricing" className="block text-muted-foreground hover:text-foreground transition-smooth" onClick={() => setIsMenuOpen(false)}>
              {t('header.pricing')}
            </Link>
            <a href="/#demo" className="block text-muted-foreground hover:text-foreground transition-smooth" onClick={() => setIsMenuOpen(false)}>
              {t('header.demo')}
            </a>
            <Link to="/contact" className="block text-muted-foreground hover:text-foreground transition-smooth" onClick={() => setIsMenuOpen(false)}>
              {t('header.contact')}
            </Link>
            <div className="pt-4 space-y-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    <span>Toggle theme</span>
                    <div>
                      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <LanguageSwitcher />
              {user ? (
                <>
                  <Button variant="ghost" className="w-full" onClick={() => navigate('/dashboard')}>
                    {t('header.dashboard')}
                  </Button>
                  <Button variant="outline" className="w-full" onClick={handleSignOut}>
                    {t('header.signOut')}
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" className="w-full" onClick={() => navigate('/auth')}>
                    {t('header.signIn')}
                  </Button>
                  <Button variant="hero" className="w-full" onClick={() => navigate('/auth')}>
                    {t('header.getStarted')}
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;