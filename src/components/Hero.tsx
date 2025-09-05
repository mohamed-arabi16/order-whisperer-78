import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Star } from "lucide-react";
import heroImage from "@/assets/hero-restaurant.jpg";

const Hero = () => {
  return (
    <section className="pt-24 pb-12 px-4">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium">
                <Star className="w-4 h-4 fill-current" />
                <span>Trusted by 500+ Restaurants</span>
              </div>
              
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Modern Restaurant
                <span className="block gradient-hero bg-clip-text text-transparent">
                  Management
                </span>
                Made Simple
              </h1>
              
              <p className="text-xl text-muted-foreground leading-relaxed">
                Streamline your restaurant operations with our comprehensive platform. 
                From menu management to QR ordering with WhatsApp integration - 
                everything you need in Arabic and English.
              </p>

              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Multi-language support:</span> العربية • English
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="hero" size="xl" className="group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button variant="outline" size="xl" className="group">
                <Play className="w-5 h-5" />
                Watch Demo
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="pt-8 space-y-4">
              <p className="text-sm text-muted-foreground">Trusted by restaurants across the Middle East</p>
              <div className="flex items-center space-x-6 opacity-60">
                <div className="text-sm font-medium">Damascus Gate</div>
                <div className="text-sm font-medium">الشام الأصيل</div>
                <div className="text-sm font-medium">Levant Kitchen</div>
                <div className="text-sm font-medium">بيت المأكولات</div>
              </div>
            </div>
          </div>

          {/* Right Content - Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-glow">
              <img 
                src={heroImage} 
                alt="Modern restaurant with digital menu integration" 
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 gradient-hero opacity-20"></div>
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-card p-4 rounded-xl shadow-card border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 gradient-accent rounded-lg flex items-center justify-center">
                  <span className="text-accent-foreground font-bold">+25%</span>
                </div>
                <div>
                  <p className="font-medium">Orders Increased</p>
                  <p className="text-sm text-muted-foreground">This month</p>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-4 -right-4 bg-card p-4 rounded-xl shadow-card border">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-fresh-green rounded-lg flex items-center justify-center">
                  <span className="text-background font-bold">4.9</span>
                </div>
                <div>
                  <p className="font-medium">Customer Rating</p>
                  <p className="text-sm text-muted-foreground">Average score</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;