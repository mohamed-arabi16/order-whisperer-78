import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Building2, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import CreateTenantDialog from './CreateTenantDialog';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  owner?: {
    full_name: string;
    email: string;
  };
}

const SuperAdminDashboard = () => {
  const { signOut, profile } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          owner:profiles!tenants_owner_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTenantCreated = () => {
    fetchTenants();
    setShowCreateDialog(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
              لوحة تحكم المدير العام
            </h1>
            <p className="text-muted-foreground mt-1">
              مرحباً {profile?.full_name} - إدارة المطاعم والحسابات
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={() => signOut()} variant="outline">
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المطاعم</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">
                {tenants.filter(t => t.is_active).length} نشط
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الخطط المدفوعة</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.subscription_plan !== 'basic').length}
              </div>
              <p className="text-xs text-muted-foreground">
                من أصل {tenants.length} مطعم
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحسابات النشطة</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round((tenants.filter(t => t.is_active).length / tenants.length) * 100)}% نسبة النشاط
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Management */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>إدارة المطاعم</CardTitle>
                <CardDescription>
                  إنشاء وإدارة حسابات المطاعم على المنصة
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                variant="hero"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                إضافة مطعم جديد
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد مطاعم مسجلة بعد</h3>
                <p className="text-muted-foreground mb-4">
                  ابدأ بإضافة أول مطعم على المنصة
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  variant="hero"
                >
                  إضافة مطعم جديد
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div 
                    key={tenant.id} 
                    className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-md transition-smooth"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{tenant.name}</h3>
                        <Badge 
                          variant={tenant.is_active ? "default" : "secondary"}
                          className={tenant.is_active ? "bg-fresh-green" : ""}
                        >
                          {tenant.is_active ? "نشط" : "غير نشط"}
                        </Badge>
                        <Badge variant="outline">
                          {tenant.subscription_plan === 'basic' ? 'أساسي' : 
                           tenant.subscription_plan === 'premium' ? 'مميز' : 'متقدم'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>المالك: {tenant.owner?.full_name}</p>
                        <p>البريد: {tenant.owner?.email}</p>
                        <p>تاريخ التسجيل: {new Date(tenant.created_at).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm">
                        تعديل
                      </Button>
                      <Button variant="ghost" size="sm">
                        عرض القائمة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <CreateTenantDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onTenantCreated={handleTenantCreated}
        />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;