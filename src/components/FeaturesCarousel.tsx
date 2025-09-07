import React, { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  MenuIcon,
  MessageCircle,
  QrCode,
  Clock,
  BarChart3,
  Globe,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";

/**
 * A carousel component that displays platform features with infinite loop
 * and focused center card with faded side cards.
 */
const FeaturesCarousel = (): JSX.Element => {
  const { t, isRTL } = useTranslation();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "center",
    slidesToScroll: 1,
    containScroll: "trimSnaps",
    direction: isRTL ? "rtl" : "ltr",
    skipSnaps: false,
  });

  const features = [
    {
      icon: MenuIcon,
      title: t("features.digitalMenu.title"),
      description: t("features.digitalMenu.description"),
    },
    {
      icon: MessageCircle,
      title: t("features.whatsappOrders.title"),
      description: t("features.whatsappOrders.description"),
    },
    {
      icon: QrCode,
      title: t("features.qrCode.title"),
      description: t("features.qrCode.description"),
    },
    {
      icon: Clock,
      title: t("features.realTimeUpdates.title"),
      description: t("features.realTimeUpdates.description"),
    },
    {
      icon: BarChart3,
      title: t("features.analytics.title"),
      description: t("features.analytics.description"),
    },
    {
      icon: Globe,
      title: t("features.multiLanguage.title"),
      description: t("features.multiLanguage.description"),
    },
  ];

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };

    emblaApi.on('select', onSelect);
    onSelect();

    const autoplay = setInterval(() => {
      emblaApi.scrollNext();
    }, 3000);

    const onMouseEnter = () => clearInterval(autoplay);
    const onMouseLeave = () => {
      const newAutoplay = setInterval(() => {
        emblaApi.scrollNext();
      }, 3000);
      clearInterval(autoplay);
      return newAutoplay;
    };

    const emblaNode = emblaApi.rootNode();
    emblaNode.addEventListener("mouseenter", onMouseEnter);
    emblaNode.addEventListener("mouseleave", onMouseLeave);

    return () => {
      clearInterval(autoplay);
      emblaNode.removeEventListener("mouseenter", onMouseEnter);
      emblaNode.removeEventListener("mouseleave", onMouseLeave);
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  return (
    <section id="features" className="py-16 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            {t("features.title")}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </motion.div>

        <div className="relative">
          {/* Carousel Container */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex">
              {features.map((feature, index) => {
                const isCenter = index === selectedIndex;
                return (
                  <motion.div
                    key={index}
                    className="flex-[0_0_100%] sm:flex-[0_0_50%] lg:flex-[0_0_33.333%] min-w-0 px-3"
                    initial={{ opacity: 0.4, scale: 0.8 }}
                    animate={{ 
                      opacity: isCenter ? 1 : 0.4, 
                      scale: isCenter ? 1 : 0.8 
                    }}
                    whileHover={{ scale: isCenter ? 1.02 : 0.82 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 30,
                      opacity: { duration: 0.5 },
                      scale: { duration: 0.5 }
                    }}
                  >
                    <Card className={`h-full transition-all duration-500 border-0 backdrop-blur-sm ${
                      isCenter 
                        ? 'gradient-card shadow-warm bg-card/90' 
                        : 'bg-card/40 shadow-card'
                    }`}>
                      <CardContent className="p-6 h-full flex flex-col">
                        <div
                          className={`w-12 h-12 ${isCenter ? 'gradient-hero' : 'bg-muted'} rounded-lg ${
                            isRTL ? "ml-auto" : "mr-auto"
                          } mb-4 flex items-center justify-center ${isCenter ? 'shadow-glow' : ''}`}
                        >
                          <feature.icon className={`h-6 w-6 ${isCenter ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                        </div>
                        <h3 className={`text-lg font-semibold mb-2 ${isCenter ? 'text-foreground' : 'text-muted-foreground'}`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm leading-relaxed flex-1 ${isCenter ? 'text-muted-foreground' : 'text-muted-foreground/60'}`}>
                          {feature.description}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-center gap-4 mt-8">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollPrev}
              className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              aria-label={isRTL ? "التالي" : "Previous"}
            >
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isRTL ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
                />
              </svg>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={scrollNext}
              className="w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
              aria-label={isRTL ? "السابق" : "Next"}
            >
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
                />
              </svg>
            </motion.button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesCarousel;