import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, ShoppingCart } from 'lucide-react';
import { formatWhatsAppMessage } from '@/lib/whatsapp';
import { useTranslation } from '@/hooks/useTranslation';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone_number: string | null;
  logo_url: string | null;
  primary_color: string | null;
}

interface Category {
  id: string;
  name: string;
  display_order: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  is_available: boolean;
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
  const { t, isRTL } = useTranslation();
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
          
          // Still fetch fresh data in background
          fetchFreshData();
          return;
        }
      }

      await fetchFreshData();
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل القائمة",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const fetchFreshData = async () => {
    try {
      // Fetch tenant
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (tenantError || !tenantData) {
        throw new Error('Restaurant not found');
      }

      setTenant(tenantData);

      // Fetch categories and menu items
      const [categoriesResponse, menuItemsResponse] = await Promise.all([
        supabase
          .from('menu_categories')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .eq('is_active', true)
          .order('display_order'),
        supabase
          .from('menu_items')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .order('display_order')
      ]);

      if (categoriesResponse.error) throw categoriesResponse.error;
      if (menuItemsResponse.error) throw menuItemsResponse.error;

      setCategories(categoriesResponse.data || []);
      setMenuItems(menuItemsResponse.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching fresh data:', error);
      setLoading(false);
    }
  };

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

  const getTotalPrice = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const formatPrice = (price: number) => {
    return `${price.toLocaleString()} ${t('common.currency')}`;
  };

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId);
  };

  const handleSendToWhatsApp = () => {
    if (!tenant?.phone_number) {
      toast({
        title: t('publicMenu.restaurantNotFound'),
        description: "رقم الهاتف غير متوفر",
        variant: "destructive",
      });
      return;
    }

    const message = formatWhatsAppMessage({
      restaurantName: tenant.name,
      orderType: orderType === 'delivery' ? t('publicMenu.delivery') : t('publicMenu.pickup'),
      items: cart,
      total: getTotalPrice(),
      currency: t('common.currency')
    });

    const whatsappUrl = `https://wa.me/${tenant.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('publicMenu.restaurantNotFound')}</h1>
          <p className="text-muted-foreground">يرجى التحقق من الرابط والمحاولة مرة أخرى</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Restaurant Header - Clean and Simple */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {tenant.logo_url && (
              <img 
                src={tenant.logo_url} 
                alt={tenant.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-foreground">{tenant.name}</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24">
        {/* Order Type Selection */}
        <div className="mb-6">
          <p className="text-sm font-medium mb-3">{t('publicMenu.orderType')}</p>
          <div className="flex gap-2">
            <Button
              variant={orderType === 'delivery' ? 'default' : 'outline'}
              onClick={() => setOrderType('delivery')}
              className="flex-1"
            >
              {t('publicMenu.delivery')}
            </Button>
            <Button
              variant={orderType === 'pickup' ? 'default' : 'outline'}
              onClick={() => setOrderType('pickup')}
              className="flex-1"
            >
              {t('publicMenu.pickup')}
            </Button>
          </div>
        </div>

        {/* Menu Categories and Items */}
        <div className="space-y-8">
          {categories.map(category => (
            <section key={category.id} className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                {category.name}
              </h2>
              <div className="grid gap-4">
                {getItemsForCategory(category.id).map(item => (
                  <Card key={item.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-grow min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-grow">
                              <h3 className="font-medium text-foreground truncate">{item.name}</h3>
                              {item.description && (
                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              <p className="text-sm font-semibold text-primary mt-2">
                                {formatPrice(item.price)}
                              </p>
                            </div>
                            {!item.is_available && (
                              <Badge variant="secondary" className="text-xs">
                                {t('common.unavailable')}
                              </Badge>
                            )}
                          </div>
                          
                          {item.is_available && (
                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center gap-2">
                                {getItemQuantity(item.id) > 0 && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Minus size={14} />
                                  </Button>
                                )}
                                {getItemQuantity(item.id) > 0 && (
                                  <span className="text-sm font-medium min-w-[2rem] text-center">
                                    {getItemQuantity(item.id)}
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Plus size={14} />
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>

      {/* Sticky Cart Footer */}
      {getTotalItems() > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 z-20">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart size={18} />
                <span className="text-sm text-muted-foreground">
                  {getTotalItems()} {t('publicMenu.itemsInCart')}
                </span>
              </div>
              <div className="text-lg font-semibold">
                {formatPrice(getTotalPrice())}
              </div>
            </div>
            <Button 
              onClick={handleSendToWhatsApp}
              className="w-full gradient-hero text-primary-foreground font-semibold"
              size="lg"
            >
              {t('publicMenu.sendOrder')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicMenu;