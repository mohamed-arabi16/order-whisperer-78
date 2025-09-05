import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Minus, ShoppingCart } from "lucide-react";
import { generateWhatsAppMessage } from "@/lib/whatsapp"; // WhatsApp integration
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";

/**
 * Represents a tenant (restaurant) with public-facing information.
 */
interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone_number: string | null;
  logo_url: string | null;
  primary_color: string | null;
}

/**
 * Represents a menu category.
 */
interface Category {
  id: string;
  name: string;
  display_order: number;
}

/**
 * Represents a menu item.
 */
interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  is_available: boolean;
}

/**
 * Represents an item in the shopping cart.
 */
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

/**
 * A page component that displays a public-facing menu for a restaurant.
 * It allows customers to browse the menu, add items to a cart, and send the order via WhatsApp.
 *
 * @returns {JSX.Element} The rendered public menu page.
 */
const PublicMenu = (): JSX.Element => {
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
    const fetchMenu = async () => {
      if (!slug) return;

      setLoading(true);
      try {
        console.log(`Fetching menu for slug: ${slug}`);
        const { data, error } = await supabase.rpc('get_public_menu_data', { p_slug: slug });

        if (error) {
          console.error('Error calling get_public_menu_data RPC:', error);
          throw new Error('Failed to fetch menu data.');
        }

        if (!data) {
          console.log(`No data returned for slug: ${slug}. Tenant likely not found or inactive.`);
          setTenant(null);
          setCategories([]);
          setMenuItems([]);
        } else {
          console.log('Successfully fetched menu data:', data);
          setTenant(data.tenant);
          setCategories(data.categories);
          setMenuItems(data.menu_items);
        }
      } catch (err) {
        console.error('An unexpected error occurred:', err);
        toast({
          title: t('publicMenu.menuLoadErrorTitle'),
          description: t('publicMenu.menuLoadErrorDescription'),
          variant: "destructive",
        });
        // Ensure we don't show a broken page
        setTenant(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [slug, t, toast]);

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
        description: t('publicMenu.phoneNotAvailable'),
        variant: "destructive",
      });
      return;
    }

    const message = generateWhatsAppMessage({
      restaurantName: tenant.name,
      orderType: orderType === 'delivery' ? t('publicMenu.delivery') : t('publicMenu.pickup'),
      items: cart,
      totalPrice: getTotalPrice()
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
          <p className="text-muted-foreground">{t('publicMenu.checkLink')}</p>
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
                alt={t('publicMenu.restaurantLogo')}
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
        <div className="md:grid md:grid-cols-4 md:gap-8">
          <aside className="md:col-span-1 md:sticky md:top-[104px] h-fit">
            <h2 className="text-lg font-semibold mb-4 hidden md:block">{t('publicMenu.categories')}</h2>
            <Tabs defaultValue={categories[0]?.id} orientation="vertical" className="w-full">
              <TabsList className="md:flex-col md:items-start md:h-auto w-full justify-start overflow-x-auto p-2 h-auto bg-transparent">
                {categories.map(category => (
                  <TabsTrigger key={category.id} value={category.id} className="flex-shrink-0 md:w-full md:justify-start">
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </aside>
          <div className="md:col-span-3">
            {categories.map(category => (
              <section key={category.id} id={`category-${category.id}`} className="space-y-4 mb-8">
                 <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                    {category.name}
                  </h2>
                <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                  {getItemsForCategory(category.id).map(item => (
                    <Card key={item.id} className="overflow-hidden shadow-card gradient-card flex flex-col">
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={t('publicMenu.menuItemImage')}
                          className="w-full h-40 object-cover"
                        />
                      )}
                      <CardContent className="p-4 flex flex-col flex-grow">
                        <div className="flex-grow">
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
                          <Badge variant="secondary" className="text-xs mt-2 self-start">
                            {t('common.unavailable')}
                          </Badge>
                        )}

                        {item.is_available && (
                          <div className="flex items-center justify-end mt-4">
                            <div className="flex items-center gap-2">
                              {getItemQuantity(item.id) > 0 ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-9 w-9 p-0 rounded-full"
                                  >
                                    <Minus size={16} />
                                  </Button>
                                  <span className="text-base font-bold min-w-[2rem] text-center">
                                    {getItemQuantity(item.id)}
                                  </span>
                                </>
                              ) : null}
                              <Button
                                size="sm"
                                onClick={() => addToCart(item)}
                                className="h-9 w-9 p-0 rounded-full"
                              >
                                <Plus size={16} />
                              </Button>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            ))}
          </div>
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
