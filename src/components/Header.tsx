import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 gradient-hero rounded-lg flex items-center justify-center">
            <span className="text-background font-bold text-lg">ر</span>
          </div>
          <span className="text-xl font-bold">RestaurantOS</span>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-muted-foreground hover:text-foreground transition-smooth">
            Features
          </a>
          <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-smooth">
            Pricing
          </a>
          <a href="#demo" className="text-muted-foreground hover:text-foreground transition-smooth">
            Demo
          </a>
          <a href="#contact" className="text-muted-foreground hover:text-foreground transition-smooth">
            Contact
          </a>
        </nav>

        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost">Sign In</Button>
          <Button variant="hero">Get Started</Button>
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
        <div className="md:hidden bg-background border-b border-border">
          <nav className="container mx-auto px-4 py-4 space-y-4">
            <a href="#features" className="block text-muted-foreground hover:text-foreground transition-smooth">
              Features
            </a>
            <a href="#pricing" className="block text-muted-foreground hover:text-foreground transition-smooth">
              Pricing
            </a>
            <a href="#demo" className="block text-muted-foreground hover:text-foreground transition-smooth">
              Demo
            </a>
            <a href="#contact" className="block text-muted-foreground hover:text-foreground transition-smooth">
              Contact
            </a>
            <div className="pt-4 space-y-2">
              <Button variant="ghost" className="w-full">Sign In</Button>
              <Button variant="hero" className="w-full">Get Started</Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;