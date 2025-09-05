import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import SuperAdminDashboard from "@/components/admin/SuperAdminDashboard";
import RestaurantDashboard from "@/components/restaurant/RestaurantDashboard";

/**
 * A page component that acts as a router for the dashboard.
 * It displays the appropriate dashboard based on the user's role.
 *
 * @returns {JSX.Element} The rendered dashboard page.
 */
const Dashboard = (): JSX.Element => {
  const { user, profile, loading, isAdmin, isRestaurantOwner } = useAuth();

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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (isAdmin) {
    return <SuperAdminDashboard />;
  }

  if (isRestaurantOwner) {
    return <RestaurantDashboard />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4" dir="rtl">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">مرحباً {profile?.full_name}</h1>
        <p className="text-muted-foreground">جاري إعداد لوحة التحكم...</p>
      </div>
    </div>
  );
};

export default Dashboard;