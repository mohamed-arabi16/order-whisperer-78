import { useState, useRef } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Edit2, Image, Upload, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  created_at: string;
}

/**
 * Props for the MenuItemManager component.
 */
interface MenuItemManagerProps {
  /**
   * An array of category objects.
   */
  categories: Category[];
  /**
   * An array of menu item objects.
   */
  menuItems: MenuItem[];
  /**
   * The ID of the tenant.
   */
  tenantId: string;
  /**
   * Callback function to be called when the menu items are updated.
   * @param items - The updated array of menu items.
   */
  onMenuItemsChange: (items: MenuItem[]) => void;
}

/**
 * A component for managing menu items within categories.
 * It allows creating, editing, and toggling the availability of menu items, including image uploads.
 *
 * @param {MenuItemManagerProps} props - The props for the component.
 * @returns {JSX.Element} The rendered menu item manager component.
 */
const MenuItemManager = ({
  categories,
  menuItems,
  tenantId,
  onMenuItemsChange,
}: MenuItemManagerProps): JSX.Element => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Form state
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const resetForm = () => {
    setItemName('');
    setItemDescription('');
    setItemPrice('');
    setSelectedCategory('');
    setImageFile(null);
    setImagePreview('');
    setIsDirty(false);
  };

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "خطأ",
          description: "يرجى اختيار ملف صورة صحيح",
          variant: "destructive",
        });
      }
    }
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      // Also delete the image from storage if it exists
      if (itemToDelete.image_url) {
        const fileName = itemToDelete.image_url.split('/').pop();
        if (fileName) {
          await supabase.storage.from('menu-images').remove([fileName]);
        }
      }

      const updatedItems = menuItems.filter(item => item.id !== itemToDelete.id);
      onMenuItemsChange(updatedItems);

      toast({
        title: "تم بنجاح",
        description: `تم حذف صنف "${itemToDelete.name}"`,
      });

      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في حذف الصنف",
        variant: "destructive",
      });
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('menu-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: publicUrl } = supabase.storage
        .from('menu-images')
        .getPublicUrl(data.path);

      return publicUrl.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في رفع الصورة",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleAddItem = async () => {
    if (!itemName.trim() || !itemPrice || !selectedCategory) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const categoryItems = menuItems.filter(item => item.category_id === selectedCategory);
      
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          tenant_id: tenantId,
          category_id: selectedCategory,
          name: itemName.trim(),
          description: itemDescription.trim() || null,
          price: parseInt(itemPrice),
          image_url: imageUrl || null,
          display_order: categoryItems.length,
          is_available: true
        })
        .select()
        .single();

      if (error) throw error;

      const updatedItems = [...menuItems, data];
      onMenuItemsChange(updatedItems);
      
      toast({
        title: "تم بنجاح",
        description: "تم إضافة الصنف الجديد",
      });

      resetForm();
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding menu item:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في إضافة الصنف",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !itemName.trim() || !itemPrice) return;

    setSaving(true);
    try {
      let imageUrl = editingItem.image_url;
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from('menu_items')
        .update({
          name: itemName.trim(),
          description: itemDescription.trim() || null,
          price: parseInt(itemPrice),
          image_url: imageUrl || null,
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      const updatedItems = menuItems.map(item =>
        item.id === editingItem.id
          ? { 
              ...item, 
              name: itemName.trim(),
              description: itemDescription.trim() || null,
              price: parseInt(itemPrice),
              image_url: imageUrl || null,
            }
          : item
      );
      onMenuItemsChange(updatedItems);

      toast({
        title: "تم بنجاح",
        description: "تم تحديث الصنف",
      });

      setEditingItem(null);
      resetForm();
    } catch (error) {
      console.error('Error updating menu item:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث الصنف",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleAvailability = async (itemId: string, isAvailable: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: isAvailable })
        .eq('id', itemId);

      if (error) throw error;

      const updatedItems = menuItems.map(item =>
        item.id === itemId
          ? { ...item, is_available: isAvailable }
          : item
      );
      onMenuItemsChange(updatedItems);

      toast({
        title: "تم بنجاح",
        description: `تم ${isAvailable ? 'إتاحة' : 'إخفاء'} الصنف`,
      });
    } catch (error) {
      console.error('Error toggling item availability:', error);
      toast({
        title: "خطأ",
        description: "حدث خطأ في تحديث حالة الصنف",
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ar-LB').format(price) + ' ل.ل';
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'غير محدد';
  };

  if (categories.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-12 text-center">
          <Plus className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">يجب إضافة فئات أولاً</h3>
          <p className="text-muted-foreground">
            لإضافة أصناف يجب أن تكون هناك فئات متاحة في القائمة
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleAddDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen && isDirty) {
      setShowUnsavedChangesDialog(true);
    } else {
      setIsAddDialogOpen(isOpen);
      if (!isOpen) resetForm();
    }
  };

  const handleEditDialogOpenChange = (isOpen: boolean) => {
    if (!isOpen && isDirty) {
      setShowUnsavedChangesDialog(true);
    } else {
      setEditingItem(isOpen ? editingItem : null);
      if (!isOpen) resetForm();
    }
  };

  return (
    <div className="space-y-6">
      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogOpenChange}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <Plus className="h-4 w-4 ml-2" />
            إضافة صنف جديد
          </Button>
        </DialogTrigger>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>إضافة صنف جديد</DialogTitle>
            <DialogDescription>
              أضف صنف جديد مثل "شيش طاووق" مع السعر والصورة والوصف
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">اسم الصنف *</Label>
                <Input
                  id="item-name"
                  placeholder="مثال: شيش طاووق"
                  value={itemName}
                  onChange={(e) => { setItemName(e.target.value); setIsDirty(true); }}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="item-price">السعر (ل.ل) *</Label>
                <Input
                  id="item-price"
                  type="number"
                  placeholder="50000"
                  value={itemPrice}
                  onChange={(e) => { setItemPrice(e.target.value); setIsDirty(true); }}
                  dir="rtl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="item-category">الفئة *</Label>
              <Select value={selectedCategory} onValueChange={(value) => { setSelectedCategory(value); setIsDirty(true); }} dir="rtl">
                <SelectTrigger>
                  <SelectValue placeholder="اختر فئة" />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter(cat => cat.is_active).map(category => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="item-description">الوصف</Label>
              <Textarea
                id="item-description"
                placeholder="وصف مختصر للصنف..."
                value={itemDescription}
                onChange={(e) => { setItemDescription(e.target.value); setIsDirty(true); }}
                dir="rtl"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>صورة الصنف</Label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => { handleImageSelect(e); setIsDirty(true); }}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  {uploadingImage ? 'جاري الرفع...' : 'اختر صورة'}
                </Button>
                {imagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="معاينة الصورة"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        aria-label="Remove image"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddItem}
                disabled={saving || uploadingImage}
              >
                {saving ? 'جاري الحفظ...' : 'إضافة الصنف'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={handleEditDialogOpenChange}>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تعديل الصنف</DialogTitle>
            <DialogDescription>
              تحديث معلومات الصنف
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-item-name">اسم الصنف *</Label>
                <Input
                  id="edit-item-name"
                  value={itemName}
                  onChange={(e) => { setItemName(e.target.value); setIsDirty(true); }}
                  dir="rtl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-item-price">السعر (ل.ل) *</Label>
                <Input
                  id="edit-item-price"
                  type="number"
                  value={itemPrice}
                  onChange={(e) => { setItemPrice(e.target.value); setIsDirty(true); }}
                  dir="rtl"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-item-description">الوصف</Label>
              <Textarea
                id="edit-item-description"
                value={itemDescription}
                onChange={(e) => { setItemDescription(e.target.value); setIsDirty(true); }}
                dir="rtl"
              />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>صورة الصنف</Label>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => { handleImageSelect(e); setIsDirty(true); }}
                  className="hidden"
                  ref={fileInputRef}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  {uploadingImage ? 'جاري الرفع...' : 'تغيير الصورة'}
                </Button>
                {(imagePreview || editingItem?.image_url) && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview || editingItem?.image_url}
                      alt="معاينة الصورة"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        aria-label="Remove image"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingItem(null)}
              >
                إلغاء
              </Button>
              <Button
                onClick={handleEditItem}
                disabled={saving || uploadingImage}
              >
                {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Items List */}
      <div className="space-y-4">
        {menuItems.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <Image className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">لا توجد أصناف بعد</h3>
              <p className="text-muted-foreground mb-4">
                ابدأ بإضافة أصناف لقائمة طعام المطعم
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 ml-2" />
                إضافة أول صنف
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {menuItems.map((item) => (
              <Card key={item.id} className="shadow-card">
                <CardContent className="p-4">
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <Badge variant={item.is_available ? "default" : "secondary"}>
                        {item.is_available ? "متوفر" : "غير متوفر"}
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-muted-foreground">
                      {getCategoryName(item.category_id)}
                    </p>
                    
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(item.price)}
                    </p>
                    
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`item-${item.id}`} className="text-sm">
                          {item.is_available ? 'متوفر' : 'غير متوفر'}
                        </Label>
                        <Switch
                          id={`item-${item.id}`}
                          checked={item.is_available}
                          onCheckedChange={(checked) => handleToggleAvailability(item.id, checked)}
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setItemName(item.name);
                          setItemDescription(item.description || '');
                          setItemPrice(item.price.toString());
                          setImagePreview(item.image_url || '');
                        }}
                      >
                        <Edit2 className="h-4 w-4 ml-1" />
                        تعديل
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setItemToDelete(item)}
                      >
                        <Trash2 className="h-4 w-4 ml-1" />
                        حذف
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد بالتأكيد حذف صنف "{itemToDelete?.name}"؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
            <AlertDialogDescription>
              لديك تغييرات غير محفوظة. هل تريد بالتأكيد المغادرة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>البقاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsAddDialogOpen(false);
              setEditingItem(null);
              resetForm();
            }}>
              المغادرة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MenuItemManager;