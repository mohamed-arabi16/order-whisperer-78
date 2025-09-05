import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Menu, QrCode, Palette } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  is_active: boolean;
  phone_number?: string;
  address?: string;
}

const RestaurantDashboard = () => {
  const { signOut, profile } = useAuth();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenant();
  }, []);

  const fetchTenant = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('owner_id', profile?.id)
        .single();

      if (error) {
        // No tenant found - this shouldn't happen but handle gracefully
        console.error('No tenant found for user:', error);
      } else {
        setTenant(data);
      }
    } catch (error) {
      console.error('Error fetching tenant:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center" dir="rtl">
        <Card className="w-full max-w-md shadow-warm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">مرحباً {profile?.full_name}</CardTitle>
            <CardDescription>
              لم يتم العثور على حساب مطعم مرتبط بهذا المستخدم
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              يرجى التواصل مع المدير العام لإعداد حساب المطعم
            </p>
            <Button onClick={() => signOut()} variant="outline" className="w-full">
              تسجيل الخروج
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
              مطعم {tenant.name}
            </h1>
            <p className="text-muted-foreground mt-1">
              مرحباً {profile?.full_name} - لوحة تحكم المطعم
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={tenant.is_active ? "default" : "secondary"}
              className={tenant.is_active ? "bg-fresh-green" : ""}
            >
              {tenant.is_active ? "نشط" : "غير نشط"}
            </Badge>
            <Button onClick={() => signOut()} variant="outline">
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Restaurant Info Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              معلومات المطعم
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">اسم المطعم</label>
                <p className="text-lg font-medium">{tenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">خطة الاشتراك</label>
                <p className="text-lg font-medium">
                  {tenant.subscription_plan === 'basic' ? 'أساسي' : 
                   tenant.subscription_plan === 'premium' ? 'مميز' : 'متقدم'}
                </p>
              </div>
              {tenant.phone_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">رقم الهاتف</label>
                  <p className="text-lg font-medium">{tenant.phone_number}</p>
                </div>
              )}
              {tenant.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">العنوان</label>
                  <p className="text-lg font-medium">{tenant.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card hover:shadow-warm transition-smooth cursor-pointer">
            <CardHeader className="text-center">
              <Menu className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>إدارة القائمة</CardTitle>
              <CardDescription>
                إضافة وتعديل الأصناف والفئات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/menu-management'}
              >
                بناء القائمة
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-warm transition-smooth cursor-pointer">
            <CardHeader className="text-center">
              <Palette className="h-12 w-12 text-accent mx-auto mb-2" />
              <CardTitle>التصميم والشعار</CardTitle>
              <CardDescription>
                تخصيص ألوان وشعار المطعم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/branding'}
              >
                تخصيص التصميم
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-warm transition-smooth cursor-pointer">
            <CardHeader className="text-center">
              <QrCode className="h-12 w-12 text-warm-orange mx-auto mb-2" />
              <CardTitle>رمز QR</CardTitle>
              <CardDescription>
                تحميل وطباعة رمز QR للقائمة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
                onClick={() => window.location.href = '/qr-code'}
              >
                إنشاء رمز QR
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">دليل البدء السريع</CardTitle>
            <CardDescription>
              اتبع هذه الخطوات لإعداد قائمة مطعمك الرقمية
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">إنشاء فئات القائمة</h4>
                  <p className="text-sm text-muted-foreground">ابدأ بإضافة فئات مثل "المشاوي" و "المقبلات"</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">إضافة الأصناف</h4>
                  <p className="text-sm text-muted-foreground">أضف الأطباق مع الأسعار والصور والوصف</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">تخصيص التصميم</h4>
                  <p className="text-sm text-muted-foreground">ارفع شعار المطعم واختر الألوان المناسبة</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">طباعة رمز QR</h4>
                  <p className="text-sm text-muted-foreground">احصل على رمز QR وضعه على طاولات المطعم</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => window.location.href = '/menu-management'}
              >
                ابدأ بناء القائمة الآن
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantDashboard;