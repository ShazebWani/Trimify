import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Clock, 
  DollarSign,
  Star,
  BarChart3,
  PieChart
} from "lucide-react";

export default function Analytics() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    enabled: isAuthenticated,
  });

  const { data: appointments } = useQuery({
    queryKey: ["/api/appointments"],
    enabled: isAuthenticated,
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: isAuthenticated,
  });

  const { data: reviews } = useQuery({
    queryKey: ["/api/reviews"],
    enabled: isAuthenticated,
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: isAuthenticated,
  });

  // Calculate analytics
  const calculateWeeklyRevenue = () => {
    if (!transactions) return { thisWeek: 0, lastWeek: 0, change: 0 };
    
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const lastWeekStart = new Date(weekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisWeek = transactions.filter((t: any) => 
      new Date(t.createdAt) >= weekStart
    ).reduce((sum: number, t: any) => sum + Number(t.total), 0);
    
    const lastWeek = transactions.filter((t: any) => {
      const date = new Date(t.createdAt);
      return date >= lastWeekStart && date < weekStart;
    }).reduce((sum: number, t: any) => sum + Number(t.total), 0);
    
    const change = lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0;
    
    return { thisWeek, lastWeek, change };
  };

  const calculateCustomerRetention = () => {
    if (!customers) return 0;
    const returningCustomers = customers.filter((c: any) => (c.visitCount || 0) > 1);
    return customers.length > 0 ? (returningCustomers.length / customers.length) * 100 : 0;
  };

  const calculateAverageRating = () => {
    if (!reviews || reviews.length === 0) return 0;
    const totalRating = reviews.reduce((sum: number, r: any) => sum + r.rating, 0);
    return totalRating / reviews.length;
  };

  const getPopularServices = () => {
    if (!appointments || !services) return [];
    
    const serviceCounts = appointments.reduce((acc: any, apt: any) => {
      acc[apt.serviceId] = (acc[apt.serviceId] || 0) + 1;
      return acc;
    }, {});
    
    return services
      .map((service: any) => ({
        ...service,
        count: serviceCounts[service.id] || 0
      }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  };

  const getPeakHours = () => {
    if (!appointments) return [];
    
    const hourCounts = appointments.reduce((acc: any, apt: any) => {
      const hour = new Date(apt.startTime).getHours();
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    
    return Object.entries(hourCounts)
      .map(([hour, count]) => ({ hour: parseInt(hour), count }))
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 5);
  };

  const weeklyRevenue = calculateWeeklyRevenue();
  const customerRetention = calculateCustomerRetention();
  const averageRating = calculateAverageRating();
  const popularServices = getPopularServices();
  const peakHours = getPeakHours();

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Track your barbershop's performance and growth</p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{customers?.length || 0}</p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">+12.3%</span>
                <span className="text-gray-500 text-sm ml-2">vs last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Weekly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">${weeklyRevenue.thisWeek.toFixed(0)}</p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                {weeklyRevenue.change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                )}
                <span className={`text-sm font-medium ${
                  weeklyRevenue.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {weeklyRevenue.change >= 0 ? '+' : ''}{weeklyRevenue.change.toFixed(1)}%
                </span>
                <span className="text-gray-500 text-sm ml-2">vs last week</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customer Retention</p>
                  <p className="text-2xl font-bold text-gray-900">{customerRetention.toFixed(1)}%</p>
                </div>
                <div className="bg-purple-100 rounded-full p-3">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <Progress value={customerRetention} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Rating</p>
                  <p className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</p>
                </div>
                <div className="bg-yellow-100 rounded-full p-3">
                  <Star className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <div className="flex text-yellow-400 mr-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < Math.floor(averageRating) ? 'fill-current' : ''}`} />
                  ))}
                </div>
                <span className="text-gray-500 text-sm">({reviews?.length || 0} reviews)</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Popular Services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Popular Services
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {popularServices.map((service: any, index: number) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-600">${service.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{service.count}</p>
                      <p className="text-sm text-gray-600">bookings</p>
                    </div>
                  </div>
                ))}
                {popularServices.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No service data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Peak Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {peakHours.map((hour: any, index: number) => (
                  <div key={hour.hour} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-orange-100 text-orange-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {hour.hour === 0 ? '12:00 AM' : 
                           hour.hour === 12 ? '12:00 PM' :
                           hour.hour < 12 ? `${hour.hour}:00 AM` : 
                           `${hour.hour - 12}:00 PM`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">{hour.count}</p>
                      <p className="text-sm text-gray-600">appointments</p>
                    </div>
                  </div>
                ))}
                {peakHours.length === 0 && (
                  <p className="text-center text-gray-500 py-8">No appointment data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Overview */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Monthly Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{appointments?.length || 0}</p>
                  <p className="text-sm text-gray-600">Total Appointments</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats?.todayQueueCount || 0}</p>
                  <p className="text-sm text-gray-600">Queue Today</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{stats?.averageWaitTime || 0}m</p>
                  <p className="text-sm text-gray-600">Avg Wait Time</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    ${transactions?.reduce((sum: number, t: any) => sum + Number(t.total), 0).toFixed(0) || 0}
                  </p>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
