import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Minus, Plus, ShoppingCart, Star, MessageCircle, Utensils, Loader2 } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { useScrollSpy } from "@/hooks/useScrollSpy";
import { useInView } from "react-intersection-observer";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";
import { Textarea } from "@/components/ui/textarea";
import { generateWhatsAppMessage, openWhatsApp, validatePhoneNumber } from "@/lib/whatsapp";
import PublicMenuSkeleton from "@/components/menu/PublicMenuSkeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";

interface Tenant {
  id:string;
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
  const [isProcessingOrder, setIsProcessingOrder] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const { ref, inView } = useInView({
    threshold: 0,
  });

  const categorySelectors = useMemo(() => categories.map(c => `#category-${c.id}`), [categories]);
  const activeCategoryId = useScrollSpy(categorySelectors, {
    rootMargin: '0px 0px -50% 0px',
  });

  useEffect(() => {
    if (activeCategoryId) {
      setActiveCategory(activeCategoryId.replace('category-', ''));
    }
  }, [activeCategoryId]);

  const ITEMS_PER_PAGE = 20;

  const loadMoreItems = async () => {
    if (isFetchingMore || !hasMore || !tenant?.id) return;

    setIsFetchingMore(true);
    try {
      const { data: itemsData, error: itemsError } = await supabase
        .from("menu_items")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("display_order")
        .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1);

      if (itemsError) {
        throw itemsError;
      }

      setMenuItems(prev => [...prev, ...itemsData]);
      setPage(prev => prev + 1);
      if (itemsData.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error fetching more menu items:", err);
      toast.error("Failed to load more items.");
    } finally {
      setIsFetchingMore(false);
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      if (!slug) return;

      setLoading(true);
      try {
        const { data: tenantData, error: tenantError } = await supabase
          .from("tenants")
          .select("*")
          .eq("slug", slug)
          .eq("is_active", true)
          .single();

        if (tenantError || !tenantData) {
          setError("المطعم غير موجود");
          setLoading(false);
          return;
        }

        setTenant(tenantData);

        const { data: categoriesData } = await supabase
          .from("menu_categories")
          .select("*")
          .eq("tenant_id", tenantData.id)
          .eq("is_active", true)
          .order("display_order");

        setCategories(categoriesData || []);
        if (categoriesData && categoriesData.length > 0 && !activeCategory) {
          setActiveCategory(categoriesData[0].id);
        }

        setError(null);
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("حدث خطأ غير متوقع");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [slug]);

  useEffect(() => {
    if (tenant?.id) {
      loadMoreItems();
    }
  }, [tenant?.id]);

  useEffect(() => {
    if (inView && hasMore && !isFetchingMore) {
      loadMoreItems();
    }
  }, [inView, hasMore, isFetchingMore]);

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
    toast.success(`${item.name} ${t('publicMenu.addToCart')}`);
  };

  const removeFromCart = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
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
    if (item) {
      toast.error(`${item.name} ${t('publicMenu.removeFromCart')}`);
    }
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

  const handleCategoryClick = (categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const totalPrice = useMemo(() => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cart]);

  const controls = useAnimation();
  useEffect(() => {
    if (totalPrice > 0) {
      controls.start({
        scale: [1, 1.2, 1],
        transition: { duration: 0.3 }
      });
    }
  }, [totalPrice, controls]);

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
      toast.error(t('publicMenu.errors.phoneNotAvailable'));
      return;
    }

    if (!validatePhoneNumber(tenant.phone_number)) {
      toast.error(t('publicMenu.errors.invalidPhone'));
      console.error("Invalid phone number provided:", tenant.phone_number);
      return;
    }

    setIsProcessingOrder(true);
    try {
      // Log order items
      await supabase.rpc('log_order_items', {
        tenant_id_param: tenant.id,
        items: cart.map(item => ({
          id: item.id,
          quantity: item.quantity,
        })),
      });

      // Log order
      await supabase.rpc('log_order', {
        tenant_id_param: tenant.id,
        total_price_param: totalPrice,
        order_type_param: 'whatsapp',
      });

      const message = generateWhatsAppMessage({
        restaurantName: tenant.name,
        items: cart,
        orderType: t('publicMenu.orderType.whatsapp'),
        totalPrice: totalPrice,
      });

      openWhatsApp(tenant.phone_number, message);
      
      setCart([]); // Clear cart after sending
      toast.success(t('publicMenu.toast.orderSuccess'));
    } catch (err) {
      console.error("Error processing order:", err);
      toast.error(t('publicMenu.errors.orderProcessing'));
    } finally {
      setIsProcessingOrder(false);
    }
  };

  if (loading) {
    return <PublicMenuSkeleton />;
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
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-background/50" dir="rtl">
        <Sidebar side="right" className="bg-card/95 backdrop-blur-xl border-l border-white/10 shadow-warm">
          <SidebarHeader>
            <div className="flex items-center gap-3 p-2">
              {tenant.logo_url && (
                <div className="relative">
                  <img
                    src={tenant.logo_url}
                    alt="شعار المطعم"
                    className="w-12 h-12 rounded-lg object-cover shadow-card"
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-lg" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">{tenant.name}</h1>
                <p className="text-sm text-muted-foreground">{tenant.address}</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {categories.map(category => (
                 <SidebarMenuItem key={category.id}>
                   <SidebarMenuButton
                     onClick={() => handleCategoryClick(category.id)}
                     isActive={activeCategory === category.id}
                     className="hover:bg-primary/10 transition-all duration-200 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-r-2 data-[state=active]:border-primary"
                   >
                     <motion.div
                       whileHover={{ scale: 1.1 }}
                       whileTap={{ scale: 0.9 }}
                       className="flex items-center gap-2"
                     >
                       <Utensils className="w-4 h-4" />
                       <span className="font-medium">{category.name}</span>
                     </motion.div>
                   </SidebarMenuButton>
                 </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
          {/* Header */}
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 border-b border-white/10 shadow-sm">
            <div className="container mx-auto px-4 py-3 flex items-center justify-between">
               <div className="flex items-center gap-2">
                 <SidebarTrigger className="md:hidden hover:bg-primary/10 transition-colors duration-200" />
                 <h1 className="text-lg font-bold md:hidden bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">{tenant.name}</h1>
               </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowFeedback(true)}
                    className="hover:bg-primary/10 hover:border-primary/30 transition-all duration-200"
                  >
                    <MessageCircle className="w-4 h-4 ml-2" />
                    تقييم
                  </Button>
                  <LanguageSwitcher />
                </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-6 pb-24">
            {/* Menu Items */}
            <div className="space-y-8">
              {categories.map(category => {
                const categoryItems = getItemsForCategory(category.id);
                if (categoryItems.length === 0) return null;

                return (
                   <section key={category.id} id={`category-${category.id}`} className="space-y-4 scroll-mt-20">
                     <motion.h2 
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ duration: 0.5 }}
                       className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent border-b border-primary/20 pb-2 flex items-center gap-2"
                     >
                       <Utensils className="w-6 h-6 text-primary" />
                       {category.name}
                     </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryItems.map((item, index) => (
                        <motion.div
                          key={item.id}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.03 }}
          whileHover={{ 
            scale: 1.02, 
            y: -8,
            transition: { type: "spring", stiffness: 400, damping: 25 }
          }}
          className="group"
                        >
                           <Card className="overflow-hidden shadow-warm hover:shadow-glow transition-all duration-500 h-full flex flex-col backdrop-blur-sm bg-card/95 border border-white/10 group-hover:border-primary/30 group-hover:bg-card">
                             {item.image_url && (
                               <div className="relative overflow-hidden">
                                 <LazyLoadImage
                                   alt={item.name}
                                   src={item.image_url}
                                   effect="blur"
                                   className="w-full h-40 object-cover transition-transform duration-700 group-hover:scale-110"
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                               </div>
                             )}
                             <CardContent className="p-4 flex-1 flex flex-col justify-between">
                               <div>
                                 <h3 className="font-bold text-lg mb-1 text-foreground group-hover:text-primary transition-colors duration-300">{item.name}</h3>
                                 {item.description && (
                                   <p className="text-sm text-muted-foreground mb-3 min-h-[40px] line-clamp-2">
                                     {item.description}
                                   </p>
                                 )}
                               </div>
                               <div className="flex items-center justify-between mt-3">
                                 <span className="text-xl font-bold text-primary bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                                   {formatPrice(item.price)}
                                 </span>
                                 <div className="flex items-center gap-2">
                                   {getItemQuantity(item.id) > 0 ? (
                                     <div className="flex items-center gap-2 bg-primary/10 rounded-full p-1">
                                       <Button
                                         size="icon"
                                         variant="ghost"
                                         onClick={() => removeFromCart(item.id)}
                                         className="w-8 h-8 rounded-full hover:bg-destructive/20 hover:text-destructive transition-all duration-200"
                                       >
                                         <motion.div whileTap={{ scale: 0.8 }}>
                                           <Minus className="w-4 h-4" />
                                         </motion.div>
                                       </Button>
                                       <span className="text-lg font-medium w-8 text-center text-primary">
                                         {getItemQuantity(item.id)}
                                       </span>
                                       <Button
                                         size="icon"
                                         onClick={() => addToCart(item)}
                                         className="w-8 h-8 rounded-full gradient-hero hover:shadow-glow transition-all duration-200"
                                       >
                                         <motion.div whileTap={{ scale: 0.8 }}>
                                           <Plus className="w-4 h-4" />
                                         </motion.div>
                                       </Button>
                                     </div>
                                   ) : (
                                     <Button
                                       size="icon"
                                       onClick={() => addToCart(item)}
                                       className="w-10 h-10 rounded-full gradient-hero hover:shadow-glow hover:scale-110 transition-all duration-300"
                                     >
                                       <motion.div whileTap={{ scale: 0.8 }}>
                                         <Plus className="w-5 h-5" />
                                       </motion.div>
                                     </Button>
                                   )}
                                 </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>

            {categories.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">لا توجد فئات متاحة</p>
              </div>
            )}

            {hasMore && (
              <div ref={ref} className="flex justify-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {/* Cart */}
      {cart.length > 0 && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 md:p-4 z-50"
        >
          <div className="container mx-auto">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm md:text-base">
                {cart.length} صنف - {formatPrice(totalPrice)}
              </span>
              <Button onClick={handleWhatsAppOrder} size="sm" disabled={isProcessingOrder}>
                {isProcessingOrder ? (
                  <Loader2 className="w-4 h-4 md:ml-2 animate-spin" />
                ) : (
                  <motion.div animate={controls}>
                    <ShoppingCart className="w-4 h-4 ml-2" />
                  </motion.div>
                )}
                {isProcessingOrder ? 'جاري الإرسال...' : 'إرسال عبر واتساب'}
              </Button>
            </div>
          </div>
        </motion.div>
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
    </SidebarProvider>
  );
};

export default PublicMenu;