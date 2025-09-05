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

const createTenantSchema = z.object({
  restaurantName: z.string().min(2, { message: "Restaurant name must be at least 2 characters." }),
  ownerName: z.string().min(2, { message: "Owner name must be at least 2 characters." }),
  ownerEmail: z.string().email({ message: "Invalid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
  subscriptionPlan: z.enum(['basic', 'premium', 'enterprise']),
  phoneNumber: z.string().optional(),
  address: z.string().optional(),
});

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
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);

  const form = useForm<z.infer<typeof createTenantSchema>>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      restaurantName: "",
      ownerName: "",
      ownerEmail: "",
      password: "",
      subscriptionPlan: "basic",
      phoneNumber: "",
      address: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset();
    }
  }, [open, form]);

  const handleSubmit = async (values: z.infer<typeof createTenantSchema>) => {
    try {
      const { error } = await supabase.functions.invoke('create-tenant', {
        body: values,
      });

      if (error) throw error;

      toast({
        title: t('createTenantDialog.successTitle'),
        description: t('createTenantDialog.successDescription', { restaurantName: values.restaurantName })
      });

      onTenantCreated();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating tenant:', error);
      const errorMessage = error instanceof Error ? error.message : t('createTenantDialog.genericError');

      toast({
        variant: "destructive",
        title: t('createTenantDialog.errorTitle'),
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
            <DialogTitle>{t('createTenantDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('createTenantDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="restaurantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('createTenantDialog.restaurantNameLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('createTenantDialog.restaurantNamePlaceholder')}
                      className={isRTL ? 'text-right' : 'text-left'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('createTenantDialog.ownerNameLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('createTenantDialog.ownerNamePlaceholder')}
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
                name="ownerEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('createTenantDialog.ownerEmailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="owner@restaurant.com"
                        className="text-left"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('createTenantDialog.passwordLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
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
              name="subscriptionPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('createTenantDialog.subscriptionPlanLabel')}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
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
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('createTenantDialog.phoneLabel')}</FormLabel>
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
                  <FormLabel>{t('createTenantDialog.addressLabel')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('createTenantDialog.addressPlaceholder')}
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
                {form.formState.isSubmitting ? t('common.loading') : t('createTenantDialog.submitButton')}
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

export default CreateTenantDialog;