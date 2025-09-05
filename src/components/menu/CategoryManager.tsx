import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit2, GripVertical, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Category {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

interface CategoryManagerProps {
  categories: Category[];
  tenantId: string;
  onCategoriesChange: (categories: Category[]) => void;
}

const CategoryManager = ({ categories, tenantId, onCategoriesChange }: CategoryManagerProps) => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال اسم الفئة",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('menu_categories')
        .insert({
          tenant_id: tenantId,
          name: categoryName.trim(),
          display_order: categories.length,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      const updatedCategories = [...categories, data];
      onCategoriesChange(updatedCategories);
      
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الفئة الجديدة",
      });

      setCategoryName('');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة الفئة",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !categoryName.trim()) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({ name: categoryName.trim() })
        .eq('id', editingCategory.id);

      if (error) throw error;

      const updatedCategories = categories.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, name: categoryName.trim() }
          : cat
      );
      onCategoriesChange(updatedCategories);

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الفئة",
      });

      setEditingCategory(null);
      setCategoryName('');
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث الفئة",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleCategory = async (categoryId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_categories')
        .update({ is_active: isActive })
        .eq('id', categoryId);

      if (error) throw error;

      const updatedCategories = categories.map(cat =>
        cat.id === categoryId
          ? { ...cat, is_active: isActive }
          : cat
      );
      onCategoriesChange(updatedCategories);

      toast({
        title: "تم بنجاح",
        description: `تم ${isActive ? 'تفعيل' : 'إلغاء تفعيل'} الفئة`,
      });
    } catch (error) {
      console.error('Error toggling category:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث حالة الفئة",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 ml-2" />
            إضافة فئة جديدة
          </Button>
        </DialogTrigger>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>إضافة فئة جديدة</DialogTitle>
            <DialogDescription>
              أضف فئة جديدة مثل "المشاوي" أو "المقبلات" لتنظيم قائمة الطعام
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">اسم الفئة</Label>
              <Input
                id="category-name"
                placeholder="مثال: المشاوي"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={saving}
              >
                {saving ? 'جاري الحفظ...' : 'إضافة الفئة'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تعديل الفئة</DialogTitle>
            <DialogDescription>
              تحديث اسم الفئة
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">اسم الفئة</Label>
              <Input
                id="edit-category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                dir="rtl"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={saving}
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Categories List */}
      <div className="space-y-4">
        {categories.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Menu className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد فئات بعد</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بإضافة فئات لتنظيم قائمة طعام مطعمك
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول فئة
              </Button>
            </CardContent>
          </Card>
        ) : (
          categories.map((category, index) => (
            <Card key={category.id} className="shadow-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                    <div>
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        ترتيب العرض: {index + 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`category-${category.id}`} className="text-sm">
                        {category.is_active ? 'نشط' : 'غير نشط'}
                      </Label>
                      <Switch
                        id={`category-${category.id}`}
                        checked={category.is_active}
                        onCheckedChange={(checked) => handleToggleCategory(category.id, checked)}
                      />
                    </div>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryName(category.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4 ml-1" />
                      تعديل
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryManager;