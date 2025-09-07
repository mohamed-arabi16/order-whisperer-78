import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Menu, QrCode, Palette, Link, Copy, LineChart, MessageSquare, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/hooks/useTranslation";
import RestaurantDashboardSkeleton from "./RestaurantDashboardSkeleton";

/**
 * Represents a tenant (restaurant) with its details.
 */
interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  is_active: boolean;
  phone_number?: string;
  address?: string;
}

/**
 * The main dashboard for a restaurant owner.
 * It displays restaurant information, quick actions, and a getting started guide.
 *
 * @returns {JSX.Element} The rendered restaurant dashboard component.
 */
const RestaurantDashboard = (): JSX.Element => {
  const { profile } = useAuth();
  const { t, isRTL } = useTranslation();
  const { toast } = useToast();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuUrl, setMenuUrl] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: tenantId, error: rpcError } = await supabase.rpc('get_user_tenant');
        if (rpcError) {
          throw new Error(`Error fetching user tenant: ${rpcError.message}`);
        }

        if (tenantId) {
          const { data: tenantData, error: tenantError } = await supabase
            .from('tenants')
            .select('*')
            .eq('id', tenantId)
            .single();

          if (tenantError) {
            throw new Error(`Error fetching tenant data: ${tenantError.message}`);
          }
          if (tenantData) {
            setTenant(tenantData);
            const { data: feedbackData, error: feedbackError } = await supabase
              .from('feedback')
              .select('*')
              .eq('tenant_id', tenantId)
              .order('created_at', { ascending: false });

            if (feedbackError) {
              console.error("Error fetching feedback:", feedbackError);
              toast({
                title: t('restaurant.toast.feedbackErrorTitle'),
                description: t('restaurant.toast.feedbackErrorDescription'),
                variant: "destructive",
              });
            } else {
              setFeedback(feedbackData || []);
            }
          }
        } else {
          console.error('No tenant found for this user.');
          toast({
            title: t('restaurant.toast.noTenantTitle'),
            description: t('restaurant.toast.noTenantDescription'),
            variant: "destructive",
          });
        }
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: t('common.error.genericTitle'),
          description: error.message || t('common.error.genericMessage'),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [supabase, toast, t]);

  useEffect(() => {
    if (tenant) {
      setMenuUrl(`${window.location.origin}/menu/${tenant.slug}`);
    }
  }, [tenant]);

  useEffect(() => {
    if (!tenant) return;

    const channel = supabase
      .channel(`orders:${tenant.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders', filter: `tenant_id=eq.${tenant.id}` },
        (payload) => {
          console.log('New order received:', payload);
          toast({
            title: t('restaurant.toast.newOrder.title'),
            description: t('restaurant.toast.newOrder.description', {
              price: (payload.new as any).total_price,
            }),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant, supabase, toast, t]);

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

  if (loading) {
    return <RestaurantDashboardSkeleton />;
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md shadow-warm">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">{t('restaurant.noTenant.welcome', { name: profile?.full_name || 'User' })}</CardTitle>
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
              {t('restaurant.welcome', { userName: profile?.full_name || 'User' })}
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
                aria-label={t('restaurant.shareableLink.copyAriaLabel')}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card
            className="shadow-card hover:shadow-warm transition-smooth cursor-pointer"
            onClick={() => window.location.href = '/menu-management'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                window.location.href = '/menu-management';
              }
            }}
            role="button"
            tabIndex={0}
          >
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

          <Card
            className="shadow-card hover:shadow-warm transition-smooth cursor-pointer"
            onClick={() => window.location.href = '/branding'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                window.location.href = '/branding';
              }
            }}
            role="button"
            tabIndex={0}
          >
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

          <Card
            className="shadow-card hover:shadow-warm transition-smooth cursor-pointer"
            onClick={() => window.location.href = '/qr-code'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                window.location.href = '/qr-code';
              }
            }}
            role="button"
            tabIndex={0}
          >
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
          <Card
            className="shadow-card hover:shadow-warm transition-smooth cursor-pointer"
            onClick={() => window.location.href = '/analytics'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                window.location.href = '/analytics';
              }
            }}
            role="button"
            tabIndex={0}
          >
            <CardHeader className="text-center">
              <LineChart className="h-12 w-12 text-green-500 mx-auto mb-2" />
              <CardTitle>{t('restaurant.quickActions.analytics.title')}</CardTitle>
              <CardDescription>
                {t('restaurant.quickActions.analytics.description')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
              >
                {t('restaurant.quickActions.analytics.button')}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started Guide / Feedback */}
        <Tabs defaultValue="getting-started">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="getting-started">{t('restaurant.gettingStarted.title')}</TabsTrigger>
            <TabsTrigger value="feedback">{t('restaurant.feedback.title')}</TabsTrigger>
          </TabsList>
          <TabsContent value="getting-started">
            <Card className="shadow-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-primary">{t('restaurant.gettingStarted.title')}</CardTitle>
            <CardDescription>
              {t('restaurant.gettingStarted.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold ${isRTL ? 'order-2' : ''}`}>
                  {isRTL ? '١' : '1'}
                </div>
                <div className={`${isRTL ? 'order-1 text-right' : ''}`}>
                  <h4 className="font-medium">{t('restaurant.gettingStarted.step1.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('restaurant.gettingStarted.step1.description')}</p>
                </div>
              </div>
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold ${isRTL ? 'order-2' : ''}`}>
                  {isRTL ? '٢' : '2'}
                </div>
                <div className={`${isRTL ? 'order-1 text-right' : ''}`}>
                  <h4 className="font-medium">{t('restaurant.gettingStarted.step2.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('restaurant.gettingStarted.step2.description')}</p>
                </div>
              </div>
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold ${isRTL ? 'order-2' : ''}`}>
                  {isRTL ? '٣' : '3'}
                </div>
                <div className={`${isRTL ? 'order-1 text-right' : ''}`}>
                  <h4 className="font-medium">{t('restaurant.gettingStarted.step3.title')}</h4>
                  <p className="text-sm text-muted-foreground">{t('restaurant.gettingStarted.step3.description')}</p>
                </div>
              </div>
              <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold ${isRTL ? 'order-2' : ''}`}>
                  {isRTL ? '٤' : '4'}
                </div>
                <div className={`${isRTL ? 'order-1 text-right' : ''}`}>
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
          </TabsContent>
          <TabsContent value="feedback">
            <Card>
              <CardHeader>
                <CardTitle>{t('restaurant.feedback.title')}</CardTitle>
                <CardDescription>{t('restaurant.feedback.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {feedback.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">{t('restaurant.feedback.noFeedback.title')}</h3>
                    <p className="text-muted-foreground">
                      {t('restaurant.feedback.noFeedback.description')}
                    </p>
                  </div>
                ) : (
                  feedback.map((fb, index) => (
                    <div
                      key={fb.id}
                      className={index < feedback.length - 1 ? "border-b pb-4" : ""}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < fb.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {new Date(fb.created_at).toLocaleString()}
                        </p>
                      </div>
                      {fb.comment && <p className="mt-2 text-sm">{fb.comment}</p>}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default RestaurantDashboard;