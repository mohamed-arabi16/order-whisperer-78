import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Check } from "lucide-react";

/**
 * A page component that displays the pricing plans for the service.
 *
 * @returns {JSX.Element} The rendered pricing page.
 */
const Pricing = (): JSX.Element => {
  const { t, isRTL } = useTranslation();

  const plans = [
    {
      name: "Basic",
      price: "Free",
      features: [
        "Up to 10 menu items",
        "QR code generation",
        "WhatsApp ordering",
        "Basic analytics",
      ],
    },
    {
      name: "Premium",
      price: "$29/mo",
      features: [
        "Unlimited menu items",
        "Advanced QR code customization",
        "Priority support",
        "Advanced analytics",
      ],
    },
    {
      name: "Enterprise",
      price: "Contact us",
      features: [
        "All Premium features",
        "Custom branding",
        "Dedicated account manager",
        "On-premise deployment",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">{t('pricing.title')}</h1>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          {t('pricing.description')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card key={plan.name} className="flex flex-col">
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription className="text-4xl font-bold">{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6">
                <Button className="w-full">{t('header.getStarted')}</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;
