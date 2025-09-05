import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, Building2, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import CreateTenantDialog from './CreateTenantDialog';
import EditTenantDialog from './EditTenantDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useNavigate } from 'react-router-dom';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  phone_number: string | null;
  address: string | null;
  owner?: {
    full_name: string;
    email: string;
  };
}

const SuperAdminDashboard = () => {
  const { profile } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

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

  const handleTenantUpdated = () => {
    fetchTenants();
    setShowEditDialog(false);
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowEditDialog(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
              {t('superAdmin.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('superAdmin.welcome', { name: profile?.full_name || 'User' })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('superAdmin.stats.totalRestaurants')}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">
                {t('superAdmin.stats.activeCount', { count: tenants.filter(t => t.is_active).length })}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('superAdmin.stats.paidPlans')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.subscription_plan !== 'basic').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('superAdmin.stats.outOfTotal', { total: tenants.length })}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('superAdmin.stats.activeAccounts')}</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('superAdmin.stats.activityPercentage', { 
                  percentage: tenants.length > 0 ? Math.round((tenants.filter(t => t.is_active).length / tenants.length) * 100) : 0 
                })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Management */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('superAdmin.tenantsManagement.title')}</CardTitle>
                <CardDescription>
                  {t('superAdmin.tenantsManagement.description')}
                </CardDescription>
              </div>
              <Button 
                onClick={() => setShowCreateDialog(true)}
                variant="hero"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t('superAdmin.tenantsManagement.addButton')}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {tenants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('superAdmin.noTenants.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('superAdmin.noTenants.description')}
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  variant="hero"
                >
                  {t('superAdmin.tenantsManagement.addButton')}
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
                          {tenant.is_active ? t('common.active') : t('common.inactive')}
                        </Badge>
                        <Badge variant="outline">
                          {t(`plans.${tenant.subscription_plan}` as any)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>{t('superAdmin.tenant.owner')}: {tenant.owner?.full_name}</p>
                        <p>{t('superAdmin.tenant.email')}: {tenant.owner?.email}</p>
                        <p>{t('superAdmin.tenant.registrationDate')}: {new Date(tenant.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(tenant)}>
                        {t('common.edit')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/menu/${tenant.slug}`)}>
                        {t('superAdmin.tenant.viewMenu')}
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
        <EditTenantDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onTenantUpdated={handleTenantUpdated}
          tenant={selectedTenant}
        />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;