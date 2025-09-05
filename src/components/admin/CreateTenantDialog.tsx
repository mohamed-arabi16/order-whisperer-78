import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "@/hooks/useTranslation";

/**
 * Props for the CreateTenantDialog component.
 */
interface CreateTenantDialogProps {
  /**
   * Whether the dialog is open.
   */
  open: boolean;
  /**
   * Callback function to change the open state of the dialog.
   * @param open - The new open state.
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Callback function to be called when a new tenant is created successfully.
   */
  onTenantCreated: () => void;
}

/**
 * A dialog component for creating a new tenant (restaurant).
 * It includes a form to collect tenant information and calls a Supabase function to create the tenant.
 *
 * @param {CreateTenantDialogProps} props - The props for the component.
 * @returns {JSX.Element} The rendered dialog component.
 */
const CreateTenantDialog = ({
  open,
  onOpenChange,
  onTenantCreated,
}: CreateTenantDialogProps): JSX.Element => {
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    restaurantName: '',
    ownerName: '',
    ownerEmail: '',
    password: '',
    subscriptionPlan: 'basic' as 'basic' | 'premium' | 'enterprise',
    phoneNumber: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-tenant', {
        body: formData,
      });

      if (error) throw error;

      toast({
        title: t('createTenantDialog.successTitle'),
        description: t('createTenantDialog.successDescription', { restaurantName: formData.restaurantName })
      });

      // Reset form
      setFormData({
        restaurantName: '',
        ownerName: '',
        ownerEmail: '',
        password: '',
        subscriptionPlan: 'basic',
        phoneNumber: '',
        address: ''
      });

      onTenantCreated();
    } catch (error) {
      console.error('Error creating tenant:', error);
      const errorMessage = error instanceof Error ? error.message : t('createTenantDialog.genericError');

      toast({
        variant: "destructive",
        title: t('createTenantDialog.errorTitle'),
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
          <DialogTitle>{t('createTenantDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('createTenantDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="restaurant-name">{t('createTenantDialog.restaurantNameLabel')}</Label>
            <Input
              id="restaurant-name"
              value={formData.restaurantName}
              onChange={(e) => setFormData(prev => ({ ...prev, restaurantName: e.target.value }))}
              placeholder={t('createTenantDialog.restaurantNamePlaceholder')}
              className={isRTL ? 'text-right' : 'text-left'}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="owner-name">{t('createTenantDialog.ownerNameLabel')}</Label>
              <Input
                id="owner-name"
                value={formData.ownerName}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                placeholder={t('createTenantDialog.ownerNamePlaceholder')}
                className={isRTL ? 'text-right' : 'text-left'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-email">{t('createTenantDialog.ownerEmailLabel')}</Label>
              <Input
                id="owner-email"
                type="email"
                value={formData.ownerEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, ownerEmail: e.target.value }))}
                placeholder="owner@restaurant.com"
                className="text-left"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t('createTenantDialog.passwordLabel')}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              placeholder="••••••••"
              className={isRTL ? 'text-right' : 'text-left'}
              minLength={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subscription-plan">{t('createTenantDialog.subscriptionPlanLabel')}</Label>
            <Select 
              value={formData.subscriptionPlan} 
              onValueChange={(value: 'basic' | 'premium' | 'enterprise') => 
                setFormData(prev => ({ ...prev, subscriptionPlan: value }))
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
            <Label htmlFor="phone">{t('createTenantDialog.phoneLabel')}</Label>
            <Input
              id="phone"
              value={formData.phoneNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
              placeholder="+963 xxx xxx xxx"
              className="text-left"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t('createTenantDialog.addressLabel')}</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              placeholder={t('createTenantDialog.addressPlaceholder')}
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
              {loading ? t('common.loading') : t('createTenantDialog.submitButton')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateTenantDialog;