import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Plus, MoreVertical, Clock, User } from "lucide-react";
import AppointmentBookingModal from "./AppointmentBookingModal";

export default function QueueManagement() {
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: queueData, isLoading } = useQuery({
    queryKey: ["/api/queue"],
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
  });

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
  });

  const updateQueueStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      await apiRequest("PUT", `/api/queue/${id}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Queue updated",
        description: "Queue status has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update queue status.",
        variant: "destructive",
      });
    },
  });

  const removeFromQueueMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/queue/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Removed from queue",
        description: "Customer has been removed from the queue.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to remove customer from queue.",
        variant: "destructive",
      });
    },
  });

  const getCustomerName = (customerId: number) => {
    const customer = customers?.find((c: any) => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  const getServiceName = (serviceId: number) => {
    const service = services?.find((s: any) => s.id === serviceId);
    return service?.name || "Unknown Service";
  };

  const getServiceDuration = (serviceId: number) => {
    const service = services?.find((s: any) => s.id === serviceId);
    return service?.duration || 30;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'waiting':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'In Progress';
      case 'waiting':
        return 'Waiting';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Current Queue</CardTitle>
            <Button onClick={() => setIsBookingModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Walk-in
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {queueData?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`rounded-full w-8 h-8 flex items-center justify-center font-semibold text-white ${
                      item.status === 'in_progress' ? 'bg-primary' : 'bg-gray-400'
                    }`}>
                      {item.position}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{getCustomerName(item.customerId)}</p>
                      <p className="text-sm text-gray-600">
                        {getServiceName(item.serviceId)} • Est. {getServiceDuration(item.serviceId)} min
                      </p>
                      {item.barber && (
                        <p className="text-sm text-gray-500 flex items-center">
                          <User className="h-3 w-3 mr-1" />
                          {item.barber}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                    {item.estimatedWaitTime && (
                      <Badge variant="outline">
                        <Clock className="h-3 w-3 mr-1" />
                        {item.estimatedWaitTime}m
                      </Badge>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {item.status === 'waiting' && (
                          <DropdownMenuItem
                            onClick={() => updateQueueStatusMutation.mutate({ id: item.id, status: 'in_progress' })}
                          >
                            Start Service
                          </DropdownMenuItem>
                        )}
                        {item.status === 'in_progress' && (
                          <DropdownMenuItem
                            onClick={() => updateQueueStatusMutation.mutate({ id: item.id, status: 'completed' })}
                          >
                            Complete Service
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => removeFromQueueMutation.mutate(item.id)}
                          className="text-red-600"
                        >
                          Remove from Queue
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
              {(!queueData || queueData.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No customers in queue</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setIsBookingModalOpen(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Customer
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <AppointmentBookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        isWalkIn={true}
      />
    </>
  );
}
