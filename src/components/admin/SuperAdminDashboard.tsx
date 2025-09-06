import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, Plus, Users, Building2, Settings, Search, Download, LineChart, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Papa from "papaparse";
import CreateTenantDialog from "./CreateTenantDialog";
import EditTenantDialog from "./EditTenantDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

/**
 * Represents a tenant with its associated owner information.
 */
interface Tenant {
  id: string;
  name: string;
  slug: string;
  subscription_plan: string;
  is_active: boolean;
  created_at: string;
  phone_number: string | null;
  address: string | null;
  owner?: {
    full_name: string;
    email: string;
  };
}

/**
 * The main dashboard for super administrators.
 * It provides an overview of all tenants, statistics, and management functionalities.
 *
 * @returns {JSX.Element} The rendered super admin dashboard component.
 */
const SuperAdminDashboard = (): JSX.Element => {
  const { profile } = useAuth();
  const { t, isRTL } = useTranslation();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const itemsPerPage = 5;

  const filteredTenants = useMemo(() => {
    const filtered = tenants.filter(tenant => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        tenant.name.toLowerCase().includes(searchTermLower) ||
        tenant.owner?.full_name?.toLowerCase().includes(searchTermLower) ||
        tenant.owner?.email?.toLowerCase().includes(searchTermLower);

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && tenant.is_active) ||
        (statusFilter === 'inactive' && !tenant.is_active);

      const matchesPlan =
        planFilter === 'all' || tenant.subscription_plan === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
    return filtered;
  }, [tenants, searchTerm, statusFilter, planFilter]);

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage);
  const paginatedTenants = filteredTenants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenants(prev =>
      prev.includes(tenantId)
        ? prev.filter(id => id !== tenantId)
        : [...prev, tenantId]
    );
  };

  const handleSelectAll = () => {
    if (selectedTenants.length === paginatedTenants.length) {
      setSelectedTenants([]);
    } else {
      setSelectedTenants(paginatedTenants.map(t => t.id));
    }
  };

  const handleBulkAction = async (action: 'activate' | 'deactivate') => {
    setIsBulkProcessing(true);
    try {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: action === 'activate' })
        .in('id', selectedTenants);

      if (error) throw error;

      toast({
        title: t('superAdmin.bulkActions.successTitle'),
        description: t('superAdmin.bulkActions.successDescription', { count: selectedTenants.length, action: t(`common.${action}d`) }),
      });

      fetchTenants();
      setSelectedTenants([]);
    } catch (error) {
      console.error(`Error ${action} tenants:`, error);
      toast({
        variant: "destructive",
        title: t('superAdmin.errors.bulkActionTitle'),
        description: t('superAdmin.errors.bulkActionDescription'),
      });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const fetchTenants = async () => {
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select(`
          *,
          owner:profiles!tenants_owner_id_fkey(full_name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTenants(data || []);
    } catch (error) {
      console.error('Error fetching tenants:', error);
      toast({
        variant: "destructive",
        title: t('superAdmin.errors.fetchTenantsTitle'),
        description: t('superAdmin.errors.fetchTenantsDescription'),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTenantCreated = () => {
    fetchTenants();
    setShowCreateDialog(false);
  };

  const handleTenantUpdated = () => {
    fetchTenants();
    setShowEditDialog(false);
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowEditDialog(true);
  };

  const handleExport = () => {
    const dataToExport = filteredTenants.map(tenant => ({
      'Restaurant Name': tenant.name,
      'Owner Name': tenant.owner?.full_name,
      'Owner Email': tenant.owner?.email,
      'Subscription Plan': tenant.subscription_plan,
      'Status': tenant.is_active ? 'Active' : 'Inactive',
      'Registration Date': new Date(tenant.created_at).toISOString().split('T')[0],
    }));

    const csv = Papa.unparse(dataToExport);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'tenants.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
              {t('superAdmin.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('superAdmin.welcome', { name: profile?.full_name || 'User' })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('superAdmin.stats.totalRestaurants')}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tenants.length}</div>
              <p className="text-xs text-muted-foreground">
                {t('superAdmin.stats.activeCount', { count: tenants.filter(t => t.is_active).length })}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('superAdmin.stats.paidPlans')}</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.subscription_plan !== 'basic').length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('superAdmin.stats.outOfTotal', { total: tenants.length })}
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('superAdmin.stats.activeAccounts')}</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {tenants.filter(t => t.is_active).length}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('superAdmin.stats.activityPercentage', { 
                  percentage: tenants.length > 0 ? Math.round((tenants.filter(t => t.is_active).length / tenants.length) * 100) : 0 
                })}
              </p>
            </CardContent>
          </Card>
          <Card
            className="shadow-card hover:shadow-warm transition-smooth cursor-pointer"
            onClick={() => navigate('/analytics')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                navigate('/analytics');
              }
            }}
            role="button"
            tabIndex={0}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('superAdmin.stats.analytics')}</CardTitle>
              <LineChart className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('common.view')}</div>
              <p className="text-xs text-muted-foreground">
                {t('superAdmin.stats.analyticsDescription')}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tenants Management */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>{t('superAdmin.tenantsManagement.title')}</CardTitle>
                <CardDescription>
                  {t('superAdmin.tenantsManagement.description')}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <Button
                  onClick={handleExport}
                  variant="outline"
                  className="flex items-center gap-2"
                  aria-label={t('superAdmin.tenantsManagement.exportAriaLabel')}
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {t('common.export')}
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  variant="hero"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {t('superAdmin.tenantsManagement.addButton')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  placeholder={t('superAdmin.filters.searchPlaceholder')}
                  aria-label={t('superAdmin.filters.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('superAdmin.filters.status.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('superAdmin.filters.status.all')}</SelectItem>
                  <SelectItem value="active">{t('superAdmin.filters.status.active')}</SelectItem>
                  <SelectItem value="inactive">{t('superAdmin.filters.status.inactive')}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger>
                  <SelectValue placeholder={t('superAdmin.filters.plan.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('superAdmin.filters.plan.all')}</SelectItem>
                  <SelectItem value="basic">{t('plans.basic')}</SelectItem>
                  <SelectItem value="premium">{t('plans.premium')}</SelectItem>
                  <SelectItem value="enterprise">{t('plans.enterprise')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {paginatedTenants.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('superAdmin.noTenants.title')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('superAdmin.noTenants.description')}
                </p>
                <Button 
                  onClick={() => setShowCreateDialog(true)}
                  variant="hero"
                >
                  {t('superAdmin.tenantsManagement.addButton')}
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedTenants.length === paginatedTenants.length && paginatedTenants.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium">
                      {t('superAdmin.bulkActions.selectAll', { count: selectedTenants.length })}
                    </label>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" disabled={selectedTenants.length === 0 || isBulkProcessing}>
                        {isBulkProcessing ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4 mr-2" />
                        )}
                        {isBulkProcessing ? t('common.processing') : t('superAdmin.bulkActions.title')}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => handleBulkAction('activate')}>
                        {t('superAdmin.bulkActions.activate')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleBulkAction('deactivate')}>
                        {t('superAdmin.bulkActions.deactivate')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="space-y-4">
                  {paginatedTenants.map((tenant) => (
                    <div
                      key={tenant.id}
                      className="flex items-center justify-between p-4 border rounded-lg bg-card hover:shadow-md transition-smooth"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <Checkbox
                        checked={selectedTenants.includes(tenant.id)}
                        onCheckedChange={() => handleSelectTenant(tenant.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-medium text-lg">{tenant.name}</h3>
                          <Badge
                            variant={tenant.is_active ? "default" : "secondary"}
                            className={tenant.is_active ? "bg-fresh-green" : ""}
                          >
                            {tenant.is_active ? t('common.active') : t('common.inactive')}
                          </Badge>
                          <Badge variant="outline">
                            {t(`plans.${tenant.subscription_plan}` as any)}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{t('superAdmin.tenant.owner')}: {tenant.owner?.full_name}</p>
                          <p>{t('superAdmin.tenant.email')}: {tenant.owner?.email}</p>
                          <p>{t('superAdmin.tenant.registrationDate')}: {new Date(tenant.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditClick(tenant)}>
                        {t('common.edit')}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => navigate(`/menu/${tenant.slug}`)}>
                        {t('superAdmin.tenant.viewMenu')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="pt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.max(prev - 1, 1));
                          }}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
                          aria-label={t('superAdmin.pagination.previous')}
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(i + 1);
                            }}
                            isActive={currentPage === i + 1}
                            aria-label={t('superAdmin.pagination.page', { page: i + 1 })}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(prev => Math.min(prev + 1, totalPages));
                          }}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
                          aria-label={t('superAdmin.pagination.next')}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
              </>
            )}
          </CardContent>
        </Card>

        <CreateTenantDialog 
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onTenantCreated={handleTenantCreated}
        />
        <EditTenantDialog
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onTenantUpdated={handleTenantUpdated}
          tenant={selectedTenant}
        />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;