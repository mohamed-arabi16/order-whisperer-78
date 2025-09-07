import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Star, MessageCircle, X, ArrowLeft, Clock, Loader2, Phone, MapPin, Utensils
} from "lucide-react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { generateWhatsAppMessage, openWhatsApp, validatePhoneNumber } from "@/lib/whatsapp";
import PublicMenuSkeleton from "@/components/menu/PublicMenuSkeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { StickyNavigation } from "@/components/menu/StickyNavigation";
import { EnhancedCartBar } from "@/components/menu/EnhancedCartBar";
import { RestaurantOverview } from "@/components/menu/RestaurantOverview";

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
  is_featured?: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const PublicMenu = (): JSX.Element => {
  const { slug } = useParams();
  const { t, isRTL } = useTranslation();
  
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 0, comment: "" });
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState<string | null>(null);

  // Animation controls
  const cartAnimation = useAnimation();
  const categoryTabsRef = useRef<HTMLDivElement>(null);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      if (!slug) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch tenant
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('slug', slug)
          .single();

        if (tenantError) throw tenantError;
        if (!tenantData) throw new Error('Restaurant not found');

        setTenant(tenantData);

        // Fetch categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('menu_categories')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .eq('is_active', true)
          .order('display_order');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

        // Fetch menu items
        const { data: itemsData, error: itemsError } = await supabase
          .from('menu_items')
          .select('*')
          .eq('tenant_id', tenantData.id)
          .eq('is_available', true)
          .order('display_order');

        if (itemsError) throw itemsError;
        setMenuItems(itemsData || []);

        if (categoriesData && categoriesData.length > 0) {
          setActiveCategory(categoriesData[0].id);
        }

      } catch (error: any) {
        console.error('Error fetching menu data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug]);

  // Cart functions
  const addToCart = async (item: MenuItem) => {
    setIsAddingToCart(item.id);
    
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem =>
        cartItem.id === item.id
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        quantity: 1 
      }]);
    }

    // Animate cart icon
    await cartAnimation.start({
      scale: [1, 1.2, 1],
      transition: { duration: 0.3 }
    });

    toast.success(`${item.name} أُضيف إلى السلة`, {
      duration: 2000,
      position: "bottom-center",
    });

    setTimeout(() => setIsAddingToCart(null), 300);
  };

  const removeFromCart = (itemId: string) => {
    const existingItem = cart.find(cartItem => cartItem.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(cartItem =>
        cartItem.id === itemId
          ? { ...cartItem, quantity: cartItem.quantity - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(cartItem => cartItem.id !== itemId));
    }
  };

  const getItemQuantity = (itemId: string): number => {
    const item = cart.find(cartItem => cartItem.id === itemId);
    return item ? item.quantity : 0;
  };

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
      toast.success("تم إزالة العنصر من المفضلة", { duration: 2000 });
    } else {
      newFavorites.add(itemId);
      toast.success("تم إضافة العنصر إلى المفضلة", { duration: 2000 });
    }
    setFavorites(newFavorites);
  };

  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveCategory(categoryId);
    }
  };

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    let items = menuItems;
    
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return items;
  }, [menuItems, searchQuery]);

  const getItemsForCategory = (categoryId: string) => {
    return filteredItems.filter(item => item.category_id === categoryId);
  };

  const totalPrice = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const formatPrice = (price: number): string => {
    return `${price.toLocaleString()} ل.س`;
  };

  const handleWhatsAppOrder = async () => {
    if (!tenant?.phone_number) {
      toast.error("رقم هاتف المطعم غير متوفر");
      return;
    }

    if (!validatePhoneNumber(tenant.phone_number)) {
      toast.error("رقم هاتف المطعم غير صحيح");
      return;
    }

    if (cart.length === 0) {
      toast.error("السلة فارغة");
      return;
    }

    setIsProcessingOrder(true);

    try {
      // Log order for analytics (best effort, don't fail if it doesn't work)
      try {
        await supabase.rpc('log_menu_view', {
          tenant_id_param: tenant.id
        });
      } catch (error) {
        console.log('Analytics logging failed:', error);
      }

      // Generate WhatsApp message
      const message = generateWhatsAppMessage({
        restaurantName: tenant.name,
        items: cart,
        orderType: 'طلب توصيل',
        totalPrice: totalPrice
      });
      openWhatsApp(tenant.phone_number, message);

      // Clear cart
      setCart([]);
      setShowCart(false);
      toast.success("تم إرسال طلبك عبر الواتساب!");

    } catch (error: any) {
      console.error('Error processing order:', error);
      toast.error("حدث خطأ أثناء معالجة الطلب");
    } finally {
      setIsProcessingOrder(false);
    }
  };

  if (loading) return <PublicMenuSkeleton />;
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="max-w-md w-full shadow-warm text-center">
          <CardContent className="p-8">
            <div className="text-destructive text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold mb-2">خطأ في تحميل القائمة</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tenant) return null;

  return (
    <div className="min-h-screen bg-gradient-subtle" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Restaurant Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b shadow-elegant">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {tenant.logo_url && (
                <LazyLoadImage
                  src={tenant.logo_url}
                  alt={tenant.name}
                  className="w-12 h-12 rounded-full object-cover shadow-glow"
                  effect="blur"
                />
              )}
              <div>
                <h1 
                  className="text-xl font-bold"
                  style={{ color: tenant.primary_color || 'hsl(var(--primary))' }}
                >
                  {tenant.name}
                </h1>
                {tenant.address && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {tenant.address}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2 sm:hidden">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Navigation */}
      <StickyNavigation
        categories={categories}
        activeCategory={activeCategory}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCategorySelect={scrollToCategory}
        phoneNumber={tenant.phone_number || undefined}
        primaryColor={tenant.primary_color || undefined}
      />

      {/* Restaurant Overview */}
      <RestaurantOverview tenant={tenant} />

      {/* Menu Content */}
      <div className="container mx-auto px-4 py-0 pb-32">
        {categories.map((category) => {
          const categoryItems = getItemsForCategory(category.id);
          if (categoryItems.length === 0 && searchQuery) return null;
          
          return (
            <motion.section
              key={category.id}
              id={`category-${category.id}`}
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center gap-2 mb-6">
                <Utensils className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold">{category.name}</h2>
                <Separator className="flex-1" />
              </div>

              <div className="space-y-4">
                {categoryItems.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    quantity={getItemQuantity(item.id)}
                    isFavorite={favorites.has(item.id)}
                    isAddingToCart={isAddingToCart === item.id}
                    onAddToCart={() => addToCart(item)}
                    onRemoveFromCart={() => removeFromCart(item.id)}
                    onToggleFavorite={() => toggleFavorite(item.id)}
                    onViewDetails={() => setSelectedItem(item)}
                    primaryColor={tenant.primary_color || undefined}
                  />
                ))}
              </div>
            </motion.section>
          );
        })}
      </div>

      {/* Enhanced Cart Bar */}
      <EnhancedCartBar
        cart={cart}
        totalPrice={totalPrice}
        totalItems={totalItems}
        onShowCart={() => setShowCart(true)}
        primaryColor={tenant.primary_color || undefined}
        restaurantName={tenant.name}
        cartAnimation={cartAnimation}
      />

      {/* Cart Modal */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md mx-auto max-h-[80vh] overflow-hidden flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-center">سلة التسوق</DialogTitle>
            {tenant.name && (
              <p className="text-sm text-muted-foreground text-center">
                {tenant.name}
              </p>
            )}
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4 min-h-0">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 rounded-lg bg-muted/30">
                <div className="flex-1">
                  <h4 className="font-medium">{item.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatPrice(item.price)} × {item.quantity}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => removeFromCart(item.id)}
                    className="h-8 w-8 p-0"
                  >
                    -
                  </Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button
                    size="sm"
                    onClick={() => addToCart({ 
                      id: item.id, 
                      name: item.name, 
                      price: item.price, 
                      description: null, 
                      image_url: null, 
                      category_id: '', 
                      is_available: true, 
                      display_order: 0 
                    } as MenuItem)}
                    className="h-8 w-8 p-0"
                    style={{ backgroundColor: tenant.primary_color || undefined }}
                  >
                    +
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex-shrink-0 pt-4 border-t space-y-4">
            <div className="flex justify-between items-center font-bold text-lg">
              <span>المجموع:</span>
              <span style={{ color: tenant.primary_color || 'hsl(var(--primary))' }}>
                {formatPrice(totalPrice)}
              </span>
            </div>
            
            <Button
              onClick={handleWhatsAppOrder}
              disabled={isProcessingOrder || cart.length === 0}
              className="w-full h-12 text-lg"
              style={{ backgroundColor: tenant.primary_color || undefined }}
            >
              {isProcessingOrder ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                "إرسال الطلب عبر واتساب"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Details Modal */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-md mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {selectedItem.image_url && (
                  <LazyLoadImage
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="w-full h-48 object-cover rounded-lg"
                    effect="blur"
                  />
                )}
                {selectedItem.description && (
                  <p className="text-muted-foreground">{selectedItem.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span 
                    className="text-2xl font-bold"
                    style={{ color: tenant.primary_color || 'hsl(var(--primary))' }}
                  >
                    {formatPrice(selectedItem.price)}
                  </span>
                  <Button
                    onClick={() => {
                      addToCart(selectedItem);
                      setSelectedItem(null);
                    }}
                    className="px-6"
                    style={{ backgroundColor: tenant.primary_color || undefined }}
                  >
                    أضف إلى السلة
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-md mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>تقييم تجربتك</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Button
                  key={star}
                  variant="ghost"
                  size="sm"
                  onClick={() => setFeedback({ ...feedback, rating: star })}
                  className="p-1"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= feedback.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                </Button>
              ))}
            </div>
            <Textarea
              placeholder="اكتب تعليقك هنا (اختياري)"
              value={feedback.comment}
              onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
              className="min-h-20"
            />
            <Button
              onClick={() => {
                toast.success("شكراً لك على تقييمك!");
                setShowFeedback(false);
                setFeedback({ rating: 0, comment: "" });
              }}
              className="w-full"
              disabled={feedback.rating === 0}
              style={{ backgroundColor: tenant.primary_color || undefined }}
            >
              إرسال التقييم
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PublicMenu;