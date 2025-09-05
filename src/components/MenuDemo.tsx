import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, ShoppingCart, MessageSquare } from "lucide-react";
import { useState } from "react";

const MenuDemo = () => {
  const [cart, setCart] = useState<{[key: string]: number}>({});

  const menuItems = [
    {
      id: "1",
      name: "شيش طاووق",
      nameEn: "Shish Taouk",
      price: 50000,
      category: "المشاوي",
      categoryEn: "Grills",
      image: "🍖",
      available: true,
      description: "قطع الدجاج المشوية مع الخضار"
    },
    {
      id: "2", 
      name: "فتوش",
      nameEn: "Fattoush",
      price: 25000,
      category: "السلطات",
      categoryEn: "Salads", 
      image: "🥗",
      available: true,
      description: "سلطة لبنانية مع الخبز المحمص"
    },
    {
      id: "3",
      name: "كبة",
      nameEn: "Kibbeh",
      price: 35000,
      category: "المقبلات",
      categoryEn: "Appetizers",
      image: "🥙",
      available: false,
      description: "كبة مقلية محشوة باللحم"
    },
    {
      id: "4",
      name: "عصير برتقال",
      nameEn: "Orange Juice",
      price: 15000,
      category: "المشروبات",
      categoryEn: "Beverages",
      image: "🍊",
      available: true,
      description: "عصير برتقال طازج"
    }
  ];

  const updateCart = (itemId: string, change: number) => {
    setCart(prev => {
      const newCart = { ...prev };
      const currentCount = newCart[itemId] || 0;
      const newCount = Math.max(0, currentCount + change);
      
      if (newCount === 0) {
        delete newCart[itemId];
      } else {
        newCart[itemId] = newCount;
      }
      
      return newCart;
    });
  };

  const getTotalItems = () => {
    return Object.values(cart).reduce((sum, count) => sum + count, 0);
  };

  const getTotalPrice = () => {
    return Object.entries(cart).reduce((sum, [itemId, count]) => {
      const item = menuItems.find(i => i.id === itemId);
      return sum + (item ? item.price * count : 0);
    }, 0);
  };

  return (
    <section id="demo" className="py-24 px-4 bg-secondary/30">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Experience the
            <span className="block gradient-hero bg-clip-text text-transparent">
              Customer Journey
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how your customers will interact with your digital menu. 
            This is what they see after scanning your QR code.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          {/* Mock Phone Frame */}
          <div className="bg-card rounded-3xl p-6 shadow-glow border">
            {/* Restaurant Header */}
            <div className="text-center mb-6 pb-4 border-b border-border">
              <h3 className="text-2xl font-bold">Damascus Gate</h3>
              <p className="text-muted-foreground">بوابة دمشق</p>
              <Badge variant="secondary" className="mt-2">مطعم شامي أصيل</Badge>
            </div>

            {/* Menu Items */}
            <div className="space-y-4 mb-6">
              {menuItems.map((item) => (
                <Card key={item.id} className={`${!item.available ? 'opacity-50' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-2xl">{item.image}</span>
                          <div>
                            <h4 className="font-semibold">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">{item.nameEn}</p>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-primary">
                            {item.price.toLocaleString()} ل.ل
                          </span>
                          <Badge variant={item.available ? "default" : "secondary"} className="text-xs">
                            {item.available ? "متوفر" : "غير متوفر"}
                          </Badge>
                        </div>
                      </div>

                      {item.available && (
                        <div className="flex items-center space-x-1 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateCart(item.id, -1)}
                            disabled={!cart[item.id]}
                            className="w-8 h-8 p-0"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {cart[item.id] || 0}
                          </span>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => updateCart(item.id, 1)}
                            className="w-8 h-8 p-0"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Cart Summary & WhatsApp Button */}
            {getTotalItems() > 0 && (
              <div className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium">المجموع الكلي</span>
                    <span className="font-bold text-lg">{getTotalPrice().toLocaleString()} ل.ل</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getTotalItems()} عنصر في السلة
                  </div>
                </div>

                <Button variant="success" className="w-full" size="lg">
                  <MessageSquare className="w-5 h-5 ml-2" />
                  إرسال الطلب عبر واتساب
                </Button>
              </div>
            )}

            {getTotalItems() === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>أضف عناصر إلى سلتك لبدء الطلب</p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center mt-12">
          <p className="text-muted-foreground mb-4">
            This is exactly what your customers will see - beautiful, fast, and in Arabic!
          </p>
          <Button variant="hero">
            Create Your Digital Menu
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MenuDemo;