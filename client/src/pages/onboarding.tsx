import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { onboardingSchema, type OnboardingData } from "@shared/schema";
import { useTheme } from "@/contexts/ThemeContext";
import { Plus, X, Scissors, Palette, Clock, Users, CheckCircle } from "lucide-react";

const defaultBusinessHours = {
  monday: { open: "09:00", close: "18:00", closed: false },
  tuesday: { open: "09:00", close: "18:00", closed: false },
  wednesday: { open: "09:00", close: "18:00", closed: false },
  thursday: { open: "09:00", close: "18:00", closed: false },
  friday: { open: "09:00", close: "18:00", closed: false },
  saturday: { open: "09:00", close: "17:00", closed: false },
  sunday: { open: "10:00", close: "16:00", closed: false },
};

const specialtyOptions = [
  "Classic Haircuts", "Beard Trimming", "Mustache Styling", "Hot Towel Shaves",
  "Skin Fades", "Buzz Cuts", "Scissor Cuts", "Hair Washing", "Styling",
  "Wedding Grooming", "Special Events", "Kids Cuts", "Senior Cuts"
];

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [generatedSubdomain, setGeneratedSubdomain] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { applyTheme } = useTheme();

  const form = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      barbershopName: "",
      address: "",
      phone: "",
      bookingStyle: "both",
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
      logoUrl: "",
      businessHours: defaultBusinessHours,
      barbers: [{ name: "", email: "", phone: "", specialties: [], bio: "", experience: 0 }],
    },
  });

  const onboardingMutation = useMutation({
    mutationFn: async (data: OnboardingData) => {
      return await apiRequest("POST", "/api/onboarding", data);
    },
    onSuccess: () => {
      toast({
        title: "Welcome to Trimify!",
        description: "Your barbershop has been set up successfully. You can now start managing your business.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/");
    },
    onError: (error) => {
      console.error("Onboarding error:", error);
      toast({
        title: "Setup Failed",
        description: "There was an error setting up your barbershop. Please try again.",
        variant: "destructive",
      });
    },
  });

  const checkSubdomain = async (businessName: string) => {
    if (!businessName) return;
    try {
      const response = await apiRequest("GET", `/api/onboarding/subdomain-check?businessName=${encodeURIComponent(businessName)}`);
      setGeneratedSubdomain(response.subdomain);
    } catch (error) {
      console.error("Error checking subdomain:", error);
    }
  };

  const addBarber = () => {
    const currentBarbers = form.getValues("barbers");
    form.setValue("barbers", [...currentBarbers, { name: "", email: "", phone: "", specialties: [], bio: "", experience: 0 }]);
  };

  const removeBarber = (index: number) => {
    const currentBarbers = form.getValues("barbers");
    if (currentBarbers.length > 1) {
      form.setValue("barbers", currentBarbers.filter((_, i) => i !== index));
    }
  };

  const addSpecialty = (barberIndex: number, specialty: string) => {
    const currentBarbers = form.getValues("barbers");
    const barber = currentBarbers[barberIndex];
    if (!barber.specialties.includes(specialty)) {
      barber.specialties.push(specialty);
      form.setValue("barbers", currentBarbers);
    }
  };

  const removeSpecialty = (barberIndex: number, specialty: string) => {
    const currentBarbers = form.getValues("barbers");
    const barber = currentBarbers[barberIndex];
    barber.specialties = barber.specialties.filter(s => s !== specialty);
    form.setValue("barbers", currentBarbers);
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onSubmit = (data: OnboardingData) => {
    onboardingMutation.mutate(data);
  };

  const steps = [
    { number: 1, title: "Business Info", icon: Scissors },
    { number: 2, title: "Branding", icon: Palette },
    { number: 3, title: "Hours", icon: Clock },
    { number: 4, title: "Team", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Scissors className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Welcome to Trimify</h1>
          </div>
          <p className="text-gray-600">Let's set up your barbershop's online presence</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {steps.map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.number}
                  className={`flex flex-col items-center ${
                    step.number === currentStep
                      ? "text-blue-600"
                      : step.number < currentStep
                      ? "text-green-600"
                      : "text-gray-400"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      step.number === currentStep
                        ? "border-blue-600 bg-blue-50"
                        : step.number < currentStep
                        ? "border-green-600 bg-green-50"
                        : "border-gray-300 bg-gray-50"
                    }`}
                  >
                    {step.number < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span className="text-xs mt-1 font-medium">{step.title}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl">
              {currentStep === 1 && "Tell us about your business"}
              {currentStep === 2 && "Choose your branding"}
              {currentStep === 3 && "Set your business hours"}
              {currentStep === 4 && "Add your team"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && "Basic information about your barbershop"}
              {currentStep === 2 && "Colors and styling for your website"}
              {currentStep === 3 && "When are you open for business?"}
              {currentStep === 4 && "Tell us about your barbers"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Step 1: Business Info */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="barbershopName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name *</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="e.g., Classic Cuts Barbershop"
                              onBlur={() => checkSubdomain(field.value)}
                            />
                          </FormControl>
                          {generatedSubdomain && (
                            <FormDescription>
                              Your website will be: <strong>{generatedSubdomain}.trimify.com</strong>
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address *</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="123 Main Street, City, State 12345"
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="(555) 123-4567" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="bookingStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Booking Style *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="How do customers visit you?" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="appointment">Appointment Only</SelectItem>
                              <SelectItem value="walk-in">Walk-in Only</SelectItem>
                              <SelectItem value="both">Both Appointments & Walk-ins</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {/* Step 2: Branding */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="primaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Primary Color</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Input
                                  {...field}
                                  type="color"
                                  className="w-20 h-10 p-1 border rounded"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    applyTheme(e.target.value, form.watch("secondaryColor"));
                                  }}
                                />
                                <Input
                                  {...field}
                                  placeholder="#3b82f6"
                                  className="flex-1"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    applyTheme(e.target.value, form.watch("secondaryColor"));
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>Main color for buttons and highlights</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="secondaryColor"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secondary Color</FormLabel>
                            <FormControl>
                              <div className="flex items-center space-x-2">
                                <Input
                                  {...field}
                                  type="color"
                                  className="w-20 h-10 p-1 border rounded"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    applyTheme(form.watch("primaryColor"), e.target.value);
                                  }}
                                />
                                <Input
                                  {...field}
                                  placeholder="#1e40af"
                                  className="flex-1"
                                  onChange={(e) => {
                                    field.onChange(e);
                                    applyTheme(form.watch("primaryColor"), e.target.value);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormDescription>Accent color for secondary elements</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="logoUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logo URL (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="https://example.com/logo.png" />
                          </FormControl>
                          <FormDescription>
                            If you have a logo online, paste the URL here
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-3">Live Preview</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: form.watch("primaryColor") }}
                          />
                          <div
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: form.watch("secondaryColor") }}
                          />
                          <span className="text-sm text-gray-600">
                            Your brand colors
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            Primary Button
                          </Button>
                          <Button size="sm" variant="secondary">
                            Secondary Button
                          </Button>
                        </div>
                        <div className="p-2 border rounded bg-accent text-accent-foreground">
                          <p className="text-sm">This is how your content will look with your brand colors</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 3: Business Hours */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    {Object.entries(defaultBusinessHours).map(([day, hours]) => (
                      <div key={day} className="flex items-center space-x-4 p-4 border rounded-lg">
                        <div className="w-20 capitalize font-medium">{day}</div>
                        <FormField
                          control={form.control}
                          name={`businessHours.${day as keyof typeof defaultBusinessHours}.closed`}
                          render={({ field }) => (
                            <FormItem className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm">Closed</FormLabel>
                            </FormItem>
                          )}
                        />
                        {!form.watch(`businessHours.${day as keyof typeof defaultBusinessHours}.closed`) && (
                          <>
                            <FormField
                              control={form.control}
                              name={`businessHours.${day as keyof typeof defaultBusinessHours}.open`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} type="time" className="w-32" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <span className="text-gray-500">to</span>
                            <FormField
                              control={form.control}
                              name={`businessHours.${day as keyof typeof defaultBusinessHours}.close`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input {...field} type="time" className="w-32" />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Step 4: Team */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    {form.watch("barbers").map((barber, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium">Barber {index + 1}</h3>
                          {form.watch("barbers").length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeBarber(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`barbers.${index}.name`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Name *</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="John Smith" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`barbers.${index}.experience`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Years of Experience</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    min="0"
                                    placeholder="5"
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`barbers.${index}.email`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" placeholder="john@example.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`barbers.${index}.phone`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone</FormLabel>
                                <FormControl>
                                  <Input {...field} placeholder="(555) 123-4567" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name={`barbers.${index}.bio`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bio</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Tell customers about this barber's background and style..."
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div>
                          <FormLabel>Specialties</FormLabel>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {barber.specialties.map((specialty) => (
                              <Badge
                                key={specialty}
                                variant="secondary"
                                className="cursor-pointer"
                                onClick={() => removeSpecialty(index, specialty)}
                              >
                                {specialty}
                                <X className="h-3 w-3 ml-1" />
                              </Badge>
                            ))}
                          </div>
                          <Select onValueChange={(value) => addSpecialty(index, value)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Add a specialty" />
                            </SelectTrigger>
                            <SelectContent>
                              {specialtyOptions
                                .filter(option => !barber.specialties.includes(option))
                                .map((option) => (
                                  <SelectItem key={option} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={addBarber}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Barber
                    </Button>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    Previous
                  </Button>
                  
                  {currentStep < 4 ? (
                    <Button type="button" onClick={nextStep}>
                      Next
                    </Button>
                  ) : (
                    <Button type="submit" disabled={onboardingMutation.isPending}>
                      {onboardingMutation.isPending ? "Setting up..." : "Complete Setup"}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}