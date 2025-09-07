import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { motion } from "framer-motion";
import { useTranslation } from "@/hooks/useTranslation";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface StickyNavigationProps {
  categories: Category[];
  activeCategory: string | null;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCategorySelect: (categoryId: string) => void;
  phoneNumber?: string;
  primaryColor?: string;
}

export const StickyNavigation: React.FC<StickyNavigationProps> = ({
  categories,
  activeCategory,
  searchQuery,
  onSearchChange,
  onCategorySelect,
  phoneNumber,
  primaryColor
}) => {
  const { isRTL } = useTranslation();
  const categoryTabsRef = useRef<HTMLDivElement>(null);

  return (
    <div className="sticky top-[88px] z-40 bg-background/95 backdrop-blur-md border-b">
      {/* Search Bar */}
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md mx-auto">
            <Search className={`absolute top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground ${
              isRTL ? 'right-3' : 'left-3'
            }`} />
            <Input
              type="text"
              placeholder="ابحث عن الأطباق..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`rounded-full border-0 bg-muted/50 focus:bg-background transition-colors ${
                isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'
              }`}
            />
          </div>
          
          {/* More Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="rounded-full p-2">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="p-2 space-y-2">
                <LanguageSwitcher />
                {phoneNumber && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`tel:${phoneNumber}`)}
                    className="w-full justify-start"
                  >
                    اتصل بنا
                  </Button>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="container mx-auto px-4">
        <div 
          ref={categoryTabsRef}
          className="flex overflow-x-auto scrollbar-hide gap-2 py-3"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => {
            const isActive = activeCategory === category.id;
            return (
              <motion.div
                key={category.id}
                whileTap={{ scale: 0.95 }}
                className="flex-shrink-0"
              >
                <Button
                  variant={isActive ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onCategorySelect(category.id)}
                  className={`whitespace-nowrap rounded-full transition-all relative ${
                    isActive 
                      ? 'text-primary-foreground shadow-glow' 
                      : 'hover:bg-muted/80'
                  }`}
                  style={isActive ? { backgroundColor: primaryColor || undefined } : undefined}
                >
                  {category.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ backgroundColor: primaryColor || 'hsl(var(--primary))' }}
                    />
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};