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
import StaggeredFadeIn from "@/components/StaggeredFadeIn";

/**
 * A component that displays a list of features.
 * It uses the useTranslation hook to support multiple languages.
 *
 * @returns {JSX.Element} The rendered features section.
 */
const Features = (): JSX.Element => {
  const { t, isRTL } = useTranslation();

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

  return (
    <section id="features" className="py-16 px-4" dir={isRTL ? "rtl" : "ltr"}>
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">{t("features.title")}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t("features.subtitle")}
          </p>
        </div>

        <StaggeredFadeIn
          stagger={0.2}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              className="gradient-card shadow-card hover:shadow-warm transition-smooth border-0"
            >
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 gradient-hero rounded-lg ${
                    isRTL ? "ml-auto" : "mr-auto"
                  } mb-4 flex items-center justify-center`}
                >
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </StaggeredFadeIn>
      </div>
    </section>
  );
};

export default Features;