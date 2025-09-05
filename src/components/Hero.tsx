import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import heroImage from "@/assets/hero-restaurant.jpg";

const Hero = () => {
  const { t, isRTL } = useTranslation();

  return (
    <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-background to-secondary/20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 gradient-hero bg-clip-text text-transparent">
            {t('hero.title')}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            {t('hero.subtitle')}
          </p>
          <div className={`flex flex-col sm:flex-row gap-4 justify-center ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
            <Button size="lg" className="gradient-hero text-primary-foreground hover:shadow-glow hover:scale-105 font-semibold">
              {t('hero.getStarted')}
              <ArrowRight className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
            <Button size="lg" variant="outline" className="hover:bg-accent hover:text-accent-foreground">
              <Play className="h-5 w-5 mr-2" />
              {t('hero.watchDemo')}
            </Button>
          </div>
        </div>
        
        {/* Hero Image */}
        <div className="mt-16 relative">
          <div className="relative mx-auto max-w-4xl">
            <img
              src={heroImage}
              alt="Restaurant digital menu preview"
              className="rounded-2xl shadow-warm w-full object-cover max-h-96"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent rounded-2xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;