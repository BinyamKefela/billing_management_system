"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, UserPlus, Building, Check, User, Phone, Mail, MapPin, Briefcase } from "lucide-react";
import { toast } from "react-toastify";
import Link from "next/link";

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const billerSignUpSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  first_name: z.string().min(1, "First name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last name is required"),
  phone_number: z.string().optional(),
  company_name: z.string().min(1, "Company name is required"),
  name: z.string().optional(),
  address: z.string().optional(),
});

type BillerSignUpFormData = z.infer<typeof billerSignUpSchema>;

export default function BillerSignUpPage() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    trigger,
    setValue,
  } = useForm<BillerSignUpFormData>({
    resolver: zodResolver(billerSignUpSchema),
  });

  const formData = watch();

  // Auto-fill name field when company_name changes
  const handleCompanyNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const companyName = e.target.value;
    setValue("company_name", companyName);
    
    // Auto-fill name field if empty
    if (!formData.name) {
      setValue("name", companyName);
    }
  };

  const nextStep = async () => {
    if (step === 1) {
      const isValid = await trigger(["email", "password", "first_name", "last_name"]);
      if (isValid) setStep(2);
    } else if (step === 2) {
      const isValid = await trigger(["company_name"]);
      if (isValid) setStep(3);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const onSubmit = async (data: BillerSignUpFormData) => {
    setLoading(true);
    try {
      // Use name field if provided, otherwise use company_name
      const requestData = {
        ...data,
        name: data.name || data.company_name,
      };

      const res = await fetch(`${BASE_URL}/post_biller`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await res.json();

      if (res.status === 201) {
        toast.success("Biller account created successfully!");
        // Reset form
        Object.keys(data).forEach((key) => {
          setValue(key as keyof BillerSignUpFormData, "");
        });
        setStep(1);
      } else {
        toast.error(responseData.error || "Failed to create biller account");
      }
    } catch (error) {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Sign Up Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Register as Biller</h1>
            <p className="text-gray-600">Join our platform to manage your customers and billing</p>
            
            <div className="flex justify-center mt-6 mb-4">
              <div className="flex items-center">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step >= stepNumber 
                        ? "bg-green-600 text-white" 
                        : "bg-gray-300 text-gray-600"
                    }`}>
                      {step > stepNumber ? <Check className="w-4 h-4" /> : stepNumber}
                    </div>
                    {stepNumber < 3 && (
                      <div className={`w-12 h-1 mx-2 ${
                        step > stepNumber ? "bg-green-600" : "bg-gray-300"
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              Step {step} of 3: {step === 1 ? "Account Info" : step === 2 ? "Business Info" : "Review"}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Account Information */}
            {step === 1 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address *
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="biller@company.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Eye className="w-4 h-4" />
                    Password *
                  </label>
                  <div className="relative">
                    <input
                      {...register("password")}
                      type={showPassword ? "text" : "password"}
                      placeholder="StrongPassword123!"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      First Name *
                    </label>
                    <input
                      {...register("first_name")}
                      placeholder="John"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                    {errors.first_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.first_name.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      Middle Name
                    </label>
                    <input
                      {...register("middle_name")}
                      placeholder="M."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                      <User className="w-4 h-4" />
                      Last Name *
                    </label>
                    <input
                      {...register("last_name")}
                      placeholder="Doe"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                    {errors.last_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.last_name.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <input
                    {...register("phone_number")}
                    placeholder="+251912345678"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Business Information */}
            {step === 2 && (
              <div className="space-y-6 animate-fadeIn">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4" />
                    Company Name *
                  </label>
                  <input
                    {...register("company_name")}
                    onChange={handleCompanyNameChange}
                    placeholder="Ethiopia Water Utility"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                  {errors.company_name && (
                    <p className="text-red-500 text-sm mt-1">{errors.company_name.message}</p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Building className="w-4 h-4" />
                    Display Name
                  </label>
                  <input
                    {...register("name")}
                    placeholder="Ethiopia Water Utility"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This will be displayed to customers. If empty, company name will be used.
                  </p>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="w-4 h-4" />
                    Business Address
                  </label>
                  <textarea
                    {...register("address")}
                    placeholder="Addis Ababa, Bole"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 resize-none"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="bg-gray-50 rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-lg text-gray-900 mb-4">Review Your Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3 border-b pb-2">Account Information</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Email:</span>
                          <p className="text-gray-900">{formData.email}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Name:</span>
                          <p className="text-gray-900">{formData.first_name} {formData.middle_name} {formData.last_name}</p>
                        </div>
                        {formData.phone_number && (
                          <div>
                            <span className="font-medium text-gray-600">Phone:</span>
                            <p className="text-gray-900">{formData.phone_number}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-700 mb-3 border-b pb-2">Business Information</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Company Name:</span>
                          <p className="text-gray-900">{formData.company_name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Display Name:</span>
                          <p className="text-gray-900">{formData.name || formData.company_name}</p>
                        </div>
                        {formData.address && (
                          <div>
                            <span className="font-medium text-gray-600">Address:</span>
                            <p className="text-gray-900">{formData.address}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-green-800 font-medium">Ready to get started as a Biller!</p>
                      <p className="text-green-700 text-sm mt-1">
                        Your biller account will be created after you verify your email. login to your email and verify your account and you can start managing customers and bills immediately.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-4 pt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-all duration-200 flex-1"
                >
                  Previous
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex-1 transform hover:scale-105"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 flex-1 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating Biller Account...
                    </div>
                  ) : (
                    "Create Biller Account"
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-gray-600">
              Already have an account?{" "}
              <div  className="text-green-600 hover:text-green-700 font-semibold transition-colors">
                <Link href="/auth/login">
                Sign in
                </Link>
                
              </div>
            </p>
          </div>
        </div>

        {/* Right Side - Benefits */}
        <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl shadow-xl p-8 text-white">
          <div className="h-full flex flex-col justify-center">
            <div className="text-center mb-8">
              <Building className="w-16 h-16 mx-auto mb-4 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Expand Your Reach</h2>
              <p className="text-green-100 text-lg">
                Join thousands of billers who trust our platform for efficient billing management
              </p>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-1">Automated Invoicing</h3>
                  <p className="text-green-100">Generate and send bills automatically to your customers</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-1">Payment Tracking</h3>
                  <p className="text-green-100">Monitor payments in real-time with detailed analytics</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-1">Customer Portal</h3>
                  <p className="text-green-100">Provide customers with self-service payment options</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-xl mb-1">Secure Platform</h3>
                  <p className="text-green-100">Enterprise-grade security for your business data</p>
                </div>
              </div>
            </div>

            <div className="mt-8 p-4 bg-white bg-opacity-10 rounded-xl">
              <p className="text-green-100 text-sm">
                <strong>Ideal for:</strong> Utility companies, Telecom providers, Subscription services, and all billing businesses
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}