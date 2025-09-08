import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Star, Facebook, Instagram, Twitter } from "lucide-react";
import { motion } from "framer-motion";

interface Tenant {
  id: string;
  name: string;
  address: string | null;
  primary_color: string | null;
  description: string | null;
  social_media_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  } | null;
}

interface RestaurantOverviewProps {
  tenant: Tenant;
}

export const RestaurantOverview: React.FC<RestaurantOverviewProps> = ({
  tenant
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="container mx-auto px-4 py-6"
    >
      <Card className="glass border-0 mb-8 overflow-hidden">
        <CardContent className="p-0">
          {/* Hero Section */}
          <div 
            className="relative h-32 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center justify-center"
            style={{
              background: tenant.primary_color 
                ? `linear-gradient(135deg, ${tenant.primary_color}20, ${tenant.primary_color}10)` 
                : undefined
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/10 to-background/20" />
            <div className="relative text-center">
              <motion.h2 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-3xl font-bold mb-2 gradient-hero bg-clip-text text-transparent"
              >
                مرحباً بكم في {tenant.name}
              </motion.h2>
              <motion.div 
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="flex items-center justify-center gap-4 text-sm"
              >
                <div className="flex items-center gap-1 text-accent">
                  <Star className="w-4 h-4 fill-current" />
                  <span>4.8</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>15-30 دقيقة</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-muted-foreground text-center max-w-2xl mx-auto mb-4 leading-relaxed"
            >
              {tenant.description || 
               "اكتشف أشهى الأطباق من مطبخنا المميز. نقدم لكم أفضل الوصفات التقليدية والعصرية بأعلى جودة ونكهات لا تُنسى. تجربة طعام استثنائية تجمع بين الأصالة والحداثة."
              }
            </motion.p>
            
            <div className="space-y-3">
              {tenant.address && (
                <motion.div 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center justify-center gap-2 text-sm"
                >
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-muted-foreground">{tenant.address}</span>
                </motion.div>
              )}
              
              {tenant.social_media_links && (
                Object.values(tenant.social_media_links).some(link => link && link.trim() !== '') && (
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-4"
                  >
                    {tenant.social_media_links.facebook && (
                      <a 
                        href={tenant.social_media_links.facebook} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <Facebook className="w-5 h-5" />
                      </a>
                    )}
                    {tenant.social_media_links.instagram && (
                      <a 
                        href={tenant.social_media_links.instagram} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <Instagram className="w-5 h-5" />
                      </a>
                    )}
                    {tenant.social_media_links.twitter && (
                      <a 
                        href={tenant.social_media_links.twitter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/80 transition-colors"
                      >
                        <Twitter className="w-5 h-5" />
                      </a>
                    )}
                  </motion.div>
                )
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};