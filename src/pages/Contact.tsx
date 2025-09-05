import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Contact = () => {
  const { t, isRTL } = useTranslation();

  return (
    <div className="min-h-screen bg-background pt-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold text-center mb-4">{t('contact.title')}</h1>
        <p className="text-muted-foreground text-center max-w-2xl mx-auto mb-12">
          {t('contact.description')}
        </p>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>{t('contact.formTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data = Object.fromEntries(formData.entries());
                console.log(data);
                alert("Message sent (check console for data)");
              }}
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('contact.nameLabel')}</Label>
                  <Input id="name" name="name" placeholder={t('contact.namePlaceholder')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('contact.emailLabel')}</Label>
                  <Input id="email" name="email" type="email" placeholder={t('contact.emailPlaceholder')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">{t('contact.subjectLabel')}</Label>
                <Input id="subject" name="subject" placeholder={t('contact.subjectPlaceholder')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">{t('contact.messageLabel')}</Label>
                <Textarea id="message" name="message" placeholder={t('contact.messagePlaceholder')} />
              </div>
              <Button type="submit" className="w-full">{t('contact.submitButton')}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Contact;
