import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Upload, Palette, Save, Eye, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface Tenant {
  id: string;
  name: string;
  logo_url?: string;
  primary_color?: string;
}

const RestaurantBranding = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  const predefinedColors = [
    { name: t('branding.colors.classicBlue'), value: '#2563eb' },
    { name: t('branding.colors.naturalGreen'), value: '#16a34a' },
    { name: t('branding.colors.warmOrange'), value: '#ea580c' },
    { name: t('branding.colors.elegantRed'), value: '#dc2626' },
    { name: t('branding.colors.royalPurple'), value: '#7c3aed' },
    { name: t('branding.colors.modernPink'), value: '#e11d48' },
    { name: t('branding.colors.luxuryGold'), value: '#d97706' },
    { name: t('branding.colors.calmTurquoise'), value: '#0891b2' },
  ];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Form state
  const [selectedColor, setSelectedColor] = useState('#2563eb');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  useEffect(() => {
    fetchTenantData();
  }, []);

  const fetchTenantData = async () => {
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

        if (data) {
          setTenant(data);
          setSelectedColor(data.primary_color || '#2563eb');
          if (data.logo_url) {
            setLogoPreview(data.logo_url);
          }
        }
      } else {
        console.error('No tenant found for this user.');
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error);
      toast({
        title: t('branding.toast.tenantNotFoundTitle'),
        description: t('branding.toast.tenantNotFoundDescription'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setLogoFile(file);
        const reader = new FileReader();
        reader.onload = (e) => {
          setLogoPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: t('branding.toast.invalidImageTitle'),
          description: t('branding.toast.invalidImageDescription'),
          variant: "destructive",
        });
      }
    }
  };

  const uploadLogo = async (file: File): Promise<string | null> => {
    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;
      
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
      console.error('Error uploading logo:', error);
      toast({
        title: t('branding.toast.logoUploadErrorTitle'),
        description: t('branding.toast.logoUploadErrorDescription'),
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!tenant) return;

    setSaving(true);
    try {
      let logoUrl = tenant.logo_url;
      
      if (logoFile) {
        const uploadedUrl = await uploadLogo(logoFile);
        if (uploadedUrl) logoUrl = uploadedUrl;
      }

      const { error } = await supabase
        .from('tenants')
        .update({
          logo_url: logoUrl,
          primary_color: selectedColor
        })
        .eq('id', tenant.id);

      if (error) throw error;

      setTenant(prev => prev ? {
        ...prev,
        logo_url: logoUrl,
        primary_color: selectedColor
      } : null);

      toast({
        title: t('branding.toast.saveSuccessTitle'),
        description: t('branding.toast.saveSuccessDescription'),
      });

      setLogoFile(null);
    } catch (error) {
      console.error('Error saving branding:', error);
      toast({
        title: t('branding.toast.saveErrorTitle'),
        description: t('branding.toast.saveErrorDescription'),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(tenant?.logo_url || '');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('branding.loading')}</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md text-center p-8">
          <h2 className="text-xl font-bold mb-2">{t('branding.error')}</h2>
          <p className="text-muted-foreground">
            {t('branding.tenantNotFound')}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pt-16" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
              {t('branding.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('branding.description')}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            {t('branding.backToDashboard')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Branding Controls */}
          <div className="space-y-6">
            {/* Logo Upload */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  {t('branding.logo.title')}
                </CardTitle>
                <CardDescription>
                  {t('branding.logo.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 ml-2" />
                  {uploadingLogo ? t('branding.logo.uploading') : t('branding.logo.select')}
                </Button>

                {logoPreview && (
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt={t('branding.logo.alt')}
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    {logoFile && (
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={removeLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Color Selection */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  {t('branding.color.title')}
                </CardTitle>
                <CardDescription>
                  {t('branding.color.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  {predefinedColors.map(color => (
                    <button
                      key={color.value}
                      onClick={() => setSelectedColor(color.value)}
                      className={`relative w-16 h-16 rounded-lg border-2 transition-all ${
                        selectedColor === color.value
                          ? 'border-foreground scale-110'
                          : 'border-border hover:scale-105'
                      }`}
                      style={{ backgroundColor: color.value }}
                      title={color.name}
                    >
                      {selectedColor === color.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-4 h-4 bg-white rounded-full shadow-lg"></div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-color">{t('branding.color.custom')}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-color"
                      type="color"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      className="w-20 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      placeholder="#ffffff"
                      className="flex-1"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t('branding.color.preview')}</span>
                  <div
                    className="w-8 h-8 rounded border"
                    style={{ backgroundColor: selectedColor }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving || uploadingLogo}
              className="w-full gradient-hero text-white"
              size="lg"
            >
              <Save className="h-5 w-5 ml-2" />
              {saving ? t('branding.saving') : t('branding.save')}
            </Button>
          </div>

          {/* Preview */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {t('branding.preview.title')}
                </CardTitle>
                <CardDescription>
                  {t('branding.preview.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Mobile Preview */}
                <div className="mx-auto max-w-sm">
                  <div className="w-full h-96 bg-card border-8 border-muted rounded-[2rem] shadow-2xl overflow-hidden">
                    <div className="h-full bg-gradient-to-br from-background to-secondary/20 overflow-y-auto">
                      {/* Preview Header */}
                      <div className="p-4 border-b border-border bg-card/95">
                        <div className="flex items-center gap-3">
                          {(logoPreview || logoFile) && (
                            <img
                              src={logoPreview}
                              alt={t('branding.logo.alt')}
                              className="w-12 h-12 rounded-full object-cover border-2"
                              style={{ borderColor: selectedColor }}
                            />
                          )}
                          <div>
                            <h1 
                              className="text-xl font-bold"
                              style={{ color: selectedColor }}
                            >
                              {tenant.name}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                              {t('branding.preview.menuTitle')}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Preview Content */}
                      <div className="p-4 space-y-4">
                        <div className="space-y-3">
                          <h2 
                            className="text-lg font-bold pb-2 border-b"
                            style={{ 
                              color: selectedColor,
                              borderColor: selectedColor + '40'
                            }}
                          >
                            {t('branding.preview.category')}
                          </h2>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-card rounded-lg shadow-sm">
                              <div>
                                <h3 className="font-medium">{t('branding.preview.item.name')}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {t('branding.preview.item.description')}
                                </p>
                                <span 
                                  className="text-sm font-bold"
                                  style={{ color: selectedColor }}
                                >
                                  {t('branding.preview.item.price')}
                                </span>
                              </div>
                              <Button 
                                size="sm" 
                                className="h-6 px-2 text-xs"
                                style={{ 
                                  backgroundColor: selectedColor,
                                  borderColor: selectedColor
                                }}
                              >
                                {t('branding.preview.item.add')}
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div 
                          className="p-3 rounded-lg border"
                          style={{ 
                            borderColor: selectedColor + '40',
                            backgroundColor: selectedColor + '10'
                          }}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{t('branding.preview.cart.empty')}</span>
                            <Button 
                              size="sm" 
                              disabled 
                              className="text-xs"
                              style={{ 
                                backgroundColor: selectedColor + '80',
                                borderColor: selectedColor
                              }}
                            >
                              {t('branding.preview.cart.send')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantBranding;