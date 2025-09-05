import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Minus, ShoppingCart, Vegan, Flame } from "lucide-react";
import { generateWhatsAppMessage } from "@/lib/whatsapp"; // WhatsApp integration
import { useTranslation } from "@/hooks/useTranslation";
import { useToast } from "@/hooks/use-toast";
import { MenuSkeleton } from "@/components/menu/MenuSkeleton";
import { VscFlame } from "@/components/icons/VscFlame";
import { VscVm } from "@/components/icons/VscVm";

/**
 * Represents a tenant (restaurant) with public-facing information.
 */
interface Tenant {
  id: string;
  name: string;
  slug: string;
  phone_number: string | null;
  logo_url: string | null;
  cover_photo_url: string | null;
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
  id:string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: string;
  is_available: boolean;
  dietary_preferences: ('vegetarian' | 'spicy' | 'gluten-free')[];
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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

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
          if (data.categories.length > 0) {
            setActiveCategory(data.categories[0].id);
          }
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

  useEffect(() => {
    const handleScroll = () => {
      const categoryElements = categories.map(c => document.getElementById(`category-${c.id}`));
      const offset = window.innerHeight * 0.4; // 40% from the top

      for (let i = categoryElements.length - 1; i >= 0; i--) {
        const el = categoryElements[i];
        if (el && el.getBoundingClientRect().top <= offset) {
          setActiveCategory(categories[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [categories]);

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

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      const headerOffset = 80; // Adjust for sticky header/app bar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
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
    return <MenuSkeleton />;
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
      {/* Restaurant Header - Enhanced with Cover Photo */}
      <header className="relative h-48 md:h-64 w-full">
        <img
          src={tenant.cover_photo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop'}
          alt={t('publicMenu.restaurantCoverImage', 'Restaurant Cover Image')}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          <div className="container mx-auto flex items-center gap-4">
            {tenant.logo_url && (
              <img
                src={tenant.logo_url}
                alt={t('publicMenu.restaurantLogo')}
                className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover border-2 border-background shadow-lg"
              />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white shadow-text">
                {tenant.name}
              </h1>
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
          <aside className="hidden md:block md:col-span-1 sticky top-24 self-start">
            <h2 className="text-lg font-semibold mb-4">{t('publicMenu.categories', 'Categories')}</h2>
            <nav className="space-y-2">
              {categories.map(category => (
                <a
                  key={category.id}
                  href={`#category-${category.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToCategory(category.id);
                  }}
                  className={`block px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  {category.name}
                </a>
              ))}
            </nav>
          </aside>
          <div className="md:col-span-3">
            {categories.map(category => (
              <section key={category.id} id={`category-${category.id}`} className="space-y-4 mb-8">
                 <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
                    {category.name}
                  </h2>
                <div className="grid gap-4 mt-4 sm:grid-cols-2 lg:grid-cols-3">
                  {getItemsForCategory(category.id).map(item => (
                    <Card
                      key={item.id}
                      className="overflow-hidden shadow-card transition-all duration-300 hover:shadow-lg flex flex-col md:flex-row md:items-center"
                    >
                      <img
                        src={item.image_url || '/placeholder.svg'}
                        alt={item.name}
                        className="w-full h-40 md:w-32 md:h-32 object-cover"
                      />
                      <CardContent className="p-4 flex flex-col flex-grow justify-between">
                        <div>
                          <h3 className="font-bold text-lg text-foreground">{item.name}</h3>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {item.dietary_preferences?.includes('vegetarian') && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <VscVm className="h-5 w-5 text-green-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t('dietary.vegetarian', 'Vegetarian')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {item.dietary_preferences?.includes('spicy') && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <VscFlame className="h-5 w-5 text-red-600" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{t('dietary.spicy', 'Spicy')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between mt-4">
                          <p className="text-lg font-semibold text-primary">
                            {formatPrice(item.price)}
                          </p>

                          {item.is_available ? (
                            <div className="flex items-center gap-2">
                              {getItemQuantity(item.id) > 0 && (
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
                              )}
                              <Button
                                size="sm"
                                onClick={() => addToCart(item)}
                                className="h-9 w-9 p-0 rounded-full"
                              >
                                <Plus size={16} />
                              </Button>
                            </div>
                          ) : (
                            <Badge variant="secondary" className="text-xs">
                              {t('common.unavailable', 'Unavailable')}
                            </Badge>
                          )}
                        </div>
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
