import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, ArrowRight, Menu, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import CategoryManager from '@/components/menu/CategoryManager';
import MenuItemManager from '@/components/menu/MenuItemManager';
import MenuPreview from '@/components/menu/MenuPreview';

interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
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
  created_at: string;
}

const MenuManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>('');

  useEffect(() => {
    fetchTenantAndMenu();
  }, []);

  const fetchTenantAndMenu = async () => {
    try {
      // Get tenant ID using the RPC function
      const { data: tenantId, error: rpcError } = await supabase.rpc('get_user_tenant');

      if (rpcError) throw rpcError;

      if (tenantId) {
        setTenantId(tenantId);
        await fetchMenuData(tenantId);
      } else {
        throw new Error("User has no tenant");
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحميل بيانات القائمة",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuData = async (tenant_id: string) => {
    // Fetch categories
    const { data: categoriesData } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('display_order');

    // Fetch menu items
    const { data: itemsData } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('display_order');

    setCategories(categoriesData || []);
    setMenuItems(itemsData || []);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pt-16" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
              إدارة القائمة
            </h1>
            <p className="text-muted-foreground mt-1">
              بناء وتخصيص قائمة طعام المطعم
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للوحة التحكم
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Menu className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{categories.length}</p>
                  <p className="text-muted-foreground">فئات القائمة</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-2xl font-bold">{menuItems.length}</p>
                  <p className="text-muted-foreground">إجمالي الأصناف</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Package className="h-8 w-8 text-fresh-green" />
                <div>
                  <p className="text-2xl font-bold">{menuItems.filter(item => item.is_available).length}</p>
                  <p className="text-muted-foreground">أصناف متوفرة</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Management Tabs */}
        <Tabs defaultValue="categories" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="categories">الفئات</TabsTrigger>
            <TabsTrigger value="items">الأصناف</TabsTrigger>
            <TabsTrigger value="preview">معاينة القائمة</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            <CategoryManager 
              categories={categories}
              tenantId={tenantId}
              onCategoriesChange={(updatedCategories) => {
                setCategories(updatedCategories);
                fetchMenuData(tenantId); // Refresh to get updated data
              }}
            />
          </TabsContent>

          <TabsContent value="items">
            <MenuItemManager 
              categories={categories}
              menuItems={menuItems}
              tenantId={tenantId}
              onMenuItemsChange={(updatedItems) => {
                setMenuItems(updatedItems);
                fetchMenuData(tenantId); // Refresh to get updated data
              }}
            />
          </TabsContent>

          <TabsContent value="preview">
            <MenuPreview 
              categories={categories}
              menuItems={menuItems}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MenuManagement;