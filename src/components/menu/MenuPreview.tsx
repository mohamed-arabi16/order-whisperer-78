import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Smartphone, Eye } from "lucide-react";

/**
 * Represents a menu category.
 */
interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
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
}

/**
 * Props for the MenuPreview component.
 */
interface MenuPreviewProps {
  /**
   * An array of category objects.
   */
  categories: Category[];
  /**
   * An array of menu item objects.
   */
  menuItems: MenuItem[];
}

/**
 * A component that displays a preview of the public-facing menu.
 * It simulates the appearance of the menu on a mobile device.
 *
 * @param {MenuPreviewProps} props - The props for the component.
 * @returns {JSX.Element} The rendered menu preview component.
 */
const MenuPreview = ({
  categories,
  menuItems,
}: MenuPreviewProps): JSX.Element => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ar-LB").format(price) + " ل.ل";
  };

  const getItemsForCategory = (categoryId: string) => {
    return menuItems.filter(item => item.category_id === categoryId && item.is_available);
  };

  const activeCategories = categories.filter(cat => cat.is_active);

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            معاينة القائمة العامة
          </CardTitle>
          <CardDescription>
            هكذا ستظهر القائمة للعملاء عند مسح رمز QR
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Mobile Preview */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Phone Frame */}
          <div className="w-80 h-[600px] bg-card border-8 border-muted rounded-[2rem] shadow-2xl overflow-hidden">
            <div className="h-full bg-gradient-to-br from-background to-secondary/20 overflow-y-auto">
              {/* Phone Status Bar */}
              <div className="h-6 bg-muted flex items-center justify-center">
                <Smartphone className="h-3 w-3 text-muted-foreground" />
              </div>

              {/* Menu Content */}
              <div className="p-4 space-y-6" dir="rtl">
                {/* Header */}
                <div className="text-center">
                  <h1 className="text-2xl font-bold gradient-hero bg-clip-text text-transparent mb-2">
                    مطعم تجريبي
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    قائمة الطعام الرقمية
                  </p>
                </div>

                {/* Categories and Items */}
                {activeCategories.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">لا توجد فئات متاحة</p>
                  </div>
                ) : (
                  activeCategories.map(category => {
                    const categoryItems = getItemsForCategory(category.id);
                    if (categoryItems.length === 0) return null;

                    return (
                      <div key={category.id} className="space-y-3">
                        <h2 className="text-lg font-bold text-primary border-b border-border pb-2">
                          {category.name}
                        </h2>
                        <div className="space-y-3">
                          {categoryItems.map(item => (
                            <div
                              key={item.id}
                              className="flex items-start gap-3 p-3 bg-card rounded-lg shadow-sm"
                            >
                              {item.image_url && (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm">{item.name}</h3>
                                {item.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.description}
                                  </p>
                                )}
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-sm font-bold text-primary">
                                    {formatPrice(item.price)}
                                  </span>
                                  <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                                    إضافة +
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Cart Preview */}
                {activeCategories.length > 0 && (
                  <div className="sticky bottom-0 bg-card border border-border rounded-lg p-3 shadow-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">السلة فارغة</span>
                      <Button size="sm" disabled className="text-xs">
                        إرسال عبر واتساب
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Info */}
      <Card className="shadow-card bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
            <div className="text-sm">
              <p className="font-medium text-primary mb-1">معلومات مهمة:</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>• تظهر فقط الفئات والأصناف المتاحة</li>
                <li>• يمكن للعملاء إضافة الأصناف للسلة ثم إرسال الطلب عبر واتساب</li>
                <li>• يتم تحديث القائمة تلقائياً عند إجراء أي تعديل</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MenuPreview;