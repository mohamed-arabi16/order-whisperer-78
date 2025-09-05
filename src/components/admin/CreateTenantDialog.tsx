import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface CreateTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTenantCreated: () => void;
}

const CreateTenantDialog = ({ open, onOpenChange, onTenantCreated }: CreateTenantDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
    subscriptionPlan: 'basic' as 'basic' | 'premium' | 'enterprise',
    phoneNumber: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate slug from restaurant name
      const slug = formData.restaurantName
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-');

      // Create user account for restaurant owner
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.ownerEmail,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
          full_name: formData.ownerName,
          role: 'restaurant_owner'
        }
      });

      if (authError) throw authError;

      // Get the created profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', authData.user.id)
        .single();

      if (profileError) throw profileError;

      // Create tenant
      const { error: tenantError } = await supabase
        .from('tenants')
        .insert({
          name: formData.restaurantName,
          slug: slug,
          owner_id: profileData.id,
          subscription_plan: formData.subscriptionPlan,
          phone_number: formData.phoneNumber,
          address: formData.address
        });

      if (tenantError) throw tenantError;

      toast({
        title: "تم إنشاء المطعم بنجاح",
        description: `تم إنشاء حساب ${formData.restaurantName} وإرسال بيانات الدخول للمالك`
      });

      // Reset form
      setFormData({
        restaurantName: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        subscriptionPlan: 'basic',
        phoneNumber: '',
        address: ''
      });

      onTenantCreated();
    } catch (error) {
      console.error('Error creating tenant:', error);
      toast({
        variant: "destructive",
        title: "خطأ في إنشاء المطعم",
        description: "حدث خطأ أثناء إنشاء حساب المطعم"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>إضافة مطعم جديد</DialogTitle>
          <DialogDescription>
            إنشاء حساب مطعم جديد على المنصة مع تحديد خطة الاشتراك
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant-name">اسم المطعم</Label>
            <Input
              id="restaurant-name"
              value={formData.restaurantName}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurantName: e.target.value }))}
              placeholder="مثال: بوابة دمشق"
              className="text-right"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner-name">اسم المالك</Label>
              <Input
                id="owner-name"
                value={formData.ownerName}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                placeholder="الاسم الكامل"
                className="text-right"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-email">البريد الإلكتروني</Label>
              <Input
                id="owner-email"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                placeholder="owner@restaurant.com"
                className="text-left"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">كلمة المرور الأولية</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              className="text-right"
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription-plan">خطة الاشتراك</Label>
            <Select 
              value={formData.subscriptionPlan} 
              onValueChange={(value: 'basic' | 'premium' | 'enterprise') => 
                setFormData(prev => ({ ...prev, subscriptionPlan: value }))
              }
            >
              <SelectTrigger className="text-right">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">أساسي - مجاني</SelectItem>
                <SelectItem value="premium">مميز - $29/شهر</SelectItem>
                <SelectItem value="enterprise">متقدم - $99/شهر</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">رقم الهاتف (اختياري)</Label>
            <Input
              id="phone"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="+963 xxx xxx xxx"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">العنوان (اختياري)</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="عنوان المطعم"
              className="text-right"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              إلغاء
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              variant="hero"
            >
              {loading ? "جاري الإنشاء..." : "إنشاء المطعم"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTenantDialog;