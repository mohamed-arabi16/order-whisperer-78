import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";

const Analytics = () => {
  const { profile, isAdmin, isRestaurantOwner } = useAuth();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!profile) return;

      setLoading(true);
      try {
        let data: any = {};
        if (isAdmin) {
          const { data: newTenants, error: newTenantsError } = await supabase.rpc(
            "get_new_tenants_over_time_by_date_range",
            { start_date_param: date?.from, end_date_param: date?.to }
          );
          if (newTenantsError) throw newTenantsError;
          data.newTenants = newTenants;
        }

        if (isRestaurantOwner) {
          const { data: tenantId, error: rpcError } = await supabase.rpc('get_user_tenant');
          if (rpcError) throw rpcError;

          if (tenantId) {
            const { data: totalViews, error: totalViewsError } = await supabase.rpc(
              "get_total_menu_views",
              { tenant_id_param: tenantId }
            );
            if (totalViewsError) throw totalViewsError;
            data.totalViews = totalViews;

            const { data: popularItems, error: popularItemsError } = await supabase.rpc(
              "get_popular_menu_items",
              { tenant_id_param: tenantId, limit_param: 5 }
            );
            if (popularItemsError) throw popularItemsError;
            data.popularItems = popularItems;

            const { data: salesData, error: salesDataError } = await supabase.rpc(
              "get_sales_data_by_date_range",
              { tenant_id_param: tenantId, start_date_param: date?.from, end_date_param: date?.to }
            );
            if (salesDataError) throw salesDataError;
            data.salesData = salesData;

            const { data: orderBreakdown, error: orderBreakdownError } = await supabase.rpc(
              "get_order_breakdown_by_type",
              { tenant_id_param: tenantId, start_date_param: date?.from, end_date_param: date?.to }
            );
            if (orderBreakdownError) throw orderBreakdownError;
            data.orderBreakdown = orderBreakdown;

            const { data: avgOrderValue, error: avgOrderValueError } = await supabase.rpc(
              "get_average_order_value_over_time",
              { tenant_id_param: tenantId, start_date_param: date?.from, end_date_param: date?.to }
            );
            if (avgOrderValueError) throw avgOrderValueError;
            data.avgOrderValue = avgOrderValue;
          }
        }
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [profile, isAdmin, isRestaurantOwner]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل التحليلات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pt-16" dir="rtl">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
              لوحة التحليلات
            </h1>
            <p className="text-muted-foreground mt-1">
              نظرة شاملة على أداء مطعمك
            </p>
          </div>
          <DateRangePicker date={date} onDateChange={setDate} />
        </div>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>المستخدمون الجدد</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.newTenants}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date_trunc" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="new_tenants_count"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {isRestaurantOwner && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>إجمالي مشاهدات القائمة</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analyticsData.totalViews}</p>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>الأصناف الأكثر طلباً</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.popularItems}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="total_orders" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>المبيعات اليومية</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.salesData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date_trunc" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="total_sales"
                      stroke="#8884d8"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Order Breakdown by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.orderBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="order_type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="order_count" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Average Order Value Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.avgOrderValue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date_trunc" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avg_order_value"
                      stroke="#82ca9d"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
