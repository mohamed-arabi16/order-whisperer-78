import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Utensils } from "lucide-react";
import { motion } from "framer-motion";
import { LazyLoadImage } from "react-lazy-load-image-component";
import { useTranslation } from "@/hooks/useTranslation";
import { InlineQuantityControls } from "./InlineQuantityControls";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_featured?: boolean;
}

interface MenuItemCardProps {
  item: MenuItem;
  quantity: number;
  isFavorite: boolean;
  isAddingToCart: boolean;
  onAddToCart: () => void;
  onRemoveFromCart: () => void;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
  primaryColor?: string;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  quantity,
  isFavorite,
  isAddingToCart,
  onAddToCart,
  onRemoveFromCart,
  onToggleFavorite,
  onViewDetails,
  primaryColor
}) => {
  const { isRTL } = useTranslation();

  const formatPrice = (price: number): string => {
    return `${price.toLocaleString()} ل.س`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <Card className="group overflow-hidden hover:shadow-warm transition-all duration-300 glass border-0 hover-lift">
        <CardContent className="p-0">
          <div className={`flex gap-4 p-4 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Image Section - Fixed 80x80px */}
            <div className="relative w-20 h-20 flex-shrink-0">
              {item.image_url ? (
                <LazyLoadImage
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-500 cursor-pointer"
                  effect="blur"
                  onClick={onViewDetails}
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center bg-gradient-subtle rounded-lg cursor-pointer"
                  onClick={onViewDetails}
                >
                  <Utensils className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              
              {/* Featured Badge */}
              {item.is_featured && (
                <Badge 
                  className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: primaryColor || undefined }}
                >
                  مُوصى
                </Badge>
              )}
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col justify-between min-h-20">
              <div className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-lg leading-tight text-foreground line-clamp-1">
                    {item.name}
                  </h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onToggleFavorite}
                    className={`flex-shrink-0 p-1 h-8 w-8 ${
                      isFavorite ? 'text-destructive' : 'text-muted-foreground hover:text-destructive'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                </div>
                
                {item.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
                    {item.description}
                  </p>
                )}
              </div>

              {/* Price and Controls */}
              <div className="flex items-center justify-between mt-2">
                <span 
                  className="text-lg font-bold"
                  style={{ color: primaryColor || 'hsl(var(--primary))' }}
                >
                  {formatPrice(item.price)}
                </span>
                
                <InlineQuantityControls
                  quantity={quantity}
                  onIncrement={onAddToCart}
                  onDecrement={onRemoveFromCart}
                  isLoading={isAddingToCart}
                  primaryColor={primaryColor}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};