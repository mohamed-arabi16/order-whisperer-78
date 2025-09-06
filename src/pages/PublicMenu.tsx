import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Star, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { Textarea } from "@/components/ui/textarea";

interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone_number: string | null;
  logo_url: string | null;
  primary_color: string | null;
  is_active: boolean;
  address: string | null;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  is_available: boolean;
  display_order: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const PublicMenu = (): JSX.Element => {
  const { slug } = useParams();
  const { t } = useTranslation();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 0, comment: "" });

  useEffect(() => {
    const fetchMenuData = async () => {
      if (!slug) return;

      setLoading(true);
      try {
        // Fetch tenant data
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .single();

        if (tenantError || !tenantData) {
          setError("المطعم غير موجود");
          return;
        }

        setTenant(tenantData);
        
        // Fetch categories
        const { data: categoriesData } = await supabase
          .from("menu_categories")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .eq("is_active", true)
          .order("display_order");

        // Fetch menu items
        const { data: itemsData } = await supabase
          .from("menu_items")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .order("display_order");

        setCategories(categoriesData || []);
        setMenuItems(itemsData || []);
        setActiveCategory(categoriesData?.[0]?.id || null);
        setError(null);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuData();
  }, [slug]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === itemId);
      if (existing && existing.quantity > 1) {
        return prev.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
      return prev.filter(cartItem => cartItem.id !== itemId);
    });
  };

  const getItemQuantity = (itemId: string) => {
    return cart.find(item => item.id === itemId)?.quantity || 0;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-LB").format(price) + " ل.ل";
  };

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId && item.is_available);
  };

  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const handleSubmitFeedback = async () => {
    if (!tenant) return;
    
    try {
      const { error } = await supabase
        .from("feedback")
        .insert({
          tenant_id: tenant.id,
          rating: feedback.rating,
          comment: feedback.comment,
        });

      if (error) {
        toast.error("فشل في إرسال التقييم");
        return;
      }

      toast.success("تم إرسال التقييم بنجاح");
      setFeedback({ rating: 0, comment: "" });
      setShowFeedback(false);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error("حدث خطأ غير متوقع");
    }
  };

  const handleWhatsAppOrder = async () => {
    if (!tenant?.phone_number) {
      toast.error("رقم الهاتف غير متاح");
      return;
    }

    try {
      // Log order items
      for (const item of cart) {
        await supabase.from("order_items").insert({
          tenant_id: tenant.id,
          menu_item_id: item.id,
          quantity: item.quantity,
        });
      }

      // Log order
      await supabase.from("orders").insert({
        tenant_id: tenant.id,
        total_price: totalPrice,
        order_type: "whatsapp",
      });

      // Generate WhatsApp message
      let message = `مرحباً! أود طلب الأصناف التالية من ${tenant.name}:\n\n`;
      
      cart.forEach(item => {
        message += `• ${item.name} × ${item.quantity} - ${formatPrice(item.price * item.quantity)}\n`;
      });
      
      message += `\nالمجموع: ${formatPrice(totalPrice)}\n`;
      message += `شكراً لكم!`;

      const whatsappUrl = `https://wa.me/${tenant.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      
      setCart([]); // Clear cart after sending
      toast.success("تم إرسال الطلب عبر واتساب");
    } catch (err) {
      console.error("Error processing order:", err);
      toast.error("حدث خطأ أثناء معالجة الطلب");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">جارٍ تحميل القائمة...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">المطعم غير موجود</h1>
          <p className="text-muted-foreground mb-8">يرجى التحقق من الرابط والمحاولة مرة أخرى</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {tenant.logo_url && (
              <img
                src={tenant.logo_url}
                alt="شعار المطعم"
                className="w-10 h-10 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-lg font-bold">{tenant.name}</h1>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowFeedback(true)}
          >
            <MessageCircle className="w-4 h-4 ml-2" />
            تقييم
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Categories */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2">
          {categories.map(category => (
            <Button
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              onClick={() => setActiveCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>

        {/* Menu Items */}
        <div className="space-y-6">
          {categories.map(category => {
            const categoryItems = getItemsForCategory(category.id);
            if (categoryItems.length === 0) return null;

            return (
              <section key={category.id} className="space-y-4">
                <h2 className="text-xl font-bold text-primary border-b border-border pb-2">
                  {category.name}
                </h2>
                <div className="space-y-3">
                  {categoryItems.map(item => (
                    <Card key={item.id} className="overflow-hidden shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {item.image_url && (
                            <img
                              src={item.image_url}
                              alt={item.name}
                              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-base">{item.name}</h3>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(item.price)}
                              </span>
                              <div className="flex items-center gap-2">
                                {getItemQuantity(item.id) > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                    className="w-8 h-8 p-0"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </Button>
                                )}
                                {getItemQuantity(item.id) > 0 && (
                                  <span className="text-sm font-medium w-8 text-center">
                                    {getItemQuantity(item.id)}
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  className="w-8 h-8 p-0"
                                >
                                  <Plus className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">لا توجد فئات متاحة</p>
          </div>
        )}
      </main>

      {/* Cart */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-50">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium">
                {cart.length} صنف - {formatPrice(totalPrice)}
              </span>
              <Button onClick={handleWhatsAppOrder} size="sm">
                <ShoppingCart className="w-4 h-4 ml-2" />
                إرسال عبر واتساب
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Dialog */}
      {showFeedback && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>تقييم تجربتك</CardTitle>
              <CardDescription>كيف كانت تجربتك مع {tenant.name}؟</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-8 h-8 cursor-pointer ${
                      feedback.rating >= star 
                        ? "text-yellow-400 fill-yellow-400" 
                        : "text-gray-300"
                    }`}
                    onClick={() => setFeedback(prev => ({ ...prev, rating: star }))}
                  />
                ))}
              </div>
              <Textarea
                placeholder="تعليق اختياري..."
                value={feedback.comment}
                onChange={(e) => setFeedback(prev => ({ ...prev, comment: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmitFeedback}
                  disabled={feedback.rating === 0}
                  className="flex-1"
                >
                  إرسال التقييم
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowFeedback(false)}
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;