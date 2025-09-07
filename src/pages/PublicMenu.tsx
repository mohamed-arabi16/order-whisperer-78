import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  Minus, Plus, ShoppingCart, Star, MessageCircle, Search, Heart, 
  X, ArrowLeft, Clock, Loader2, Phone, MapPin, Utensils
} from "lucide-react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { generateWhatsAppMessage, openWhatsApp, validatePhoneNumber } from "@/lib/whatsapp";
import PublicMenuSkeleton from "@/components/menu/PublicMenuSkeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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
      duration: 1500,
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
      toast.success("تم إزالة العنصر من المفضلة");
    } else {
      newFavorites.add(itemId);
      toast.success("تم إضافة العنصر إلى المفضلة");
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
                <h1 className="text-xl font-bold gradient-hero bg-clip-text text-transparent">
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
            
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              {tenant.phone_number && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`tel:${tenant.phone_number}`)}
                  className="hidden sm:flex"
                >
                  <Phone className="w-4 h-4 ml-1" />
                  اتصل بنا
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="sticky top-[88px] z-40 bg-background/95 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث عن الأطباق..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 rounded-full border-0 bg-muted/50 focus:bg-background transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="sticky top-[144px] z-30 bg-background/90 backdrop-blur-md border-b">
        <div className="container mx-auto px-4">
          <div 
            ref={categoryTabsRef}
            className="flex overflow-x-auto scrollbar-hide gap-2 py-3"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "ghost"}
                size="sm"
                onClick={() => scrollToCategory(category.id)}
                className={`whitespace-nowrap rounded-full transition-all ${
                  activeCategory === category.id 
                    ? 'bg-primary text-primary-foreground shadow-glow' 
                    : 'hover:bg-muted/80'
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Restaurant Overview */}
      {tenant && (
        <div className="container mx-auto px-4 py-6">
          <Card className="glass border-0 mb-8">
            <CardContent className="p-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2 gradient-hero bg-clip-text text-transparent">
                  مرحباً بكم في {tenant.name}
                </h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  اكتشف أشهى الأطباق من مطبخنا المميز. نقدم لكم أفضل الوصفات التقليدية والعصرية بأعلى جودة ونكهات لا تُنسى.
                </p>
                {tenant.address && (
                  <div className="flex items-center justify-center gap-2 mt-4 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{tenant.address}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
                {categoryItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="group overflow-hidden hover:shadow-warm transition-all duration-300 glass border-0">
                      <CardContent className="p-0">
                        <div className={`flex ${isRTL ? 'flex-row-reverse' : 'flex-row'} gap-0`}>
                          {/* Image Section */}
                          <div className="relative w-32 h-32 flex-shrink-0">
                            {item.image_url ? (
                              <LazyLoadImage
                                src={item.image_url}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                effect="blur"
                                onClick={() => setSelectedItem(item)}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
                                <Utensils className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                            
                            {/* Featured Badge */}
                            {item.is_featured && (
                              <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs">
                                مُوصى
                              </Badge>
                            )}
                          </div>

                          {/* Content Section */}
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div className="space-y-1">
                              <div className="flex items-start justify-between">
                                <h3 className="font-semibold text-lg leading-tight">{item.name}</h3>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="p-1 rounded-full hover:bg-muted ml-2"
                                  onClick={() => toggleFavorite(item.id)}
                                >
                                  <Heart 
                                    className={`w-4 h-4 transition-colors ${
                                      favorites.has(item.id) 
                                        ? 'fill-red-500 text-red-500' 
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                </Button>
                              </div>
                              {item.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                              <span className="text-lg font-bold text-primary">
                                {formatPrice(item.price)}
                              </span>
                              
                              {getItemQuantity(item.id) > 0 ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => removeFromCart(item.id)}
                                    className="h-8 w-8 p-0 rounded-full"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </Button>
                                  <span className="font-medium min-w-[24px] text-center">
                                    {getItemQuantity(item.id)}
                                  </span>
                                  <Button
                                    size="sm"
                                    onClick={() => addToCart(item)}
                                    className="h-8 w-8 p-0 rounded-full"
                                    disabled={isAddingToCart === item.id}
                                  >
                                    {isAddingToCart === item.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Plus className="w-3 h-3" />
                                    )}
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => addToCart(item)}
                                  className="rounded-full hover-lift"
                                  disabled={isAddingToCart === item.id}
                                >
                                  {isAddingToCart === item.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin ml-1" />
                                  ) : (
                                    <Plus className="w-4 h-4 ml-1" />
                                  )}
                                  إضافة
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {categoryItems.length === 0 && (
                <div className="text-center py-12">
                  <Utensils className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'لا توجد أطباق تطابق البحث' : 'لا توجد أطباق في هذا القسم'}
                  </p>
                </div>
              )}
            </motion.section>
          );
        })}
      </div>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50"
          >
            <motion.div animate={cartAnimation}>
              <Button
                onClick={() => setShowCart(true)}
                size="lg"
                className="rounded-full shadow-glow px-6 py-3 bg-primary hover:bg-primary/90"
              >
                <ShoppingCart className="w-5 h-5 ml-2" />
                <span className="font-semibold">
                  السلة ({totalItems}) - {formatPrice(totalPrice)}
                </span>
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Dialog */}
      <Dialog open={showCart} onOpenChange={setShowCart}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              سلة التسوق ({totalItems} عنصر)
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
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
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-medium min-w-[24px] text-center">
                      {item.quantity}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => {
                        const menuItem = menuItems.find(mi => mi.id === item.id);
                        if (menuItem) addToCart(menuItem);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="font-semibold text-primary">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between text-lg font-bold">
              <span>المجموع:</span>
              <span className="text-primary">{formatPrice(totalPrice)}</span>
            </div>
            
            <Button
              onClick={handleWhatsAppOrder}
              disabled={isProcessingOrder}
              size="lg"
              className="w-full rounded-full bg-fresh-green hover:bg-fresh-green/90 text-white"
            >
              {isProcessingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin ml-2" />
                  جاري الإرسال...
                </>
              ) : (
                <>
                  <MessageCircle className="w-5 h-5 ml-2" />
                  إرسال عبر الواتساب
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Item Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-lg" dir={isRTL ? 'rtl' : 'ltr'}>
          {selectedItem && (
            <>
              <div className="aspect-square overflow-hidden rounded-lg bg-muted mb-4">
                {selectedItem.image_url ? (
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
                    <Utensils className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedItem.name}</h2>
                  {selectedItem.description && (
                    <p className="text-muted-foreground">{selectedItem.description}</p>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">
                    {formatPrice(selectedItem.price)}
                  </span>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleFavorite(selectedItem.id)}
                    >
                      <Heart 
                        className={`w-4 h-4 ${
                          favorites.has(selectedItem.id) 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                    
                    <Button
                      onClick={() => {
                        addToCart(selectedItem);
                        setSelectedItem(null);
                      }}
                      className="rounded-full"
                    >
                      <Plus className="w-4 h-4 ml-1" />
                      إضافة للسلة
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog open={showFeedback} onOpenChange={setShowFeedback}>
        <DialogContent className="max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>تقييم تجربتك</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">التقييم</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Button
                    key={star}
                    variant="ghost"
                    size="sm"
                    onClick={() => setFeedback({...feedback, rating: star})}
                    className="p-1"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= feedback.rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted-foreground'
                      }`}
                    />
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">تعليق (اختياري)</label>
              <Textarea
                placeholder="شاركنا رأيك..."
                value={feedback.comment}
                onChange={(e) => setFeedback({...feedback, comment: e.target.value})}
              />
            </div>
            
            <Button
              onClick={async () => {
                if (feedback.rating > 0) {
                  try {
                    await supabase.from('feedback').insert({
                      tenant_id: tenant?.id,
                      rating: feedback.rating,
                      comment: feedback.comment || null,
                    });
                    toast.success("شكراً لتقييمك!");
                    setShowFeedback(false);
                    setFeedback({ rating: 0, comment: "" });
                  } catch (error) {
                    toast.error("حدث خطأ أثناء إرسال التقييم");
                  }
                }
              }}
              disabled={feedback.rating === 0}
              className="w-full"
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