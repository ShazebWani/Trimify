import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertTransactionSchema } from "@shared/schema";
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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  DollarSign,
  Receipt,
  User
} from "lucide-react";

interface POSModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: number;
  appointmentId?: number;
}

interface CartItem {
  serviceId: number;
  serviceName: string;
  price: number;
  quantity: number;
}

const transactionFormSchema = insertTransactionSchema.extend({
  total: z.number().min(0.01, "Total must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
});

export default function POSModal({
  isOpen,
  onClose,
  customerId,
  appointmentId,
}: POSModalProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(customerId || 0);
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

  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      total: 0,
      paymentMethod: "",
    },
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (data: z.infer<typeof transactionFormSchema>) => {
      const transactionData = {
        ...data,
        customerId: selectedCustomerId || undefined,
        appointmentId: appointmentId || undefined,
      };
      await apiRequest("POST", "/api/transactions", transactionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Payment processed",
        description: "Transaction completed successfully",
      });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    },
  });

  const addToCart = (service: any) => {
    const existingItem = cart.find(item => item.serviceId === service.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.serviceId === service.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        serviceId: service.id,
        serviceName: service.name,
        price: Number(service.price),
        quantity: 1
      }]);
    }
  };

  const removeFromCart = (serviceId: number) => {
    setCart(cart.filter(item => item.serviceId !== serviceId));
  };

  const updateQuantity = (serviceId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(serviceId);
      return;
    }
    setCart(cart.map(item => 
      item.serviceId === serviceId 
        ? { ...item, quantity }
        : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleClose = () => {
    onClose();
    setCart([]);
    setSelectedCustomerId(customerId || 0);
    form.reset();
  };

  const onSubmit = (data: z.infer<typeof transactionFormSchema>) => {
    if (cart.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one service to the cart",
        variant: "destructive",
      });
      return;
    }

    const total = calculateTotal();
    createTransactionMutation.mutate({
      ...data,
      total,
    });
  };

  const getCustomerName = (customerId: number) => {
    const customer = customers?.find((c: any) => c.id === customerId);
    return customer?.name || "Unknown Customer";
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Point of Sale
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Services Selection */}
          <div>
            <h3 className="font-semibold mb-4">Select Services</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {services?.map((service: any) => (
                <Card key={service.id} className="cursor-pointer hover:bg-gray-50" onClick={() => addToCart(service)}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-gray-600">{service.duration} min</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${service.price}</p>
                        <Button size="sm" variant="outline">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Cart and Checkout */}
          <div>
            <h3 className="font-semibold mb-4">Cart</h3>
            
            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Customer</label>
              <Select 
                value={selectedCustomerId.toString()} 
                onValueChange={(value) => setSelectedCustomerId(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Walk-in Customer</SelectItem>
                  {customers?.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cart Items */}
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {cart.map((item) => (
                <div key={item.serviceId} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.serviceName}</p>
                    <p className="text-sm text-gray-600">${item.price.toFixed(2)} each</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.serviceId, item.quantity - 1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.serviceId, item.quantity + 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromCart(item.serviceId)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <p className="text-center text-gray-500 py-8">No items in cart</p>
              )}
            </div>

            {/* Total */}
            <div className="mb-4">
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold">Total:</span>
                <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Method */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="digital">Digital Payment</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-3 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={createTransactionMutation.isPending || cart.length === 0}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Process Payment
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
