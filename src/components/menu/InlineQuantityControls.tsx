import React from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface InlineQuantityControlsProps {
  quantity: number;
  onIncrement: () => void;
  onDecrement: () => void;
  isLoading?: boolean;
}

export const InlineQuantityControls: React.FC<InlineQuantityControlsProps> = ({
  quantity,
  onIncrement,
  onDecrement,
  isLoading = false,
}) => {
  if (quantity === 0) {
    return (
      <Button
        size="sm"
        onClick={onIncrement}
        disabled={isLoading}
        className="h-8 px-3 rounded-full bg-brand-primary text-primary-foreground hover:bg-brand-primary-hover"
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Plus className="w-4 h-4" />
        )}
      </Button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-2"
    >
      <Button
        size="sm"
        variant="outline"
        onClick={onDecrement}
        className="h-8 w-8 rounded-full p-0 hover:bg-destructive hover:text-destructive-foreground"
      >
        <Minus className="w-3 h-3" />
      </Button>
      
      <AnimatePresence mode="wait">
        <motion.span
          key={quantity}
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 10, opacity: 0 }}
          className="text-sm font-semibold min-w-6 text-center"
        >
          {quantity}
        </motion.span>
      </AnimatePresence>
      
      <Button
        size="sm"
        onClick={onIncrement}
        disabled={isLoading}
        className="h-8 w-8 rounded-full p-0 bg-brand-primary text-primary-foreground hover:bg-brand-primary-hover"
      >
        {isLoading ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Plus className="w-3 h-3" />
        )}
      </Button>
    </motion.div>
  );
};