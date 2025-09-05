import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Menu, QrCode, Palette, Link, Copy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  is_active: boolean;
  phone_number?: string;
  address?: string;
}

import { useTranslation } from '@/hooks/useTranslation';

const RestaurantDashboard = () => {
  const { profile } = useAuth();
  const { t, isRTL } = useTranslation();
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuUrl, setMenuUrl] = useState('');

  useEffect(() => {
    fetchTenant();
  }, []);

  useEffect(() => {
    if (tenant) {
      setMenuUrl(`${window.location.origin}/menu/${tenant.slug}`);
    }
  }, [tenant]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('restaurant.toast.copySuccessTitle'),
        description: t('restaurant.toast.copySuccessDescription'),
      });
    } catch (error) {
      toast({
        title: t('restaurant.toast.copyErrorTitle'),
        description: t('restaurant.toast.copyErrorDescription'),
        variant: "destructive",
      });
    }
  };

  const fetchTenant = async () => {
    setLoading(true);
    try {
      const { data: tenantId, error: rpcError } = await supabase.rpc('get_user_tenant');
      if (rpcError) throw rpcError;

      if (tenantId) {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', tenantId)
          .single();

        if (error) throw error;
        setTenant(data);
      } else {
        console.error('No tenant found for this user.');
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
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md shadow-warm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t('restaurant.noTenant.welcome', { name: profile?.full_name })}</CardTitle>
            <CardDescription>
              {t('restaurant.noTenant.description')}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('restaurant.noTenant.contactAdmin')}
            </p>
          </CardContent>
        </Card>
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
              {t('restaurant.dashboardTitle', { restaurantName: tenant.name })}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('restaurant.welcome', { userName: profile?.full_name })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge 
              variant={tenant.is_active ? "default" : "secondary"}
              className={tenant.is_active ? "bg-fresh-green" : ""}
            >
              {tenant.is_active ? t('common.active') : t('common.inactive')}
            </Badge>
          </div>
        </div>

        {/* Restaurant Info Card */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {t('restaurant.infoCard.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('restaurant.infoCard.name')}</label>
                <p className="text-lg font-medium">{tenant.name}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('restaurant.infoCard.plan')}</label>
                <p className="text-lg font-medium">
                  {t(`plans.${tenant.subscription_plan}` as any)}
                </p>
              </div>
              {tenant.phone_number && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('restaurant.infoCard.phone')}</label>
                  <p className="text-lg font-medium">{tenant.phone_number}</p>
                </div>
              )}
              {tenant.address && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('restaurant.infoCard.address')}</label>
                  <p className="text-lg font-medium">{tenant.address}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Shareable Menu Link */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              {t('restaurant.shareableLink.title')}
            </CardTitle>
            <CardDescription>
              {t('restaurant.shareableLink.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={menuUrl}
                readOnly
                className="flex-1"
                dir="ltr"
              />
              <Button
                onClick={() => copyToClipboard(menuUrl)}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-card hover:shadow-warm transition-smooth cursor-pointer" onClick={() => window.location.href = '/menu-management'}>
            <CardHeader className="text-center">
              <Menu className="h-12 w-12 text-primary mx-auto mb-2" />
              <CardTitle>{t('restaurant.quickActions.menu.title')}</CardTitle>
              <CardDescription>
                {t('restaurant.quickActions.menu.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
              >
                {t('restaurant.quickActions.menu.button')}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-warm transition-smooth cursor-pointer" onClick={() => window.location.href = '/branding'}>
            <CardHeader className="text-center">
              <Palette className="h-12 w-12 text-accent mx-auto mb-2" />
              <CardTitle>{t('restaurant.quickActions.branding.title')}</CardTitle>
              <CardDescription>
                {t('restaurant.quickActions.branding.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
              >
                {t('restaurant.quickActions.branding.button')}
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-warm transition-smooth cursor-pointer" onClick={() => window.location.href = '/qr-code'}>
            <CardHeader className="text-center">
              <QrCode className="h-12 w-12 text-warm-orange mx-auto mb-2" />
              <CardTitle>{t('restaurant.quickActions.qr.title')}</CardTitle>
              <CardDescription>
                {t('restaurant.quickActions.qr.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                className="w-full" 
                variant="outline"
              >
                {t('restaurant.quickActions.qr.button')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide */}
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-primary">{t('restaurant.gettingStarted.title')}</CardTitle>
            <CardDescription>
              {t('restaurant.gettingStarted.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-medium">{t('restaurant.gettingStarted.step1.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('restaurant.gettingStarted.step1.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-medium">{t('restaurant.gettingStarted.step2.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('restaurant.gettingStarted.step2.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-medium">{t('restaurant.gettingStarted.step3.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('restaurant.gettingStarted.step3.description')}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                  4
                </div>
                <div>
                  <h4 className="font-medium">{t('restaurant.gettingStarted.step4.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('restaurant.gettingStarted.step4.description')}</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <Button 
                variant="hero" 
                className="w-full"
                onClick={() => window.location.href = '/menu-management'}
              >
                {t('restaurant.gettingStarted.cta')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RestaurantDashboard;