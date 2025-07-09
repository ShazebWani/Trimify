import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import QueueManagement from "@/components/QueueManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Clock, DollarSign, Plus, CreditCard, Star } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();

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

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  const { data: todaysAppointments } = useQuery({
    queryKey: ["/api/appointments/today"],
    enabled: isAuthenticated,
  });

  const { data: recentReviews } = useQuery({
    queryKey: ["/api/reviews/recent"],
    enabled: isAuthenticated,
  });

  const { data: todaysTransactions } = useQuery({
    queryKey: ["/api/transactions/today"],
    enabled: isAuthenticated,
  });

  const { data: gallery } = useQuery({
    queryKey: ["/api/gallery"],
    enabled: isAuthenticated,
  });

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
        {/* Dashboard Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Welcome back! Here's what's happening at {user?.barbershopName || 'your barbershop'} today.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today's Queue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.todayQueueCount || 0}
                  </p>
                </div>
                <div className="bg-blue-100 rounded-full p-3">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">+8.2%</span>
                <span className="text-gray-500 text-sm ml-2">vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Appointments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : stats?.todayAppointmentCount || 0}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">+15.3%</span>
                <span className="text-gray-500 text-sm ml-2">vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Wait</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : `${stats?.averageWaitTime || 0} min`}
                  </p>
                </div>
                <div className="bg-orange-100 rounded-full p-3">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">-12.5%</span>
                <span className="text-gray-500 text-sm ml-2">vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {statsLoading ? "..." : `$${stats?.todayRevenue || 0}`}
                  </p>
                </div>
                <div className="bg-green-100 rounded-full p-3">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-green-600 text-sm font-medium">+22.1%</span>
                <span className="text-gray-500 text-sm ml-2">vs yesterday</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Current Queue */}
          <div className="lg:col-span-2">
            <QueueManagement />
          </div>

          {/* Today's Appointments */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Today's Appointments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {todaysAppointments?.map((appointment: any) => (
                    <div key={appointment.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${
                          appointment.status === 'completed' ? 'bg-green-500' :
                          appointment.status === 'in_progress' ? 'bg-yellow-500' :
                          'bg-gray-400'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900">{appointment.customer?.name}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(appointment.startTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })} - {new Date(appointment.endTime).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={
                        appointment.status === 'completed' ? 'default' :
                        appointment.status === 'in_progress' ? 'secondary' :
                        'outline'
                      }>
                        {appointment.status === 'completed' ? 'Completed' :
                         appointment.status === 'in_progress' ? 'In Progress' :
                         'Scheduled'}
                      </Badge>
                    </div>
                  ))}
                  {!todaysAppointments?.length && (
                    <p className="text-gray-500 text-center py-8">No appointments today</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Features Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" variant="default">
                  <Plus className="h-4 w-4 mr-2" />
                  New Appointment
                </Button>
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  Add Customer
                </Button>
                <Button className="w-full" variant="outline">
                  <Star className="h-4 w-4 mr-2" />
                  Manage Gallery
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentReviews?.map((review: any) => (
                  <div key={review.id} className="border-b border-gray-100 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{review.customer?.name}</p>
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : ''}`} />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{review.comment}</p>
                  </div>
                ))}
                {!recentReviews?.length && (
                  <p className="text-gray-500 text-center py-8">No reviews yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* POS Summary */}
          <Card>
            <CardHeader>
              <CardTitle>POS Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Sales Today</span>
                  <span className="font-semibold text-gray-900">
                    ${todaysTransactions?.reduce((sum: number, t: any) => sum + Number(t.total), 0) || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Transactions</span>
                  <span className="font-semibold text-gray-900">{todaysTransactions?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Ticket</span>
                  <span className="font-semibold text-gray-900">
                    ${todaysTransactions?.length ? 
                      (todaysTransactions.reduce((sum: number, t: any) => sum + Number(t.total), 0) / todaysTransactions.length).toFixed(0) : 
                      0}
                  </span>
                </div>
                <Button className="w-full mt-4" variant="default">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Open POS
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Gallery Preview */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Haircut Gallery</CardTitle>
                <Button variant="ghost" className="text-primary">
                  View All →
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {gallery?.slice(0, 6).map((item: any) => (
                  <div key={item.id} className="relative group cursor-pointer">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity rounded-lg"></div>
                  </div>
                ))}
                {(!gallery || gallery.length === 0) && (
                  <div className="col-span-full text-center py-8">
                    <p className="text-gray-500">No gallery items yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
