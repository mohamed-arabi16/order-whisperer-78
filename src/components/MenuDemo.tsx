import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const MenuDemo = () => {
  const { t, isRTL } = useTranslation();

  const demoItems = [
    {
      name: "شيش طاووق",
      nameEn: "Chicken Shish Tawook",
      description: "قطع دجاج مشوية مع الخضار والأرز",
      descriptionEn: "Grilled chicken pieces with vegetables and rice",
      price: 45000,
      image: "https://images.unsplash.com/photo-1633945274417-b5a8ac5e2a2a?w=300&h=200&fit=crop"
    },
    {
      name: "فتوش",
      nameEn: "Fattoush Salad",
      description: "سلطة لبنانية تقليدية مع الخضار الطازجة",
      descriptionEn: "Traditional Lebanese salad with fresh vegetables",
      price: 25000,
      image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=200&fit=crop"
    },
    {
      name: "حمص بالطحينة",
      nameEn: "Hummus with Tahini",
      description: "حمص كريمي مع طحينة وزيت الزيتون",
      descriptionEn: "Creamy hummus with tahini and olive oil",
      price: 18000,
      image: "https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=300&h=200&fit=crop"
    }
  ];

  return (
    <section id="demo" className="py-16 px-4 bg-secondary/10" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            معاينة القائمة الرقمية
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            شاهد كيف ستبدو قائمة مطعمك الرقمية للعملاء
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="bg-background rounded-2xl shadow-warm p-6 border">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold">مطعم المذاق الأصيل</h3>
              <p className="text-sm text-muted-foreground">القائمة الرقمية</p>
            </div>

            <div className="space-y-4">
              {demoItems.map((item, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                            <p className="text-sm font-semibold text-primary mt-2">
                              {item.price.toLocaleString()} ل.ل
                            </p>
                          </div>
                          <Button size="sm" className="h-8 w-8 p-0 gradient-hero">
                            <Plus size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 p-4 bg-accent/10 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">المجموع</span>
                <span className="font-semibold">88,000 ل.ل</span>
              </div>
              <Button className="w-full gradient-hero text-primary-foreground">
                إرسال الطلب عبر واتساب
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MenuDemo;