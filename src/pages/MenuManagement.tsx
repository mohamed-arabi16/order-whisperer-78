import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, ArrowRight, Menu, Package, Search, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Papa from "papaparse";
import { useToast } from "@/hooks/use-toast";
import CategoryManager from "@/components/menu/CategoryManager";
import MenuItemManager from "@/components/menu/MenuItemManager";
import MenuPreview from "@/components/menu/MenuPreview";

/**
 * Represents a menu category.
 */
interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

/**
 * Represents a menu item.
 */
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

/**
 * A page component for managing a restaurant's menu.
 * It provides a tabbed interface for managing categories, items, and previewing the menu.
 *
 * @returns {JSX.Element} The rendered menu management page.
 */
const MenuManagement = (): JSX.Element => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const filteredMenuItems = useMemo(() => {
    const filtered = menuItems.filter(item => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = item.name.toLowerCase().includes(searchTermLower);

      const matchesCategory =
        categoryFilter === 'all' || item.category_id === categoryFilter;

      const matchesAvailability =
        availabilityFilter === 'all' ||
        (availabilityFilter === 'available' && item.is_available) ||
        (availabilityFilter === 'unavailable' && !item.is_available);

      return matchesSearch && matchesCategory && matchesAvailability;
    });
    return filtered;
  }, [menuItems, searchTerm, categoryFilter, availabilityFilter]);

  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);
  const paginatedMenuItems = filteredMenuItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExport = () => {
    const dataToExport = filteredMenuItems.map(item => ({
      'Category': categories.find(c => c.id === item.category_id)?.name || '',
      'Item Name': item.name,
      'Description': item.description,
      'Price': item.price,
      'Available': item.is_available ? 'Yes' : 'No',
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'menu.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

          <TabsContent value="items" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">الأصناف</h2>
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                تصدير CSV
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="البحث عن صنف..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية حسب الفئة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفئات</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="تصفية حسب التوفر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="available">متوفر</SelectItem>
                  <SelectItem value="unavailable">غير متوفر</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <MenuItemManager 
              categories={categories}
              menuItems={paginatedMenuItems}
              tenantId={tenantId}
              onMenuItemsChange={(updatedItems) => {
                setMenuItems(updatedItems);
                fetchMenuData(tenantId); // Refresh to get updated data
              }}
            />
            {totalPages > 1 && (
              <div className="pt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(prev => Math.max(prev - 1, 1));
                        }}
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(i + 1);
                          }}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(prev => Math.min(prev + 1, totalPages));
                        }}
                        className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
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