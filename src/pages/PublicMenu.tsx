import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Minus, Plus, ShoppingCart, MessageCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { generateWhatsAppMessage, openWhatsApp } from '@/lib/whatsapp';

interface Tenant {
  id: string;
  name: string;
  phone_number?: string;
  logo_url?: string;
  primary_color?: string;
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
  description?: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  category_id: string;
  display_order: number;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const PublicMenu = () => {
  const { slug } = useParams();
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderType, setOrderType] = useState<'delivery' | 'pickup'>('delivery');

  useEffect(() => {
    if (slug) {
      fetchMenuData();
    }
  }, [slug]);

  // Cache menu data in localStorage for PWA offline support
  useEffect(() => {
    if (tenant && categories.length > 0 && menuItems.length > 0) {
      localStorage.setItem(`menu-${slug}`, JSON.stringify({
        tenant,
        categories,
        menuItems,
        timestamp: Date.now()
      }));
    }
  }, [tenant, categories, menuItems, slug]);

  const fetchMenuData = async () => {
    try {
      // First try to load from cache for offline support
      const cached = localStorage.getItem(`menu-${slug}`);
      if (cached) {
        const { tenant: cachedTenant, categories: cachedCategories, menuItems: cachedItems, timestamp } = JSON.parse(cached);
        // Use cached data if less than 1 hour old
        if (Date.now() - timestamp < 3600000) {
          setTenant(cachedTenant);
          setCategories(cachedCategories);
          setMenuItems(cachedItems);
          setLoading(false);
          
          // Still try to fetch fresh data in background
          fetchFreshData();
          return;
        }
      }

      await fetchFreshData();
    } catch (error) {
      console.error('Error fetching menu:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل القائمة",
        variant: "destructive",
      });
    }
  };

  const fetchFreshData = async () => {
    try {
      // Get tenant by slug
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (tenantError || !tenantData) {
        setLoading(false);
        return;
      }

      setTenant(tenantData);

      // Get active categories
      const { data: categoriesData } = await supabase
        .from('menu_categories')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .eq('is_active', true)
        .order('display_order');

      // Get available menu items
      const { data: itemsData } = await supabase
        .from('menu_items')
        .select('*')
        .eq('tenant_id', tenantData.id)
        .eq('is_available', true)
        .order('display_order');

      setCategories(categoriesData || []);
      setMenuItems(itemsData || []);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(current => {
      const existingItem = current.find(cartItem => cartItem.id === item.id);
      if (existingItem) {
        return current.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...current, {
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: 1
        }];
      }
    });

    toast({
      title: "تم إضافة الصنف",
      description: `تم إضافة ${item.name} إلى السلة`,
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(current => {
      const existingItem = current.find(cartItem => cartItem.id === itemId);
      if (!existingItem) return current;

      if (existingItem.quantity === 1) {
        return current.filter(cartItem => cartItem.id !== itemId);
      } else {
        return current.map(cartItem =>
          cartItem.id === itemId
            ? { ...cartItem, quantity: cartItem.quantity - 1 }
            : cartItem
        );
      }
    });
  };

  const getItemQuantity = (itemId: string) => {
    return cart.find(item => item.id === itemId)?.quantity || 0;
  };

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-LB').format(price) + ' ل.ل';
  };

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

  const handleSendToWhatsApp = () => {
    if (cart.length === 0 || !tenant) return;

    const message = generateWhatsAppMessage({
      restaurantName: tenant.name,
      items: cart,
      orderType: orderType === 'delivery' ? 'توصيل' : 'استلام',
      totalPrice: getTotalPrice()
    });

    openWhatsApp(tenant.phone_number || '', message);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل القائمة...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md text-center p-8">
          <h2 className="text-xl font-bold mb-2">المطعم غير موجود</h2>
          <p className="text-muted-foreground">
            لم يتم العثور على المطعم المطلوب أو أنه غير نشط حالياً
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20" dir="rtl">
      {/* Header */}
      <div className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border z-10">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {tenant.logo_url && (
                <img
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div>
                <h1 className="text-xl font-bold gradient-hero bg-clip-text text-transparent">
                  {tenant.name}
                </h1>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  قائمة الطعام الرقمية
                </p>
              </div>
            </div>
            {cart.length > 0 && (
              <Badge className="relative">
                <ShoppingCart className="h-4 w-4 ml-1" />
                {getTotalItems()}
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cart.length}
                </span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Order Type Selection */}
      <div className="container mx-auto p-4">
        <Card className="shadow-card mb-6">
          <CardContent className="p-4">
            <h3 className="font-medium mb-3">نوع الطلب:</h3>
            <div className="flex gap-2">
              <Button
                variant={orderType === 'delivery' ? 'default' : 'outline'}
                onClick={() => setOrderType('delivery')}
                className="flex-1"
              >
                توصيل
              </Button>
              <Button
                variant={orderType === 'pickup' ? 'default' : 'outline'}
                onClick={() => setOrderType('pickup')}
                className="flex-1"
              >
                استلام
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Menu Categories and Items */}
        <div className="space-y-6 pb-32">
          {categories.length === 0 ? (
            <Card className="text-center p-8">
              <h3 className="text-lg font-medium mb-2">القائمة غير متاحة حالياً</h3>
              <p className="text-muted-foreground">
                يرجى المحاولة مرة أخرى لاحقاً
              </p>
            </Card>
          ) : (
            categories.map(category => {
              const categoryItems = getItemsForCategory(category.id);
              if (categoryItems.length === 0) return null;

              return (
                <div key={category.id} className="space-y-4">
                  <h2 className="text-xl font-bold text-primary border-b border-border pb-2">
                    {category.name}
                  </h2>
                  <div className="grid gap-4">
                    {categoryItems.map(item => {
                      const quantity = getItemQuantity(item.id);
                      return (
                        <Card key={item.id} className="shadow-card hover:shadow-warm transition-smooth">
                          <CardContent className="p-4">
                            <div className="flex gap-4">
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0"
                                  loading="lazy"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-lg mb-1">{item.name}</h3>
                                {item.description && (
                                  <p className="text-muted-foreground text-sm mb-2">
                                    {item.description}
                                  </p>
                                )}
                                <p className="text-lg font-bold text-primary mb-3">
                                  {formatPrice(item.price)}
                                </p>
                                <div className="flex items-center justify-between">
                                  {quantity === 0 ? (
                                    <Button
                                      onClick={() => addToCart(item)}
                                      size="sm"
                                      className="w-20"
                                    >
                                      <Plus className="h-4 w-4 ml-1" />
                                      إضافة
                                    </Button>
                                  ) : (
                                    <div className="flex items-center gap-3">
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => removeFromCart(item.id)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Minus className="h-3 w-3" />
                                      </Button>
                                      <span className="font-medium min-w-[2rem] text-center">
                                        {quantity}
                                      </span>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => addToCart(item)}
                                        className="h-8 w-8 p-0"
                                      >
                                        <Plus className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Sticky Cart Summary */}
        {cart.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-20">
            <div className="container mx-auto">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    {getTotalItems()} صنف في السلة
                  </p>
                  <p className="text-lg font-bold">
                    المجموع: {formatPrice(getTotalPrice())}
                  </p>
                </div>
              </div>
              <Button
                onClick={handleSendToWhatsApp}
                className="w-full gradient-hero text-white"
                size="lg"
              >
                <MessageCircle className="h-5 w-5 ml-2" />
                إرسال الطلب عبر واتساب
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicMenu;