import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/hooks/useTranslation';

interface Tenant {
  id: string;
  name: string;
  subscription_plan: string;
  phone_number: string | null;
  address: string | null;
}

interface EditTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTenantUpdated: () => void;
  tenant: Tenant | null;
}

const EditTenantDialog = ({ open, onOpenChange, onTenantUpdated, tenant }: EditTenantDialogProps) => {
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subscription_plan: 'basic' as 'basic' | 'premium' | 'enterprise',
    phone_number: '',
    address: ''
  });

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        subscription_plan: tenant.subscription_plan as 'basic' | 'premium' | 'enterprise',
        phone_number: tenant.phone_number || '',
        address: tenant.address || ''
      });
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!tenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: formData.name,
          subscription_plan: formData.subscription_plan,
          phone_number: formData.phone_number,
          address: formData.address,
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: t('editTenantDialog.successTitle'),
        description: t('editTenantDialog.successDescription', { restaurantName: formData.name })
      });

      onTenantUpdated();
    } catch (error) {
      console.error('Error updating tenant:', error);
      const errorMessage = error instanceof Error ? error.message : t('editTenantDialog.genericError');

      toast({
        variant: "destructive",
        title: t('editTenantDialog.errorTitle'),
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('editTenantDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('editTenantDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant-name">{t('editTenantDialog.restaurantNameLabel')}</Label>
            <Input
              id="restaurant-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={t('editTenantDialog.restaurantNamePlaceholder')}
              className={isRTL ? 'text-right' : 'text-left'}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription-plan">{t('editTenantDialog.subscriptionPlanLabel')}</Label>
            <Select
              value={formData.subscription_plan}
              onValueChange={(value: 'basic' | 'premium' | 'enterprise') =>
                setFormData(prev => ({ ...prev, subscription_plan: value }))
              }
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">{t('plans.basic')}</SelectItem>
                <SelectItem value="premium">{t('plans.premium')}</SelectItem>
                <SelectItem value="enterprise">{t('plans.enterprise')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('editTenantDialog.phoneLabel')}</Label>
            <Input
              id="phone"
              value={formData.phone_number}
              onChange={(e) => setFormData(prev => ({ ...prev, phone_number: e.target.value }))}
              placeholder="+963 xxx xxx xxx"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('editTenantDialog.addressLabel')}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder={t('editTenantDialog.addressPlaceholder')}
              className={isRTL ? 'text-right' : 'text-left'}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              variant="hero"
            >
              {loading ? t('common.loading') : t('editTenantDialog.submitButton')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTenantDialog;