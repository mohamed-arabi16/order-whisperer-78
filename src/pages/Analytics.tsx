import { useState, useEffect, useMemo } from "react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { addDays } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";

const Analytics = () => {
  const { profile, isAdmin, isRestaurantOwner } = useAuth();
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>({});
  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -7),
    to: new Date(),
  });

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      if (!profile || !date?.from || !date?.to) return;

      setLoading(true);
      try {
        let data: any = {};
        const fromDate = date.from.toISOString();
        const toDate = date.to.toISOString();

        if (isAdmin) {
          const { data: newTenants, error: newTenantsError } = await supabase.rpc(
            "get_new_tenants_over_time",
            { time_period_param: "day" }
          );
          if (newTenantsError) throw newTenantsError;
          data.newTenants = newTenants;
        }

        if (isRestaurantOwner) {
          const { data: tenantId, error: rpcError } = await supabase.rpc('get_user_tenant');
          if (rpcError) throw rpcError;

          if (tenantId) {
            const [
              { data: totalViews, error: totalViewsError },
              { data: popularItems, error: popularItemsError },
              { data: salesData, error: salesDataError },
              { data: feedback, error: feedbackError },
            ] = await Promise.all([
              supabase.rpc("get_total_menu_views", { tenant_id_param: tenantId }),
              supabase.rpc("get_popular_menu_items", { tenant_id_param: tenantId, limit_param: 5 }),
              supabase.rpc("get_sales_data", { tenant_id_param: tenantId, time_period_param: "day" }),
              supabase.from("feedback").select("rating, created_at").eq("tenant_id", tenantId).gte("created_at", fromDate).lte("created_at", toDate),
            ]);

            if (totalViewsError) console.error("Total Views Error:", totalViewsError);
            if (popularItemsError) console.error("Popular Items Error:", popularItemsError);
            if (salesDataError) console.error("Sales Data Error:", salesDataError);
            if (feedbackError) console.error("Feedback Error:", feedbackError);

            data.totalViews = totalViews;
            data.popularItems = popularItems;
            data.salesData = salesData;
            data.feedback = feedback;
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
  }, [profile, isAdmin, isRestaurantOwner, date]);

  const { feedbackDistribution, averageRatingOverTime } = useMemo(() => {
    if (!analyticsData.feedback) return { feedbackDistribution: [], averageRatingOverTime: [] };

    const distribution = Object.entries(
      analyticsData.feedback.reduce((acc: any, item: any) => {
        acc[item.rating] = (acc[item.rating] || 0) + 1;
        return acc;
      }, {})
    ).map(([rating, count]) => ({ rating: `${rating} ${t('analytics.rating')}`, count }));

    const avgRating = analyticsData.feedback
      .map((item: any) => ({ ...item, date: new Date(item.created_at).toLocaleDateString() }))
      .reduce((acc: any, item: any) => {
        const existing = acc.find((i: any) => i.date === item.date);
        if (existing) {
          existing.total_rating += item.rating;
          existing.count++;
          existing.avg_rating = existing.total_rating / existing.count;
        } else {
          acc.push({ date: item.date, total_rating: item.rating, count: 1, avg_rating: item.rating });
        }
        return acc;
      }, []);

    return { feedbackDistribution: distribution, averageRatingOverTime: avgRating };
  }, [analyticsData.feedback, t]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('analytics.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-hero bg-clip-text text-transparent">
              {t('analytics.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('analytics.description')}
            </p>
          </div>
          <DateRangePicker date={date} onDateChange={setDate} />
        </div>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>{t('analytics.newUsers')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={{}}>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.newTenants}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date_trunc" />
                    <YAxis />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="new_tenants_count"
                      stroke="hsl(var(--primary))"
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        {isRestaurantOwner && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.totalMenuViews')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analyticsData.totalViews || 0}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.totalRevenue')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">
                    ${analyticsData.salesData?.reduce((acc: any, item: any) => acc + parseFloat(item.total_sales), 0).toFixed(2) || 0}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('analytics.totalFeedback')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold">{analyticsData.feedback?.length || 0}</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.popularItems')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ total_orders: { label: t('analytics.totalOrders'), color: 'hsl(var(--primary))' } }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.popularItems}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Bar dataKey="total_orders" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.revenueOverTime')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{ total_sales: { label: t('analytics.totalSales'), color: 'hsl(var(--primary))' } }}>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData.salesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date_trunc" />
                      <YAxis />
                      <Tooltip content={<ChartTooltipContent />} />
                      <Legend />
                      <Line type="monotone" dataKey="total_sales" stroke="hsl(var(--primary))" />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('analytics.customerFeedback')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">{t('analytics.ratingDistribution')}</h3>
                    <ChartContainer config={{ count: { label: t('analytics.count'), color: 'hsl(var(--primary))' } }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={feedbackDistribution}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="rating" />
                          <YAxis />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Bar dataKey="count" fill="hsl(var(--primary))" />
                        </BarChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">{t('analytics.avgRatingOverTime')}</h3>
                    <ChartContainer config={{ avg_rating: { label: t('analytics.avgRating'), color: 'hsl(var(--primary))' } }}>
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={averageRatingOverTime}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis domain={[1, 5]} />
                          <Tooltip content={<ChartTooltipContent />} />
                          <Line type="monotone" dataKey="avg_rating" stroke="hsl(var(--primary))" />
                        </LineChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;