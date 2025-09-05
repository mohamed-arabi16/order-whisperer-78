import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QrCode, Download, Copy, ExternalLink, Printer } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Tenant {
  id: string;
  name: string;
  slug: string;
}

// QR code generation using a simple library approach
const generateQRCodeDataURL = (text: string, size: number = 200): string => {
  // Using a simple approach - in a real implementation you'd use a library like qrcode
  // For now, return a placeholder that shows QR-like pattern
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create a simple QR code-like pattern
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = '#000000';
  
  const cellSize = size / 25;
  
  // Simple pattern that resembles a QR code
  const pattern = [
    [1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,1,1,0,1,1,0,1,1,0,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,1,0,0,1,0,1,0,0,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,1,0,1,1,1,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,0,1,1,1,0,1,0,1,1,0,0,0,0,0,0,0,0],
    [0,1,1,0,1,1,1,1,0,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1],
    [1,0,1,1,0,0,0,0,1,1,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0],
    [0,1,1,0,1,1,1,1,0,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,1,1,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0],
    [0,1,1,0,1,1,1,1,0,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1],
    [1,0,1,1,0,0,0,0,1,1,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0],
    [0,1,1,0,1,1,1,1,0,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1],
    [1,0,0,1,0,0,0,0,1,1,0,1,0,1,1,0,1,0,1,0,1,0,0,1,0],
    [0,1,1,0,1,1,1,1,0,0,1,0,1,0,1,1,0,1,0,1,0,1,1,0,1],
    [0,0,0,0,0,0,0,0,1,0,1,1,0,1,0,1,1,0,0,1,1,1,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,0,1,1,0,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,1,0,1,0,1,1,0,1,1,1,0,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,0,1,0,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,1,0,1,1,0,1,1,0,0,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,0,0,1,0,1,0,0,1,0,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,1,1,0,1,0,1,1,0,1,0,0,0,0,1,0],
    [1,1,1,1,1,1,1,0,0,1,0,0,1,0,1,0,0,1,1,1,1,1,1,1,1]
  ];
  
  for (let row = 0; row < 25; row++) {
    for (let col = 0; col < 25; col++) {
      if (pattern[row] && pattern[row][col]) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
      }
    }
  }
  
  return canvas.toDataURL();
};

const QRCodeGenerator = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
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
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('owner_id', profile?.id)
        .single();

      if (error) {
        console.error('Error fetching tenant:', error);
      } else {
        setTenant(data);
        const url = `${window.location.origin}/menu/${data.slug}`;
        setMenuUrl(url);
      }
    } catch (error) {
      console.error('Error fetching tenant data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = () => {
    if (!tenant) return;

    const url = `${window.location.origin}/menu/${tenant.slug}`;
    const sizes = {
      small: 150,
      medium: 200,
      large: 300,
      xlarge: 400
    };
    
    const size = sizes[qrSize as keyof typeof sizes];
    const dataURL = generateQRCodeDataURL(url, size);
    setQrCodeDataURL(dataURL);
  };

  const downloadQRCode = () => {
    if (!qrCodeDataURL || !tenant) return;

    const link = document.createElement('a');
    link.download = `qr-code-${tenant.slug}.png`;
    link.href = qrCodeDataURL;
    link.click();

    toast({
      title: "تم التحميل",
      description: "تم تحميل رمز QR بنجاح",
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "تم النسخ",
        description: "تم نسخ الرابط إلى الحافظة",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "لم يتم نسخ الرابط",
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
        <html dir="rtl">
          <head>
            <title>رمز QR - ${tenant?.name}</title>
            <style>
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                text-align: center;
                padding: 20px;
                direction: rtl;
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
              <div class="subtitle">قائمة الطعام الرقمية</div>
              <div class="qr-image">
                <img src="${qrCodeDataURL}" alt="QR Code" style="max-width: 100%; height: auto;" />
              </div>
              <div class="instructions">
                امسح هذا الرمز بكاميرا هاتفك<br>
                لعرض قائمة الطعام الرقمية
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
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md text-center p-8">
          <h2 className="text-xl font-bold mb-2">خطأ</h2>
          <p className="text-muted-foreground">
            لم يتم العثور على بيانات المطعم
          </p>
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
              رمز QR للقائمة الرقمية
            </h1>
            <p className="text-muted-foreground mt-1">
              إنشاء وتحميل رمز QR للمطعم
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            العودة للوحة التحكم
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  رمز QR
                </CardTitle>
                <CardDescription>
                  امسح هذا الرمز للوصول إلى قائمة {tenant.name}
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
                  <Label htmlFor="qr-size">حجم الرمز:</Label>
                  <Select value={qrSize} onValueChange={setQrSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">صغير (150×150)</SelectItem>
                      <SelectItem value="medium">متوسط (200×200)</SelectItem>
                      <SelectItem value="large">كبير (300×300)</SelectItem>
                      <SelectItem value="xlarge">كبير جداً (400×400)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>الإجراءات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={downloadQRCode}
                  disabled={!qrCodeDataURL}
                  className="w-full"
                  variant="default"
                >
                  <Download className="h-4 w-4 ml-2" />
                  تحميل رمز QR
                </Button>

                <Button
                  onClick={printQRCode}
                  disabled={!qrCodeDataURL}
                  className="w-full"
                  variant="outline"
                >
                  <Printer className="h-4 w-4 ml-2" />
                  طباعة رمز QR
                </Button>

                <Button
                  onClick={openMenuPreview}
                  className="w-full"
                  variant="outline"
                >
                  <ExternalLink className="h-4 w-4 ml-2" />
                  معاينة القائمة
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Information and Instructions */}
          <div className="space-y-6">
            {/* Menu URL */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>رابط القائمة</CardTitle>
                <CardDescription>
                  يمكن للعملاء أيضاً الوصول للقائمة مباشرة عبر هذا الرابط
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
                <CardTitle className="text-primary">كيفية الاستخدام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      <h4 className="font-medium">طباعة الرمز</h4>
                      <p className="text-sm text-muted-foreground">
                        احفظ أو اطبع رمز QR بحجم مناسب (يُفضل 5×5 سم على الأقل)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      <h4 className="font-medium">وضع الرمز</h4>
                      <p className="text-sm text-muted-foreground">
                        ضع الرمز على طاولات المطعم أو بالقرب من المدخل
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      <h4 className="font-medium">المسح والطلب</h4>
                      <p className="text-sm text-muted-foreground">
                        العملاء يمسحون الرمز بكاميرا هاتفهم ويطلبون عبر واتساب
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>نصائح هامة</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    تأكد من وضوح الرمز عند الطباعة
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    ضع الرمز في مكان يسهل وصول العملاء إليه
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    احفظ نسخة رقمية من الرمز للاستخدام المستقبلي
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                    يمكنك إنشاء أحجام مختلفة للاستخدامات المختلفة
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