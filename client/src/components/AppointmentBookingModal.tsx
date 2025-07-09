import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertAppointmentSchema, insertQueueSchema } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, User } from "lucide-react";

interface AppointmentBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isWalkIn?: boolean;
  appointmentToEdit?: any;
}

const appointmentFormSchema = insertAppointmentSchema.extend({
  customerId: z.number().min(1, "Please select a customer"),
  serviceId: z.number().min(1, "Please select a service"),
  startTime: z.string().min(1, "Please select a date and time"),
  endTime: z.string().min(1, "End time is required"),
});

const queueFormSchema = insertQueueSchema.extend({
  customerId: z.number().min(1, "Please select a customer"),
  serviceId: z.number().min(1, "Please select a service"),
  position: z.number().min(1, "Position is required"),
});

export default function AppointmentBookingModal({
  isOpen,
  onClose,
  isWalkIn = false,
  appointmentToEdit,
}: AppointmentBookingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers } = useQuery({
    queryKey: ["/api/customers"],
    enabled: isOpen,
  });

  const { data: services } = useQuery({
    queryKey: ["/api/services"],
    enabled: isOpen,
  });

  const { data: queueData } = useQuery({
    queryKey: ["/api/queue"],
    enabled: isOpen && isWalkIn,
  });

  const form = useForm<z.infer<typeof appointmentFormSchema>>({
    resolver: zodResolver(isWalkIn ? queueFormSchema : appointmentFormSchema),
    defaultValues: {
      customerId: appointmentToEdit?.customerId || 0,
      serviceId: appointmentToEdit?.serviceId || 0,
      barber: appointmentToEdit?.barber || "",
      startTime: appointmentToEdit?.startTime || "",
      endTime: appointmentToEdit?.endTime || "",
      notes: appointmentToEdit?.notes || "",
      position: queueData?.length ? queueData.length + 1 : 1,
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appointmentFormSchema>) => {
      const endpoint = isWalkIn ? "/api/queue" : "/api/appointments";
      await apiRequest("POST", endpoint, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/queue"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: isWalkIn ? "Added to queue successfully" : "Appointment created successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: isWalkIn ? "Failed to add to queue" : "Failed to create appointment",
        variant: "destructive",
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof appointmentFormSchema>) => {
      await apiRequest("PUT", `/api/appointments/${appointmentToEdit.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
      onClose();
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof appointmentFormSchema>) => {
    if (isWalkIn) {
      const queueData = {
        customerId: data.customerId,
        serviceId: data.serviceId,
        barber: data.barber,
        position: queueData?.length ? queueData.length + 1 : 1,
        estimatedWaitTime: calculateEstimatedWaitTime(data.serviceId),
      };
      createAppointmentMutation.mutate(queueData as any);
    } else {
      if (appointmentToEdit) {
        updateAppointmentMutation.mutate(data);
      } else {
        createAppointmentMutation.mutate(data);
      }
    }
  };

  const calculateEstimatedWaitTime = (serviceId: number) => {
    const service = services?.find((s: any) => s.id === serviceId);
    const serviceDuration = service?.duration || 30;
    const queueLength = queueData?.filter((item: any) => item.status === 'waiting').length || 0;
    return queueLength * serviceDuration;
  };

  const handleServiceChange = (serviceId: string) => {
    const service = services?.find((s: any) => s.id === parseInt(serviceId));
    if (service && !isWalkIn) {
      const startTime = form.getValues('startTime');
      if (startTime) {
        const start = new Date(startTime);
        const end = new Date(start.getTime() + service.duration * 60000);
        form.setValue('endTime', end.toISOString().slice(0, 16));
      }
    }
  };

  const handleStartTimeChange = (startTime: string) => {
    const serviceId = form.getValues('serviceId');
    const service = services?.find((s: any) => s.id === serviceId);
    if (service && !isWalkIn) {
      const start = new Date(startTime);
      const end = new Date(start.getTime() + service.duration * 60000);
      form.setValue('endTime', end.toISOString().slice(0, 16));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isWalkIn ? "Add Walk-in Customer" : 
             appointmentToEdit ? "Edit Appointment" : "Book Appointment"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select customer..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers?.map((customer: any) => (
                        <SelectItem key={customer.id} value={customer.id.toString()}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="serviceId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select onValueChange={(value) => {
                    field.onChange(parseInt(value));
                    handleServiceChange(value);
                  }}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select service..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {services?.map((service: any) => (
                        <SelectItem key={service.id} value={service.id.toString()}>
                          {service.name} (${service.price})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isWalkIn && (
              <>
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            handleStartTimeChange(e.target.value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="barber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barber</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter barber name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Special requests or notes..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1"
                disabled={createAppointmentMutation.isPending || updateAppointmentMutation.isPending}
              >
                {isWalkIn ? "Add to Queue" : 
                 appointmentToEdit ? "Update Appointment" : "Book Appointment"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
