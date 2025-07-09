import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Settings as SettingsIcon, 
  User, 
  Store, 
  Palette, 
  Bell,
  Shield,
  Save,
  Plus,
  Trash2,
  Upload,
  Clock,
  MapPin,
  Phone,
  Mail,
  Globe
} from "lucide-react";

const profileSchema = z.object({
  barbershopName: z.string().min(1, "Barbershop name is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.string().min(1, "Address is required"),
  primaryColor: z.string().min(1, "Primary color is required"),
  secondaryColor: z.string().min(1, "Secondary color is required"),
  bookingStyle: z.enum(["appointment", "walk-in", "both"]),
  logoUrl: z.string().optional(),
});

const businessHoursSchema = z.object({
  monday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
  tuesday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
  wednesday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
  thursday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
  friday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
  saturday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
  sunday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type BusinessHoursData = z.infer<typeof businessHoursSchema>;

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [primaryColorPreview, setPrimaryColorPreview] = useState("#3b82f6");
  const [secondaryColorPreview, setSecondaryColorPreview] = useState("#1e40af");
  
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { applyTheme } = useTheme();
  const queryClient = useQueryClient();

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      barbershopName: "",
      phone: "",
      address: "",
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
      bookingStyle: "both",
      logoUrl: "",
    },
  });

  const businessHoursForm = useForm<BusinessHoursData>({
    resolver: zodResolver(businessHoursSchema),
    defaultValues: {
      monday: { open: "09:00", close: "18:00", isOpen: true },
      tuesday: { open: "09:00", close: "18:00", isOpen: true },
      wednesday: { open: "09:00", close: "18:00", isOpen: true },
      thursday: { open: "09:00", close: "18:00", isOpen: true },
      friday: { open: "09:00", close: "20:00", isOpen: true },
      saturday: { open: "08:00", close: "19:00", isOpen: true },
      sunday: { open: "10:00", close: "16:00", isOpen: false },
    },
  });

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

  // Populate form with user data
  useEffect(() => {
    if (user) {
      profileForm.reset({
        barbershopName: user.barbershopName || "",
        phone: user.phone || "",
        address: user.address || "",
        primaryColor: user.primaryColor || "#3b82f6",
        secondaryColor: user.secondaryColor || "#1e40af",
        bookingStyle: user.bookingStyle || "both",
        logoUrl: user.logoUrl || "",
      });
      setPrimaryColorPreview(user.primaryColor || "#3b82f6");
      setSecondaryColorPreview(user.secondaryColor || "#1e40af");

      if (user.businessHours) {
        businessHoursForm.reset(user.businessHours);
      }
    }
  }, [user, profileForm, businessHoursForm]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PUT", "/api/user/profile", data);
    },
    onSuccess: (updatedUser) => {
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.setQueryData(["/api/auth/user"], updatedUser);
      applyTheme(updatedUser.primaryColor, updatedUser.secondaryColor);
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBusinessHoursMutation = useMutation({
    mutationFn: async (data: BusinessHoursData) => {
      return await apiRequest("PUT", "/api/user/profile", { businessHours: data });
    },
    onSuccess: () => {
      toast({
        title: "Business hours updated",
        description: "Your business hours have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: "Failed to update business hours. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const onBusinessHoursSubmit = (data: BusinessHoursData) => {
    updateBusinessHoursMutation.mutate(data);
  };

  const handleColorPreview = (color: string, type: 'primary' | 'secondary') => {
    if (type === 'primary') {
      setPrimaryColorPreview(color);
      applyTheme(color, secondaryColorPreview);
    } else {
      setSecondaryColorPreview(color);
      applyTheme(primaryColorPreview, color);
    }
  };

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

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
          <h1 className="text-2xl font-bold text-primary mb-2">Settings</h1>
          <p className="text-gray-600">Customize your barbershop profile, colors, and preferences.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <Store className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="hours" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Business Hours
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Business Profile</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="barbershopName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barbershop Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter your barbershop name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={profileForm.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Enter your complete business address" 
                              rows={3}
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="bookingStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Booking Style</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select booking style" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="appointment">Appointment Only</SelectItem>
                                <SelectItem value="walk-in">Walk-in Only</SelectItem>
                                <SelectItem value="both">Both</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Logo URL (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/logo.png" {...field} />
                            </FormControl>
                            <FormDescription>
                              Upload your logo to an image hosting service and paste the URL here.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Profile
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Brand Colors</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={profileForm.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormDescription>
                              Used for barbershop name, main buttons, and key UI elements.
                            </FormDescription>
                            <FormControl>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="color"
                                  className="w-16 h-10 p-1 rounded border"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleColorPreview(e.target.value, 'primary');
                                  }}
                                />
                                <Input
                                  type="text"
                                  placeholder="#3b82f6"
                                  className="flex-1"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleColorPreview(e.target.value, 'primary');
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={profileForm.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Color</FormLabel>
                            <FormDescription>
                              Used for supporting text, icons, and accent elements.
                            </FormDescription>
                            <FormControl>
                              <div className="flex items-center gap-3">
                                <Input
                                  type="color"
                                  className="w-16 h-10 p-1 rounded border"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleColorPreview(e.target.value, 'secondary');
                                  }}
                                />
                                <Input
                                  type="text"
                                  placeholder="#1e40af"
                                  className="flex-1"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleColorPreview(e.target.value, 'secondary');
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-medium text-gray-900 mb-3">Preview</h3>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: primaryColorPreview }}
                          ></div>
                          <span style={{ color: primaryColorPreview }} className="font-semibold">
                            {user?.barbershopName || 'Your Barbershop'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            className="px-4 py-2 rounded-lg text-white font-medium"
                            style={{ backgroundColor: primaryColorPreview }}
                          >
                            Primary Button
                          </button>
                          <button 
                            className="px-4 py-2 rounded-lg text-white font-medium"
                            style={{ backgroundColor: secondaryColorPreview }}
                          >
                            Secondary Button
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                        disabled={updateProfileMutation.isPending}
                      >
                        {updateProfileMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Colors
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Business Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...businessHoursForm}>
                  <form onSubmit={businessHoursForm.handleSubmit(onBusinessHoursSubmit)} className="space-y-4">
                    {daysOfWeek.map((day) => (
                      <div key={day.key} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                        <div className="w-20 font-medium text-gray-900">
                          {day.label}
                        </div>
                        
                        <FormField
                          control={businessHoursForm.control}
                          name={`${day.key as keyof BusinessHoursData}.isOpen`}
                          render={({ field }) => (
                            <FormItem className="flex items-center gap-2">
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <div className="flex items-center gap-2 flex-1">
                          <FormField
                            control={businessHoursForm.control}
                            name={`${day.key as keyof BusinessHoursData}.open`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="time"
                                    className="w-32"
                                    {...field}
                                    disabled={!businessHoursForm.watch(`${day.key as keyof BusinessHoursData}.isOpen`)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <span className="text-gray-500">to</span>
                          <FormField
                            control={businessHoursForm.control}
                            name={`${day.key as keyof BusinessHoursData}.close`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="time"
                                    className="w-32"
                                    {...field}
                                    disabled={!businessHoursForm.watch(`${day.key as keyof BusinessHoursData}.isOpen`)}
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    ))}

                    <div className="pt-4">
                      <Button 
                        type="submit" 
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg"
                        disabled={updateBusinessHoursMutation.isPending}
                      >
                        {updateBusinessHoursMutation.isPending ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Hours
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-primary">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-gray-600">
                        Receive notifications about appointments and bookings via email.
                      </p>
                    </div>
                    <Switch id="email-notifications" />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="sms-notifications">SMS Notifications</Label>
                      <p className="text-sm text-gray-600">
                        Get instant SMS alerts for important updates.
                      </p>
                    </div>
                    <Switch id="sms-notifications" />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="marketing-notifications">Marketing Updates</Label>
                      <p className="text-sm text-gray-600">
                        Receive updates about new features and promotions.
                      </p>
                    </div>
                    <Switch id="marketing-notifications" />
                  </div>

                  <div className="pt-4">
                    <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg">
                      <Save className="h-4 w-4 mr-2" />
                      Save Preferences
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}