import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit2, GripVertical, Menu } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

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
 * Props for the CategoryManager component.
 */
interface CategoryManagerProps {
  /**
   * An array of category objects.
   */
  categories: Category[];
  /**
   * The ID of the tenant.
   */
  tenantId: string;
  /**
   * Callback function to be called when the categories are updated.
   * @param categories - The updated array of categories.
   */
  onCategoriesChange: (categories: Category[]) => void;
}

/**
 * A component for managing menu categories.
 * It allows creating, editing, and toggling the active status of categories.
 *
 * @param {CategoryManagerProps} props - The props for the component.
 * @returns {JSX.Element} The rendered category manager component.
 */
const CategoryManager = ({
  categories,
  tenantId,
  onCategoriesChange,
}: CategoryManagerProps): JSX.Element => {
  const { toast } = useToast();
  const { t, isRTL } = useTranslation();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleAddCategory = async () => {
    if (!categoryName.trim()) {
      toast({
        title: t('common.error'),
        description: t('menu.categoryName') + ' ' + t('common.required'),
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      console.log('Adding category with tenantId:', tenantId);
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

      if (error) {
        console.error('Error adding category:', error);
        throw error;
      }

      const updatedCategories = [...categories, data];
      onCategoriesChange(updatedCategories);
      
      toast({
        title: t('common.success'),
        description: t('menu.categoryCreated'),
      });

      setCategoryName('');
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: t('common.error'),
        description: t('common.genericError'),
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
        title: t('common.success'),
        description: t('menu.categoryUpdated'),
      });

      setEditingCategory(null);
      setCategoryName('');
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: t('common.error'),
        description: t('common.genericError'),
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
        title: t('common.success'),
        description: `${t('common.category')} ${isActive ? t('common.activated') : t('common.deactivated')}`,
      });
    } catch (error) {
      console.error('Error toggling category:', error);
      toast({
        title: t('common.error'),
        description: t('common.genericError'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Add Category Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 mx-2" />
            {t('menu.addCategory')}
          </Button>
        </DialogTrigger>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('menu.addCategory')}</DialogTitle>
            <DialogDescription>
              {t('menu.categoryDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">{t('menu.categoryName')}</Label>
              <Input
                id="category-name"
                placeholder={t('menu.categoryPlaceholder')}
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleAddCategory}
                disabled={saving}
              >
                {saving ? t('common.saving') : t('menu.addCategory')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <DialogContent dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('menu.editCategory')}</DialogTitle>
            <DialogDescription>
              {t('menu.editCategoryDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-category-name">{t('menu.categoryName')}</Label>
              <Input
                id="edit-category-name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditingCategory(null)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleEditCategory}
                disabled={saving}
              >
                {saving ? t('common.saving') : t('common.save')}
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
              <h3 className="text-xl font-semibold mb-2">{t('menu.noCategories')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('menu.createFirstCategory')}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mx-2" />
                {t('menu.addCategory')}
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
                        {t('menu.displayOrder')}: {index + 1}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`category-${category.id}`} className="text-sm">
                        {category.is_active ? t('common.active') : t('common.inactive')}
                      </Label>
                      <Switch
                        id={`category-${category.id}`}
                        checked={category.is_active}
                        onCheckedChange={(checked) => handleToggleCategory(category.id, checked)}
                      />
                    </div>
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingCategory(category);
                        setCategoryName(category.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4 mx-1" />
                      {t('common.edit')}
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