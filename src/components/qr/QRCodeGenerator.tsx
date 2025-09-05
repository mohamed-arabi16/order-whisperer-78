import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QrCode, Download, Copy, ExternalLink, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import QRCode from "qrcode";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Represents a tenant with basic information for QR code generation.
 */
interface Tenant {
  id: string;
  name: string;
  slug: string;
}

/**
 * A component for generating and managing QR codes for a tenant's menu.
 * It provides options to download, print, and customize the QR code.
 *
 * @returns {JSX.Element} The rendered QR code generator component.
 */
const QRCodeGenerator = (): JSX.Element => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { t, isRTL } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [qrSize, setQrSize] = useState('medium');
  const [menuUrl, setMenuUrl] = useState('');

  useEffect(() => {
    fetchTenantData();
  }, []);

  useEffect(() => {
    if (tenant) {
      generateQRCode();
    }
  }, [tenant, qrSize]);

  const fetchTenantData = async () => {
    setLoading(true);
    try {
      const { data: tenantId, error: rpcError } = await supabase.rpc('get_user_tenant');
      if (rpcError) throw rpcError;

      if (tenantId) {
        const { data, error } = await supabase
          .from('tenants')
          .select('id, name, slug')
          .eq('id', tenantId)
          .single();

        if (error) throw error;

        if (data) {
          setTenant(data);
          const url = `${window.location.origin}/menu/${data.slug}`;
          setMenuUrl(url);
        }
      } else {
        console.error('No tenant found for this user.');
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error);
      toast({
        title: t('common.error'),
        description: t('qr.tenantNotFound'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    if (!tenant) return;

    const url = `${window.location.origin}/menu/${tenant.slug}`;
    const sizes = {
      small: 150,
      medium: 200,
      large: 300,
      xlarge: 400
    };
    
    const size = sizes[qrSize as keyof typeof sizes];

    try {
      const dataURL = await QRCode.toDataURL(url, {
        width: size,
        margin: 2,
        errorCorrectionLevel: 'H'
      });
      setQrCodeDataURL(dataURL);
    } catch (err) {
      console.error(err);
      toast({
        title: t('common.error'),
        description: t('qr.generationFailed'),
        variant: "destructive",
      });
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataURL || !tenant) return;

    const link = document.createElement('a');
    link.download = `qr-code-${tenant.slug}.png`;
    link.href = qrCodeDataURL;
    link.click();

    toast({
      title: t('common.success'),
      description: t('qr.downloadSuccess'),
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: t('common.success'),
        description: t('qr.copySuccess'),
      });
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('qr.copyFailed'),
        variant: "destructive",
      });
    }
  };

  const openMenuPreview = () => {
    if (menuUrl) {
      window.open(menuUrl, '_blank');
    }
  };

  const printQRCode = () => {
    if (!qrCodeDataURL) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="${isRTL ? 'rtl' : 'ltr'}">
          <head>
            <title>${t('qr.print.title')} - ${tenant?.name}</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-align: center;
                padding: 20px;
                direction: ${isRTL ? 'rtl' : 'ltr'};
              }
              .qr-container {
                max-width: 400px;
                margin: 0 auto;
                padding: 20px;
                border: 2px solid #e2e8f0;
                border-radius: 10px;
              }
              .title {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 10px;
                color: #1a202c;
              }
              .subtitle {
                font-size: 16px;
                color: #718096;
                margin-bottom: 20px;
              }
              .qr-image {
                margin: 20px 0;
              }
              .instructions {
                font-size: 14px;
                color: #4a5568;
                margin-top: 20px;
                line-height: 1.5;
              }
            </style>
          </head>
          <body>
            <div class="qr-container">
              <div class="title">${tenant?.name}</div>
              <div class="subtitle">${t('qr.print.subtitle')}</div>
              <div class="qr-image">
                <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 100%; height: auto;" />
              </div>
              <div class="instructions">
                ${t('qr.print.instructionsLine1')}<br>
                ${t('qr.print.instructionsLine2')}
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
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
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="w-full max-w-md text-center p-8">
          <h2 className="text-xl font-bold mb-2">{t('common.error')}</h2>
          <p className="text-muted-foreground">
            {t('qr.tenantNotFound')}
          </p>
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
              {t('qr.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('qr.description')}
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            {t('common.back')}
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  {t('qr.card.title')}
                </CardTitle>
                <CardDescription>
                  {t('qr.card.description', { restaurantName: tenant.name })}
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                {qrCodeDataURL ? (
                  <div className="inline-block p-4 bg-white rounded-lg shadow-sm">
                    <img
                      src={qrCodeDataURL}
                      alt="QR Code"
                      className="mx-auto"
                    />
                  </div>
                ) : (
                  <div className="w-48 h-48 mx-auto bg-muted rounded-lg flex items-center justify-center">
                    <QrCode className="h-16 w-16 text-muted-foreground" />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="qr-size">{t('qr.sizeLabel')}</Label>
                  <Select value={qrSize} onValueChange={setQrSize} dir={isRTL ? 'rtl' : 'ltr'}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">{t('qr.sizes.small')}</SelectItem>
                      <SelectItem value="medium">{t('qr.sizes.medium')}</SelectItem>
                      <SelectItem value="large">{t('qr.sizes.large')}</SelectItem>
                      <SelectItem value="xlarge">{t('qr.sizes.xlarge')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{t('qr.actions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={downloadQRCode}
                  disabled={!qrCodeDataURL}
                  className="w-full"
                  variant="default"
                >
                  <Download className="h-4 w-4 ml-2" />
                  {t('qr.actions.download')}
                </Button>

                <Button
                  onClick={printQRCode}
                  disabled={!qrCodeDataURL}
                  className="w-full"
                  variant="outline"
                >
                  <Printer className="h-4 w-4 ml-2" />
                  {t('qr.actions.print')}
                </Button>

                <Button
                  onClick={openMenuPreview}
                  className="w-full"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 ml-2" />
                  {t('qr.actions.preview')}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Information and Instructions */}
          <div className="space-y-6">
            {/* Menu URL */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{t('qr.menuUrl.title')}</CardTitle>
                <CardDescription>
                  {t('qr.menuUrl.description')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
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
                <Badge variant="secondary" className="w-fit">
                  {tenant.slug}
                </Badge>
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="shadow-card border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">{t('qr.instructions.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">{t('qr.instructions.step1.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('qr.instructions.step1.description')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">{t('qr.instructions.step2.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('qr.instructions.step2.description')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">{t('qr.instructions.step3.title')}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('qr.instructions.step3.description')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>{t('qr.tips.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    {t('qr.tips.tip1')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    {t('qr.tips.tip2')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    {t('qr.tips.tip3')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    {t('qr.tips.tip4')}
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGenerator;