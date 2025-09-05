import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
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

const editTenantSchema = z.object({
  name: z.string().min(2, { message: "Restaurant name must be at least 2 characters." }),
  subscription_plan: z.enum(['basic', 'premium', 'enterprise']),
  phone_number: z.string().optional(),
  address: z.string().optional(),
});

/**
 * Represents a tenant object.
 */
interface Tenant {
  id: string;
  name: string;
  subscription_plan: string;
  phone_number: string | null;
  address: string | null;
}

/**
 * Props for the EditTenantDialog component.
 */
interface EditTenantDialogProps {
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
   * Callback function to be called when the tenant is updated successfully.
   */
  onTenantUpdated: () => void;
  /**
   * The tenant object to be edited.
   */
  tenant: Tenant | null;
}

/**
 * A dialog component for editing an existing tenant.
 * It is pre-filled with the tenant's current data and allows for updates.
 *
 * @param {EditTenantDialogProps} props - The props for the component.
 * @returns {JSX.Element} The rendered dialog component.
 */
const EditTenantDialog = ({
  open,
  onOpenChange,
  onTenantUpdated,
  tenant,
}: EditTenantDialogProps): JSX.Element => {
  const { t, isRTL } = useTranslation();
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  const form = useForm<z.infer<typeof editTenantSchema>>({
    resolver: zodResolver(editTenantSchema),
    defaultValues: {
      name: "",
      subscription_plan: "basic",
      phone_number: "",
      address: "",
    },
  });

  useEffect(() => {
    if (tenant && open) {
      form.reset({
        name: tenant.name,
        subscription_plan: tenant.subscription_plan as 'basic' | 'premium' | 'enterprise',
        phone_number: tenant.phone_number || '',
        address: tenant.address || ''
      });
    }
  }, [tenant, open, form]);

  const handleSubmit = async (values: z.infer<typeof editTenantSchema>) => {
    if (!tenant) return;

    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          name: values.name,
          subscription_plan: values.subscription_plan,
          phone_number: values.phone_number,
          address: values.address,
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: t('editTenantDialog.successTitle'),
        description: t('editTenantDialog.successDescription', { restaurantName: values.name })
      });

      onTenantUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating tenant:', error);
      const errorMessage = error instanceof Error ? error.message : t('editTenantDialog.genericError');

      toast({
        variant: "destructive",
        title: t('editTenantDialog.errorTitle'),
        description: errorMessage
      });
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && form.formState.isDirty) {
      setShowUnsavedChangesDialog(true);
    } else {
      onOpenChange(isOpen);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader>
            <DialogTitle>{t('editTenantDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('editTenantDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('editTenantDialog.restaurantNameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('editTenantDialog.restaurantNamePlaceholder')}
                      className={isRTL ? 'text-right' : 'text-left'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subscription_plan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('editTenantDialog.subscriptionPlanLabel')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <FormControl>
                      <SelectTrigger className={isRTL ? 'text-right' : 'text-left'}>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="basic">{t('plans.basic')}</SelectItem>
                      <SelectItem value="premium">{t('plans.premium')}</SelectItem>
                      <SelectItem value="enterprise">{t('plans.enterprise')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phone_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('editTenantDialog.phoneLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+963 xxx xxx xxx"
                      className="text-left"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('editTenantDialog.addressLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('editTenantDialog.addressPlaceholder')}
                      className={isRTL ? 'text-right' : 'text-left'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                disabled={form.formState.isSubmitting}
                variant="hero"
              >
                {form.formState.isSubmitting ? t('common.loading') : t('editTenantDialog.submitButton')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
      <AlertDialogContent dir={isRTL ? 'rtl' : 'ltr'}>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('common.unsavedChanges')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('common.unsavedChangesDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.stay')}</AlertDialogCancel>
          <AlertDialogAction onClick={() => onOpenChange(false)}>
            {t('common.leave')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
};

export default EditTenantDialog;