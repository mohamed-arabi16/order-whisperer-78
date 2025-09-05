import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Menu as MenuIcon, 
  Smartphone, 
  Shield, 
  BarChart3, 
  MessageSquare,
  Globe,
  Zap
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Users,
      title: "Super Admin Portal",
      description: "Complete tenant management with isolated data via Supabase RLS. Create and manage restaurant accounts effortlessly.",
      badge: "Multi-tenant",
      gradient: "gradient-hero"
    },
    {
      icon: MenuIcon,
      title: "Menu Builder",
      description: "Intuitive menu management with Arabic support. Add items, set prices, upload images, and manage availability in real-time.",
      badge: "Arabic Ready",
      gradient: "gradient-accent"
    },
    {
      icon: Smartphone,
      title: "QR Code Ordering",
      description: "Customers scan QR codes to view menus and place orders. Optimized for mobile with LCP under 3 seconds.",
      badge: "Mobile First",
      gradient: "gradient-card"
    },
    {
      icon: MessageSquare,
      title: "WhatsApp Integration",
      description: "Orders are sent directly to WhatsApp with pre-formatted Arabic messages. No app downloads required for customers.",
      badge: "Native Integration",
      gradient: "gradient-hero"
    },
    {
      icon: Shield,
      title: "Data Isolation",
      description: "Enterprise-grade security with Row Level Security (RLS). Each restaurant's data is completely isolated and secure.",
      badge: "Enterprise Security",
      gradient: "gradient-accent"
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      description: "Track performance metrics, popular items, and customer behavior. Make data-driven decisions for your restaurant.",
      badge: "Insights",
      gradient: "gradient-card"
    },
    {
      icon: Globe,
      title: "Multi-language Support",
      description: "Full Arabic and English support throughout the platform. Perfect for Middle Eastern restaurants.",
      badge: "العربية • English",
      gradient: "gradient-hero"
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Optimized performance with instant updates. Menu changes reflect immediately on all customer-facing screens.",
      badge: "Real-time",
      gradient: "gradient-accent"
    }
  ];

  return (
    <section id="features" className="py-24 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Everything Your Restaurant
            <span className="block gradient-hero bg-clip-text text-transparent">
              Needs to Succeed
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From multi-tenant management to seamless customer ordering - 
            our platform covers every aspect of modern restaurant operations.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-warm transition-smooth border-0 shadow-card">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 ${feature.gradient} rounded-lg flex items-center justify-center group-hover:scale-110 transition-smooth`}>
                    <feature.icon className="w-6 h-6 text-background" />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {feature.badge}
                  </Badge>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-smooth">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Technical Highlights */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-6 bg-secondary/50 px-8 py-4 rounded-full">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-fresh-green rounded-full"></div>
              <span className="text-sm font-medium">Supabase RLS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm font-medium">React + TypeScript</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-accent rounded-full"></div>
              <span className="text-sm font-medium">Mobile Optimized</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;